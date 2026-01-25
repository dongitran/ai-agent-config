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

  console.log("📖 Quick Start:\n");
  console.log("   1. Sync skills from repository:");
  console.log("      $ ai-agent sync\n");
  console.log("   2. Install to your platforms:");
  console.log("      $ ai-agent install\n");
  console.log("   3. View available skills:");
  console.log("      $ ai-agent list\n");
  console.log("📦 Repository: https://github.com/dongitran/ai-agent-config\n");
}

main();
