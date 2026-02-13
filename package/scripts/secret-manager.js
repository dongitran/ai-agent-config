/**
 * Secret Manager Module
 * Manages MCP secrets using Bitwarden integration
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");
const inquirer = require("inquirer");
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
 * Validate that Bitwarden API credentials are set
 */
function validateBitwardenAuth() {
    const clientId = process.env.BW_CLIENTID;
    const clientSecret = process.env.BW_CLIENTSECRET;

    if (!clientId || !clientSecret) {
        return {
            valid: false,
            message:
                "Bitwarden API credentials not set. Add to ~/.zshrc:\n" +
                "  export BW_CLIENTID=\"user.xxx\"\n" +
                "  export BW_CLIENTSECRET=\"yyy\"",
        };
    }

    return { valid: true };
}

/**
 * Prompt user for Bitwarden master password
 */
async function promptPassword() {
    const answers = await inquirer.prompt([
        {
            type: "password",
            name: "masterPassword",
            message: "Enter Bitwarden master password:",
            mask: "*",
        },
    ]);

    return answers.masterPassword;
}

/**
 * Unlock Bitwarden vault with password
 * Returns session key or null if failed
 * Uses spawnSync to avoid shell injection
 */
function unlockBitwarden(password) {
    try {
        // Use spawnSync with stdin to avoid shell injection
        const result = spawnSync("bw", ["unlock", "--passwordstdin", "--raw"], {
            input: password + "\n",
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
 * Discover required secrets from MCP configs
 * Scans ~/.gemini/antigravity/mcp_config.json for ${VAR} patterns
 */
function discoverRequiredSecrets() {
    const platforms = require("./platforms");
    const antigravity = platforms.getByName("antigravity");

    if (!antigravity) {
        return { found: false, secrets: [], reason: "Antigravity platform not detected" };
    }

    const mcpConfigPath = path.join(antigravity.configPath, "mcp_config.json");

    if (!fs.existsSync(mcpConfigPath)) {
        return { found: false, secrets: [], reason: "MCP config not found" };
    }

    try {
        const content = fs.readFileSync(mcpConfigPath, "utf-8");

        // Extract all ${VAR_NAME} patterns (supports mixed/lowercase)
        const regex = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
        const matches = [...content.matchAll(regex)];
        const secretNames = [...new Set(matches.map((m) => m[1]))];

        return { found: true, secrets: secretNames };
    } catch (error) {
        return { found: false, secrets: [], reason: error.message };
    }
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

        // 2. Validate API credentials
        const authCheck = validateBitwardenAuth();
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

        // 5. Discover required secrets
        console.log("🔍 Scanning MCP configs for required secrets...");
        const discovery = discoverRequiredSecrets();

        if (!discovery.found) {
            console.log(`⚠️  ${discovery.reason}`);
            console.log("\n💡 No secrets to sync. MCP configs will be available after implementing Plan 01.\n");
            return;
        }

        if (discovery.secrets.length === 0) {
            console.log("No environment variables found in MCP configs.\n");
            return;
        }

        console.log(`Found ${discovery.secrets.length} secret(s):`);
        discovery.secrets.forEach((name) => {
            console.log(`  • ${name}`);
        });

        // 6. Fetch secrets from Bitwarden
        console.log(`\n🔐 Fetching from Bitwarden (folder: ${BITWARDEN_FOLDER})...`);
        const fetchResults = fetchSecretsFromBitwarden(sessionKey, discovery.secrets);

        fetchResults.found.forEach((secret) => {
            console.log(`✓ ${secret.name} (found)`);
        });

        fetchResults.missing.forEach((name) => {
            console.log(`⚠ ${name} (not found in vault)`);
        });

        // 7. Write to shell profile
        if (fetchResults.found.length > 0) {
            console.log("\n💾 Writing secrets to shell profile...");
            const writeResult = writeToShellProfile(fetchResults.found);
            console.log(`✓ Added ${writeResult.count} environment variable(s) to ${writeResult.path}`);
        }

        // 8. Summary
        console.log("\n✅ Secrets synced successfully!\n");

        console.log("ℹ️  Next steps:");
        console.log("   1. Restart terminal or run: source ~/.zshrc");

        if (fetchResults.missing.length > 0) {
            console.log(`   2. Missing secrets: ${fetchResults.missing.join(", ")}`);
            console.log("      Add them to Bitwarden or set manually");
        }

        console.log("");
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
    validateBitwardenAuth,
    promptPassword,
    unlockBitwarden,
    discoverRequiredSecrets,
    fetchSecretsFromBitwarden,
    detectShellProfile,
    writeToShellProfile,
};
