#!/usr/bin/env node

/**
 * Post-install script for AI Agent Config
 * Shows usage instructions after npm install
 */

const platforms = require("./platforms");

function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════════╗");
  console.log("║               AI Agent Config Installed!                      ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  // Detect platforms
  const detected = platforms.detectAll();

  if (detected.length > 0) {
    console.log("🔍 Detected platforms:\n");
    detected.forEach((p) => {
      console.log(`   ✓ ${p.displayName}`);
    });
    console.log("");
  }

  console.log("📦 Bundled Skills:\n");
  console.log("   • config-manager     - Manage configuration and sources");
  console.log("   • skill-updater      - Update skills from repositories\n");

  console.log("📖 Quick Start:\n");
  console.log("   1. Initialize config:");
  console.log("      $ ai-agent init\n");
  console.log("   2. Install bundled skills to platforms:");
  console.log("      $ ai-agent install\n");
  console.log("   3. (Optional) Add more skills from GitHub:");
  console.log("      $ ai-agent source add <repo-url>\n");
  console.log("   4. Update & install additional skills:");
  console.log("      $ ai-agent update && ai-agent install\n");
  console.log("📦 Repository: https://github.com/dongitran/ai-agent-config\n");

  // Auto-install Bitwarden MCP server to Antigravity
  const fs = require("fs");
  const path = require("path");
  const os = require("os");

  const antigravityMcpPath = path.join(
    os.homedir(),
    ".gemini",
    "antigravity",
    "mcp_config.json"
  );

  if (fs.existsSync(path.dirname(antigravityMcpPath))) {
    try {
      let mcpConfig = { mcpServers: {} };

      // Read existing config if it exists
      if (fs.existsSync(antigravityMcpPath)) {
        const content = fs.readFileSync(antigravityMcpPath, "utf-8");
        if (content.trim()) {
          mcpConfig = JSON.parse(content);
        }
      }

      // Add Bitwarden MCP server (enabled by default)
      if (!mcpConfig.mcpServers.bitwarden) {
        mcpConfig.mcpServers.bitwarden = {
          command: "npx",
          args: ["-y", "@bitwarden/mcp-server"],
          env: {
            BW_CLIENTID: "${BW_CLIENTID}",
            BW_CLIENTSECRET: "${BW_CLIENTSECRET}",
          },
        };

        fs.writeFileSync(
          antigravityMcpPath,
          JSON.stringify(mcpConfig, null, 2),
          "utf-8"
        );
        console.log("🔐 Bitwarden MCP server added to Antigravity (✓ enabled)");
        console.log("   Config: ~/.gemini/antigravity/mcp_config.json\n");
      }
    } catch (error) {
      // Silent fail - not critical
    }
  }
}

main();
