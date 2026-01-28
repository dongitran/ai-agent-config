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
}

main();
