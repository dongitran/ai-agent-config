/**
 * MCP Installer Module
 * Handles discovering, validating, and installing MCP servers from repo to platforms
 */

const fs = require("fs");
const path = require("path");
const platforms = require("./platforms");
const configManager = require("./config-manager");

const SKIP_FOLDERS = ["bitwarden"];

/**
 * Get the MCP servers directory from the user's sync repo
 * @returns {string|null} Path to .agent/mcp-servers/ or null
 */
function getMcpServersDir() {
    const config = configManager.loadConfig();
    const repoLocal = config.repository && config.repository.local;
    if (!repoLocal) return null;

    const expanded = repoLocal.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
    const mcpDir = path.join(expanded, ".agent", "mcp-servers");
    return fs.existsSync(mcpDir) ? mcpDir : null;
}

/**
 * Validate an MCP server config
 * @param {Object} config - Parsed config.json
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateMcpConfig(config) {
    const errors = [];

    if (!config.name || typeof config.name !== "string") {
        errors.push("Missing or invalid 'name' field");
    }
    if (!config.command || typeof config.command !== "string") {
        errors.push("Missing or invalid 'command' field");
    }
    if (!Array.isArray(config.args)) {
        errors.push("Missing or invalid 'args' field (must be array)");
    }
    if (config.bitwardenEnv && typeof config.bitwardenEnv !== "object") {
        errors.push("'bitwardenEnv' must be an object");
    }
    if (config.disabledTools && !Array.isArray(config.disabledTools)) {
        errors.push("'disabledTools' must be an array");
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Get all available MCP servers from the repo
 * @returns {Array<Object>} Array of parsed and validated MCP server configs
 */
function getAvailableMcpServers() {
    const mcpDir = getMcpServersDir();
    if (!mcpDir) return [];

    const servers = [];

    const entries = fs.readdirSync(mcpDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (SKIP_FOLDERS.includes(entry.name)) continue;

        const configPath = path.join(mcpDir, entry.name, "config.json");
        if (!fs.existsSync(configPath)) continue;

        try {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            const validation = validateMcpConfig(config);
            if (!validation.valid) {
                console.warn(`  ⚠️  Invalid MCP config in ${entry.name}/: ${validation.errors.join(", ")}`);
                continue;
            }
            servers.push(config);
        } catch (error) {
            console.warn(`  ⚠️  Failed to parse ${entry.name}/config.json: ${error.message}`);
        }
    }

    return servers;
}

/**
 * Collect all bitwardenEnv entries from MCP server configs
 * @returns {Array<{ serverName: string, envVar: string, bitwardenItem: string }>}
 */
function collectBitwardenEnvs() {
    const servers = getAvailableMcpServers();
    const envs = [];

    for (const server of servers) {
        if (server.enabled === false) continue;
        if (!server.bitwardenEnv) continue;

        for (const [envVar, bitwardenItem] of Object.entries(server.bitwardenEnv)) {
            envs.push({
                serverName: server.name,
                envVar,
                bitwardenItem,
            });
        }
    }

    return envs;
}

/**
 * Write MCP servers to a platform's config file
 * @param {string} configPath - Path to platform's MCP config file
 * @param {Array} servers - MCP server configs to install
 * @param {Object} options - { force, platformName }
 * @returns {{ added: number, skipped: number }}
 */
function writeMcpToPlatformConfig(configPath, servers, options = {}) {
    const { force = false, platformName = "" } = options;

    // Read existing config — preserve ALL existing keys (e.g. Claude's "preferences")
    let config = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            if (!config.mcpServers) config.mcpServers = {};
        } catch {
            config = { mcpServers: {} };
        }
    }

    let added = 0;
    let skipped = 0;

    for (const server of servers) {
        const existing = config.mcpServers[server.name];

        if (existing && !force) {
            skipped++;
            continue;
        }

        const entry = {
            command: server.command,
            args: server.args,
        };

        // Preserve existing env
        if (existing && existing.env) {
            entry.env = existing.env;
        }

        // disabledTools: only add for platforms that support it (not Claude)
        if (platformName !== "claude" && server.disabledTools && server.disabledTools.length > 0) {
            entry.disabledTools = server.disabledTools;
        }

        config.mcpServers[server.name] = entry;
        added++;
    }

    // Write back (create directory if needed)
    if (added > 0) {
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
        // Set restrictive permissions (owner read/write only) to protect secrets
        // Only on Unix-like systems (macOS, Linux) - Windows uses ACL instead
        if (process.platform !== "win32") {
            try {
                fs.chmodSync(configPath, 0o600);
            } catch (e) {
                console.warn(`⚠️  Warning: Could not set file permissions on ${configPath}: ${e.message}`);
            }
        }
    }

    return { added, skipped };
}

/**
 * Install MCP servers to platforms' config files
 * This is the "pull" flow - installs structure without resolved secrets
 * @param {Object} options - { force: boolean, platform: Object|null }
 * @returns {{ added: number, skipped: number, servers: string[] }}
 */
function installMcpServers(options = {}) {
    const { force = false, platform = null } = options;

    const servers = getAvailableMcpServers().filter((s) => s.enabled !== false);
    if (servers.length === 0) {
        return { added: 0, skipped: 0, servers: [] };
    }

    // Determine target platforms
    const targetPlatforms = [];
    if (platform) {
        // Single platform specified
        if (platform.mcpConfigPath) targetPlatforms.push(platform);
    } else {
        // All detected platforms with MCP support
        for (const p of platforms.detectAll()) {
            const full = platforms.getByName(p.name);
            if (full && full.mcpConfigPath) targetPlatforms.push(full);
        }
    }

    if (targetPlatforms.length === 0) {
        return { added: 0, skipped: 0, servers: [] };
    }

    let totalAdded = 0;
    let totalSkipped = 0;
    const serverNames = [...new Set(servers.map((s) => s.name))];

    for (const p of targetPlatforms) {
        const result = writeMcpToPlatformConfig(p.mcpConfigPath, servers, {
            force,
            platformName: p.name,
        });
        totalAdded += result.added;
        totalSkipped += result.skipped;
    }

    return { added: totalAdded, skipped: totalSkipped, servers: serverNames };
}

/**
 * Write MCP servers with resolved secrets to a platform's config file
 * @param {string} configPath - Path to platform's MCP config file
 * @param {Array} servers - MCP server configs
 * @param {Object} resolvedSecrets - Map of bitwardenItem → resolvedValue
 * @param {string} platformName - Platform name for disabledTools handling
 * @returns {{ installed: number, servers: Array<{ name: string, secretsCount: number }> }}
 */
function writeMcpWithSecretsToPlatformConfig(configPath, servers, resolvedSecrets, platformName) {
    // Read existing config — preserve ALL existing keys
    let config = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            if (!config.mcpServers) config.mcpServers = {};
        } catch {
            config = { mcpServers: {} };
        }
    }

    let installed = 0;
    const serverResults = [];

    for (const server of servers) {
        const existing = config.mcpServers[server.name] || {};

        const entry = {
            command: server.command,
            args: server.args,
        };

        // Build env from resolved secrets
        if (server.bitwardenEnv) {
            const env = {};
            let secretsCount = 0;

            for (const [envVar, bitwardenItem] of Object.entries(server.bitwardenEnv)) {
                if (resolvedSecrets[bitwardenItem]) {
                    env[envVar] = resolvedSecrets[bitwardenItem];
                    secretsCount++;
                }
            }

            if (Object.keys(env).length > 0) {
                entry.env = { ...(existing.env || {}), ...env };
            }

            serverResults.push({ name: server.name, secretsCount });
        } else {
            serverResults.push({ name: server.name, secretsCount: 0 });
        }

        // disabledTools: only for platforms that support it (not Claude)
        if (platformName !== "claude") {
            if (existing.disabledTools) {
                entry.disabledTools = existing.disabledTools;
            } else if (server.disabledTools && server.disabledTools.length > 0) {
                entry.disabledTools = server.disabledTools;
            }
        }

        config.mcpServers[server.name] = entry;
        installed++;
    }

    // Write back
    if (installed > 0) {
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
        // Set restrictive permissions (owner read/write only) to protect secrets
        // Only on Unix-like systems (macOS, Linux) - Windows uses ACL instead
        if (process.platform !== "win32") {
            try {
                fs.chmodSync(configPath, 0o600);
            } catch (e) {
                console.warn(`⚠️  Warning: Could not set file permissions on ${configPath}: ${e.message}`);
            }
        }
    }

    return { installed, servers: serverResults };
}

/**
 * Install MCP servers with resolved secrets to all MCP-capable platforms
 * This is the "secrets sync" flow - updates env with real values
 * @param {Object} resolvedSecrets - Map of bitwardenItem → resolvedValue
 * @returns {{ installed: number, servers: Array<{ name: string, secretsCount: number }> }}
 */
function installMcpServersWithSecrets(resolvedSecrets) {
    const allServers = getAvailableMcpServers().filter((s) => s.enabled !== false);
    if (allServers.length === 0) {
        return { installed: 0, servers: [] };
    }

    // All detected platforms with MCP support
    const targetPlatforms = [];
    for (const p of platforms.detectAll()) {
        const full = platforms.getByName(p.name);
        if (full && full.mcpConfigPath) targetPlatforms.push(full);
    }

    if (targetPlatforms.length === 0) {
        return { installed: 0, servers: [] };
    }

    let totalInstalled = 0;
    let aggregatedServers = [];

    for (const p of targetPlatforms) {
        const result = writeMcpWithSecretsToPlatformConfig(
            p.mcpConfigPath, allServers, resolvedSecrets, p.name
        );
        totalInstalled += result.installed;
        // Use server results from last platform (they're the same servers)
        if (result.servers.length > 0) {
            aggregatedServers = result.servers;
        }
    }

    return { installed: totalInstalled, servers: aggregatedServers };
}

module.exports = {
    getMcpServersDir,
    validateMcpConfig,
    getAvailableMcpServers,
    collectBitwardenEnvs,
    installMcpServers,
    installMcpServersWithSecrets,
    writeMcpToPlatformConfig,
    SKIP_FOLDERS,
};
