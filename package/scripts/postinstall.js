#!/usr/bin/env node

/**
 * Post-install script for AI Agent Config
 * Shows usage instructions after npm install
 */

const platforms = require("./platforms");

// Bitwarden MCP: Tools to disable (org management, device approval, sends, etc.)
const BITWARDEN_DISABLED_TOOLS = [
  "lock", "sync", "status", "confirm",
  "create_org_collection", "edit_org_collection", "edit_item_collections", "move",
  "device_approval_list", "device_approval_approve", "device_approval_approve_all",
  "device_approval_deny", "device_approval_deny_all",
  "create_text_send", "create_file_send", "list_send", "get_send",
  "edit_send", "delete_send", "remove_send_password",
  "create_attachment",
  "list_org_collections", "get_org_collection", "update_org_collection", "delete_org_collection",
  "list_org_members", "get_org_member", "get_org_member_groups",
  "invite_org_member", "update_org_member", "update_org_member_groups",
  "remove_org_member", "reinvite_org_member",
  "list_org_groups", "get_org_group", "get_org_group_members",
  "create_org_group", "update_org_group", "delete_org_group", "update_org_group_members",
  "list_org_policies", "get_org_policy", "update_org_policy",
  "get_org_events", "get_org_subscription", "update_org_subscription",
  "import_org_users_and_groups"
];

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
  // Skip if AI_AGENT_NO_AUTOCONFIG is set (opt-out for security/trust)
  if (process.env.AI_AGENT_NO_AUTOCONFIG === "1" || process.env.AI_AGENT_NO_AUTOCONFIG === "true") {
    console.log("⏭️  Skipping auto-config (AI_AGENT_NO_AUTOCONFIG is set)\n");
    return;
  }

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

      // Add/Enable Bitwarden MCP server
      let changed = false;
      if (!mcpConfig.mcpServers.bitwarden) {
        mcpConfig.mcpServers.bitwarden = {
          command: "npx",
          args: ["-y", "@bitwarden/mcp-server"],
          env: {
            BW_SESSION: "${BW_SESSION}",
            BW_CLIENT_ID: "${BW_CLIENT_ID}",
            BW_CLIENT_SECRET: "${BW_CLIENT_SECRET}",
          },
          disabledTools: BITWARDEN_DISABLED_TOOLS,
        };
        changed = true;
        console.log("🔐 Bitwarden MCP server added to Antigravity (✓ enabled)");
      } else {
        // Ensure correct env var names even if already exists
        const bw = mcpConfig.mcpServers.bitwarden;
        if (!bw.env.BW_SESSION || !bw.env.BW_CLIENT_ID || !bw.env.BW_CLIENT_SECRET || bw.disabled) {
          bw.env = {
            BW_SESSION: "${BW_SESSION}",
            BW_CLIENT_ID: "${BW_CLIENT_ID}",
            BW_CLIENT_SECRET: "${BW_CLIENT_SECRET}",
          };
          delete bw.disabled;
          changed = true;
          console.log("🔓 Bitwarden MCP server configuration repaired and enabled");
        }

        // Phase 4: Add disabledTools if not present (don't override if user customized)
        if (!bw.disabledTools) {
          bw.disabledTools = BITWARDEN_DISABLED_TOOLS;
          changed = true;
          console.log("🎛️  Bitwarden MCP: Added tool filters (disabled org-management tools)");
        }
      }

      if (changed) {
        fs.writeFileSync(
          antigravityMcpPath,
          JSON.stringify(mcpConfig, null, 2),
          "utf-8"
        );
        console.log("   Config: ~/.gemini/antigravity/mcp_config.json\n");
      }
    } catch (error) {
      // Silent fail - not critical
    }
  }
}

main();
