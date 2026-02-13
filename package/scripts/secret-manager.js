/**
 * Secret Manager Module
 * Manages MCP secrets using Bitwarden integration
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const os = require("os");

const HOME = os.homedir();
const BITWARDEN_FOLDER = "MCP Secrets";

/**
 * Validate that Bitwarden CLI is installed
 */
function validateBitwardenCLI() {
    try {
        execSync("which bw", { stdio: "pipe" });
        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            message: "Bitwarden CLI not found. Install with: npm install -g @bitwarden/cli",
        };
    }
}

/**
 * Check Bitwarden login status using `bw status`
 */
function getBitwardenStatus() {
    try {
        const result = spawnSync("bw", ["status"], {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        const output = result.stdout || "";
        const json = JSON.parse(output.trim());
        return json.status; // "unauthenticated", "locked", "unlocked"
    } catch {
        return "unauthenticated";
    }
}

/**
 * Login to Bitwarden using API key (BW_CLIENTID + BW_CLIENTSECRET)
 */
function loginBitwarden() {
    const clientId = process.env.BW_CLIENTID;
    const clientSecret = process.env.BW_CLIENTSECRET;

    if (!clientId || !clientSecret) {
        return {
            success: false,
            message:
                "Bitwarden API credentials not set. Add to ~/.zshrc:\n" +
                "  export BW_CLIENTID=\"user.xxx\"\n" +
                "  export BW_CLIENTSECRET=\"yyy\"\n\n" +
                "  Get your API key from: https://vault.bitwarden.com/#/settings/security/security-keys",
        };
    }

    try {
        const result = spawnSync("bw", ["login", "--apikey"], {
            encoding: "utf-8",
            env: { ...process.env, BW_CLIENTID: clientId, BW_CLIENTSECRET: clientSecret },
            stdio: ["pipe", "pipe", "pipe"],
        });

        if (result.status === 0) {
            return { success: true };
        } else {
            const errorMsg = result.stderr || result.stdout || "Unknown error";
            return {
                success: false,
                message: `Failed to login: ${errorMsg.trim()}`,
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Failed to login: ${error.message}`,
        };
    }
}

/**
 * Ensure Bitwarden is logged in, auto-login if needed
 */
function ensureBitwardenLogin() {
    const status = getBitwardenStatus();

    if (status === "unauthenticated") {
        console.log("🔑 Logging into Bitwarden...");
        const loginResult = loginBitwarden();
        if (!loginResult.success) {
            return { valid: false, message: loginResult.message };
        }
        console.log("✓ Logged in successfully\n");
    } else {
        console.log("✓ Already logged into Bitwarden\n");
    }

    return { valid: true };
}

/**
 * Prompt user for Bitwarden master password (masked input)
 * Uses dynamic import for inquirer (ES Module)
 */
async function promptPassword() {
    const inquirer = await import("inquirer");
    const answers = await inquirer.default.prompt([
        {
            type: "password",
            name: "password",
            message: "Enter your Bitwarden master password:",
            mask: "*",
        },
    ]);
    return answers.password;
}

/**
 * Unlock Bitwarden vault with password
 * Returns session key or null if failed
 * Uses spawnSync to avoid shell injection
 */
function unlockBitwarden(password) {
    try {
        // Use positional password argument for compatibility with older Bitwarden CLI versions
        // Since we use spawnSync without shell: true, the password doesn't leak into shell history
        const result = spawnSync("bw", ["unlock", password, "--raw"], {
            encoding: "utf-8",
        });

        if (result.status === 0 && result.stdout) {
            return { success: true, sessionKey: result.stdout.trim() };
        } else {
            const errorMsg = result.stderr || result.stdout || "Unknown error";
            return {
                success: false,
                message: `Failed to unlock vault: ${errorMsg.trim()}`,
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Failed to unlock vault: ${error.message}`,
        };
    }
}

/**
 * Discover required secrets from MCP server configs in the repo
 * Scans .agent/mcp-servers/{name}/config.json for bitwardenEnv fields
 */
function discoverRequiredSecrets() {
    const mcpInstaller = require("./mcp-installer");
    const envs = mcpInstaller.collectBitwardenEnvs();

    if (envs.length === 0) {
        const mcpDir = mcpInstaller.getMcpServersDir();
        if (!mcpDir) {
            return { found: false, secrets: [], reason: "No repository configured or no MCP servers found" };
        }
        return { found: true, secrets: [] };
    }

    // Collect unique Bitwarden item names to fetch
    const secretNames = [...new Set(envs.map((e) => e.bitwardenItem))];

    return { found: true, secrets: secretNames, envs };
}

/**
 * Fetch secrets from Bitwarden vault
 * Only searches in "MCP Secrets" folder
 */
function fetchSecretsFromBitwarden(sessionKey, secretNames) {
    const results = {
        found: [],
        missing: [],
    };

    try {
        // Step 1: Get folder ID for "MCP Secrets"
        const foldersJson = execSync(`bw list folders --session ${sessionKey}`, {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        const folders = JSON.parse(foldersJson);
        const mcpFolder = folders.find((f) => f.name === BITWARDEN_FOLDER);

        if (!mcpFolder) {
            console.warn(`\n⚠️  Folder "${BITWARDEN_FOLDER}" not found in Bitwarden vault`);
            console.warn(`   Create folder "${BITWARDEN_FOLDER}" and add your secrets there\n`);
            // All secrets are missing since folder doesn't exist
            secretNames.forEach((name) => results.missing.push(name));
            return results;
        }

        // Step 2: List all items in "MCP Secrets" folder
        const itemsJson = execSync(`bw list items --folderid ${mcpFolder.id} --session ${sessionKey}`, {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        const items = JSON.parse(itemsJson);

        // Step 3: Match secrets by name
        for (const secretName of secretNames) {
            const item = items.find((i) => i.name === secretName);

            if (item && item.login && item.login.password) {
                results.found.push({
                    name: secretName,
                    value: item.login.password,
                });
            } else {
                results.missing.push(secretName);
            }
        }
    } catch (error) {
        console.error(`\n❌ Error fetching from Bitwarden: ${error.message}\n`);
        // On error, mark all as missing
        secretNames.forEach((name) => results.missing.push(name));
    }

    return results;
}

/**
 * Detect shell profile file
 */
function detectShellProfile() {
    const shell = process.env.SHELL || "";

    if (shell.includes("zsh")) {
        return path.join(HOME, ".zshrc");
    } else if (shell.includes("bash")) {
        return path.join(HOME, ".bashrc");
    }

    // Default to zsh on macOS
    return path.join(HOME, ".zshrc");
}

/**
 * Write secrets to shell profile
 */
function writeToShellProfile(secrets) {
    const profilePath = detectShellProfile();
    const timestamp = new Date().toISOString();

    const startMarker = "# === AI Agent MCP Secrets (auto-generated, do not edit manually) ===";
    const endMarker = `# === End AI Agent MCP Secrets (last updated: ${timestamp}) ===`;

    let profileContent = "";
    if (fs.existsSync(profilePath)) {
        profileContent = fs.readFileSync(profilePath, "utf-8");
    }

    // Build secrets block
    const secretsBlock = secrets.map((s) => `export ${s.name}="${s.value}"`).join("\n");
    const fullBlock = `${startMarker}\n${secretsBlock}\n${endMarker}`;

    // Check if markers already exist
    const startIndex = profileContent.indexOf(startMarker);
    const endIndex = profileContent.indexOf("# === End AI Agent MCP Secrets");

    if (startIndex !== -1 && endIndex !== -1) {
        // Replace existing block
        const beforeBlock = profileContent.substring(0, startIndex);
        const afterBlock = profileContent.substring(
            profileContent.indexOf("\n", endIndex) + 1
        );
        profileContent = beforeBlock + fullBlock + "\n" + afterBlock;
    } else {
        // Append new block
        profileContent += "\n" + fullBlock + "\n";
    }

    fs.writeFileSync(profilePath, profileContent, "utf-8");

    return { path: profilePath, count: secrets.length };
}

/**
 * Main sync function
 */
async function syncSecrets() {
    let sessionKey = null;

    try {
        console.log("\n🔐 Bitwarden Secret Sync\n");

        // 1. Validate Bitwarden CLI
        const cliCheck = validateBitwardenCLI();
        if (!cliCheck.valid) {
            console.error(`❌ ${cliCheck.message}\n`);
            process.exit(1);
        }

        // 2. Check login status and auto-login if needed
        const authCheck = ensureBitwardenLogin();
        if (!authCheck.valid) {
            console.error(`❌ ${authCheck.message}\n`);
            process.exit(1);
        }

        // 3. Prompt for password
        const password = await promptPassword();

        // 4. Unlock vault
        console.log("\n🔓 Unlocking vault...");
        const unlockResult = unlockBitwarden(password);

        if (!unlockResult.success) {
            console.error(`❌ ${unlockResult.message}\n`);
            process.exit(1);
        }

        console.log("✓ Vault unlocked\n");
        sessionKey = unlockResult.sessionKey;

        // 5. Discover required secrets from repo's bitwardenEnv
        console.log("🔍 Scanning MCP server configs for required secrets...");
        const discovery = discoverRequiredSecrets();

        if (!discovery.found) {
            console.log(`⚠️  ${discovery.reason}`);
            console.log("\n💡 Configure a repository first: ai-agent init --repo <url>\n");
            return;
        }

        if (discovery.secrets.length === 0) {
            console.log("No bitwardenEnv entries found in MCP server configs.\n");
            return;
        }

        console.log(`Found ${discovery.secrets.length} secret(s) to fetch:`);
        discovery.secrets.forEach((name) => {
            console.log(`  • ${name}`);
        });

        // 6. Fetch secrets from Bitwarden
        console.log(`\n🔐 Fetching from Bitwarden (folder: ${BITWARDEN_FOLDER})...`);
        const fetchResults = fetchSecretsFromBitwarden(sessionKey, discovery.secrets);

        fetchResults.found.forEach((secret) => {
            console.log(`  ✓ ${secret.name}`);
        });

        fetchResults.missing.forEach((name) => {
            console.log(`  ⚠ ${name} (not found in vault)`);
        });

        // 7. Install MCP servers with resolved secrets to Antigravity
        if (fetchResults.found.length > 0) {
            const mcpInstaller = require("./mcp-installer");

            // Build resolvedSecrets map: bitwardenItemName → value
            const resolvedSecrets = {};
            fetchResults.found.forEach((s) => {
                resolvedSecrets[s.name] = s.value;
            });

            console.log("\n📦 Installing MCP servers to Antigravity...");
            const installResult = mcpInstaller.installMcpServersWithSecrets(resolvedSecrets);

            installResult.servers.forEach((s) => {
                if (s.secretsCount > 0) {
                    console.log(`  ✓ ${s.name}: ${s.secretsCount} secret(s) resolved`);
                } else {
                    console.log(`  ✓ ${s.name}: no secrets needed`);
                }
            });
        }

        // 8. Summary
        console.log("\n✅ Secrets synced successfully!\n");

        if (fetchResults.missing.length > 0) {
            console.log(`⚠️  Missing secrets: ${fetchResults.missing.join(", ")}`);
            console.log(`   Add them to Bitwarden vault folder "${BITWARDEN_FOLDER}"\n`);
        }
    } finally {
        // Cleanup: Lock vault to invalidate session key
        if (sessionKey) {
            try {
                execSync("bw lock", { stdio: "pipe" });
            } catch (e) {
                // Silent fail - vault may already be locked
            }
            sessionKey = null;
        }
    }
}

module.exports = {
    syncSecrets,
    validateBitwardenCLI,
    ensureBitwardenLogin,
    promptPassword,
    unlockBitwarden,
    discoverRequiredSecrets,
    fetchSecretsFromBitwarden,
    detectShellProfile,
    writeToShellProfile,
};
