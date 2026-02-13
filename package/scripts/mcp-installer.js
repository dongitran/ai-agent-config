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
 * Install MCP servers to Antigravity's mcp_config.json
 * This is the "pull" flow - installs structure without resolved secrets
 * @param {Object} options - { force: boolean }
 * @returns {{ added: number, skipped: number, servers: string[] }}
 */
function installMcpServers(options = {}) {
    const { force = false } = options;
    const antigravity = platforms.getByName("antigravity");

    if (!antigravity || !antigravity.mcpConfigPath) {
        return { added: 0, skipped: 0, servers: [] };
    }

    const servers = getAvailableMcpServers().filter((s) => s.enabled !== false);
    if (servers.length === 0) {
        return { added: 0, skipped: 0, servers: [] };
    }

    // Read existing mcp_config.json
    let mcpConfig = { mcpServers: {} };
    if (fs.existsSync(antigravity.mcpConfigPath)) {
        try {
            mcpConfig = JSON.parse(fs.readFileSync(antigravity.mcpConfigPath, "utf-8"));
            if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
        } catch {
            mcpConfig = { mcpServers: {} };
        }
    }

    let added = 0;
    let skipped = 0;
    const serverNames = [];

    for (const server of servers) {
        const existing = mcpConfig.mcpServers[server.name];

        if (existing && !force) {
            skipped++;
            serverNames.push(server.name);
            continue;
        }

        // Build server entry for Antigravity format
        const entry = {
            command: server.command,
            args: server.args,
        };

        // Preserve existing env if not forcing
        if (existing && existing.env) {
            entry.env = existing.env;
        }

        if (server.disabledTools && server.disabledTools.length > 0) {
            entry.disabledTools = server.disabledTools;
        }

        mcpConfig.mcpServers[server.name] = entry;
        added++;
        serverNames.push(server.name);
    }

    // Write back
    if (added > 0) {
        const configDir = path.dirname(antigravity.mcpConfigPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(antigravity.mcpConfigPath, JSON.stringify(mcpConfig, null, 2) + "\n", "utf-8");
    }

    return { added, skipped, servers: serverNames };
}

/**
 * Install MCP servers with resolved secrets to Antigravity
 * This is the "secrets sync" flow - updates env with real values
 * @param {Object} resolvedSecrets - Map of envVar → resolvedValue
 * @returns {{ installed: number, servers: Array<{ name: string, secretsCount: number }> }}
 */
function installMcpServersWithSecrets(resolvedSecrets) {
    const antigravity = platforms.getByName("antigravity");

    if (!antigravity || !antigravity.mcpConfigPath) {
        return { installed: 0, servers: [] };
    }

    const allServers = getAvailableMcpServers().filter((s) => s.enabled !== false);
    if (allServers.length === 0) {
        return { installed: 0, servers: [] };
    }

    // Read existing mcp_config.json
    let mcpConfig = { mcpServers: {} };
    if (fs.existsSync(antigravity.mcpConfigPath)) {
        try {
            mcpConfig = JSON.parse(fs.readFileSync(antigravity.mcpConfigPath, "utf-8"));
            if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
        } catch {
            mcpConfig = { mcpServers: {} };
        }
    }

    let installed = 0;
    const serverResults = [];

    for (const server of allServers) {
        const existing = mcpConfig.mcpServers[server.name] || {};

        // Build entry: keep existing custom fields (disabledTools user may have customized)
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

        // Preserve user-customized disabledTools from existing config
        if (existing.disabledTools) {
            entry.disabledTools = existing.disabledTools;
        } else if (server.disabledTools && server.disabledTools.length > 0) {
            entry.disabledTools = server.disabledTools;
        }

        mcpConfig.mcpServers[server.name] = entry;
        installed++;
    }

    // Write back
    if (installed > 0) {
        const configDir = path.dirname(antigravity.mcpConfigPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(antigravity.mcpConfigPath, JSON.stringify(mcpConfig, null, 2) + "\n", "utf-8");
    }

    return { installed, servers: serverResults };
}

module.exports = {
    getMcpServersDir,
    validateMcpConfig,
    getAvailableMcpServers,
    collectBitwardenEnvs,
    installMcpServers,
    installMcpServersWithSecrets,
    SKIP_FOLDERS,
};
