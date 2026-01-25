#!/usr/bin/env node

/**
 * AI Agent Config CLI
 * Install global skills from https://github.com/dongitran/ai-agent-config
 */

const fs = require("fs");
const path = require("path");

const platforms = require("../scripts/platforms");
const installer = require("../scripts/installer");
const externalSync = require("../scripts/external-sync");

// Read version from package.json
const packageJson = require("../package.json");
const VERSION = packageJson.version;

const COMMANDS = {
  init: "Initialize config file in home directory",
  install: "Install skills to detected platforms",
  sync: "Sync skills from GitHub repository",
  "sync-external": "Sync skills from external repositories",
  list: "List available skills and workflows",
  "list-external": "List available external skills",
  platforms: "Show detected platforms",
  uninstall: "Remove installed skills",
  version: "Show version number",
  help: "Show this help message",
};

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               AI Agent Config CLI v${VERSION.padEnd(27)}║
║   Universal Global Skills for AI Coding Assistants            ║
╚═══════════════════════════════════════════════════════════════╝

Usage: ai-agent <command> [options]

Commands:`);

  Object.entries(COMMANDS).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });

  console.log(`
Options:
  --platform <name>   Target specific platform (claude, antigravity, cursor)
  --skill <name>      Install specific skill only
  --force             Overwrite existing files

Examples:
  ai-agent sync                    # Sync from GitHub repository
  ai-agent install                 # Install all skills to detected platforms
  ai-agent install --platform claude
  ai-agent install --skill code-review
  ai-agent list                    # List available skills
  ai-agent platforms               # Show detected platforms
  ai-agent uninstall               # Remove all installed skills

Repository: https://github.com/dongitran/ai-agent-config
Skills are stored in: ~/.ai-agent-config-cache/.agent/skills/
`);
}

function showPlatforms() {
  console.log("\n🔍 Detecting platforms...\n");

  const detected = platforms.detectAll();

  if (detected.length === 0) {
    console.log("No AI coding platforms detected in home directory.\n");
    console.log("Supported platforms:");
    platforms.SUPPORTED.forEach((p) => {
      console.log(`  - ${p.displayName} (~/${p.configDir})`);
    });
    return;
  }

  console.log("Detected platforms:\n");
  detected.forEach((p) => {
    console.log(`  ✓ ${p.displayName}`);
    console.log(`    Skills: ${p.skillsPath}`);
    console.log("");
  });
}

function listSkills() {
  console.log("\n📦 Available Skills & Workflows\n");

  if (!installer.isRepoCached()) {
    console.log("⚠️  Repository not synced yet.");
    console.log("   Run: ai-agent sync\n");
    return;
  }

  const skills = installer.getAvailableSkills();
  const workflows = installer.getAvailableWorkflows();

  console.log("Skills:");
  if (skills.length === 0) {
    console.log("  (no skills found)");
  } else {
    skills.forEach((skill) => {
      const skillFile = path.join(installer.REPO_SKILLS_DIR, skill, "SKILL.md");
      let desc = "";
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, "utf-8");
        const match = content.match(/description:\s*(.+)/i);
        if (match) desc = `- ${match[1]}`;
      }
      console.log(`  • ${skill} ${desc}`);
    });
  }

  console.log("\nWorkflows:");
  if (workflows.length === 0) {
    console.log("  (no workflows found)");
  } else {
    workflows.forEach((wf) => {
      console.log(`  • ${wf}`);
    });
  }

  console.log(`\nSource: ${installer.CACHE_DIR}`);
  console.log("");
}

function init(args) {
  console.log("\n🚀 Initializing AI Agent Config...\n");

  const configFile = path.join(platforms.HOME, ".ai-agent-config.json");

  if (fs.existsSync(configFile) && !args.includes("--force")) {
    console.log("⚠️  Config file already exists. Use --force to overwrite.");
    return;
  }

  const defaultConfig = {
    platforms: ["auto"],
    skills: {
      include: ["*"],
      exclude: [],
    },
    sync: {
      auto: false,
      remote: "https://github.com/dongitran/ai-agent-config",
    },
  };

  fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
  console.log(`✓ Created ${configFile}`);

  const detected = platforms.detectAll();
  if (detected.length > 0) {
    console.log("\nDetected platforms:");
    detected.forEach((p) => console.log(`  ✓ ${p.displayName}`));
  }

  console.log("\nNext steps:");
  console.log("  1. Run: ai-agent sync");
  console.log("  2. Run: ai-agent install");
  console.log("");
}

function install(args) {
  console.log("\n📥 Installing skills...\n");

  const options = {
    platform: null,
    force: false,
    skill: null,
    sync: true,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--platform" && args[i + 1]) {
      options.platform = args[++i];
    } else if (args[i] === "--force") {
      options.force = true;
    } else if (args[i] === "--skill" && args[i + 1]) {
      options.skill = args[++i];
    } else if (args[i] === "--no-sync") {
      options.sync = false;
    }
  }

  try {
    const result = installer.install(options);

    if (result.skillsCount > 0 || result.workflowsCount > 0) {
      const parts = [];
      if (result.skillsCount > 0) parts.push(`${result.skillsCount} skill(s)`);
      if (result.workflowsCount > 0) parts.push(`${result.workflowsCount} workflow(s)`);

      console.log(`\n✓ Installed ${parts.join(", ")} to ${result.platformsCount} platform(s)\n`);
      result.details.forEach((d) => {
        console.log(`  ${d.platform}:`);
        if (d.skills.length > 0) {
          console.log(`    Skills: ${d.skillsPath}`);
          d.skills.forEach((s) => {
            const status = s.skipped > 0 ? `(${s.copied} new, ${s.skipped} skipped)` : "";
            console.log(`      • ${s.name} ${status}`);
          });
        }
        if (d.workflows.length > 0) {
          console.log(`    Workflows: ${d.workflowsPath}`);
          d.workflows.forEach((w) => {
            const status = w.skipped > 0 ? "(skipped)" : "";
            console.log(`      • ${w.name} ${status}`);
          });
        }
      });
    } else {
      console.log("\n⚠️  No skills or workflows installed.");
    }
  } catch (error) {
    console.error(`\n❌ Installation failed: ${error.message}`);
    process.exit(1);
  }

  console.log("");
}

function sync(args) {
  console.log("\n🔄 Syncing from GitHub repository...\n");
  console.log(`   Repository: ${installer.REPO_URL}`);
  console.log(`   Cache: ${installer.CACHE_DIR}\n`);

  try {
    const success = installer.syncRepo();

    if (success) {
      console.log("\n✓ Sync complete!\n");

      const skills = installer.getAvailableSkills();
      const workflows = installer.getAvailableWorkflows();

      console.log(`   Found ${skills.length} skill(s), ${workflows.length} workflow(s)`);
      console.log("\n   Run 'ai-agent install' to install to your platforms.\n");
    }
  } catch (error) {
    console.error(`\n❌ Sync failed: ${error.message}`);
    process.exit(1);
  }
}

function uninstall(args) {
  console.log("\n🗑️  Uninstalling skills...\n");

  const options = {
    platform: null,
    skill: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--platform" && args[i + 1]) {
      options.platform = args[++i];
    } else if (args[i] === "--skill" && args[i + 1]) {
      options.skill = args[++i];
    }
  }

  try {
    const result = installer.uninstall(options);

    if (result.totalRemoved > 0) {
      console.log(`✓ Removed ${result.totalRemoved} skill(s) from ${result.platformsCount} platform(s)\n`);
      result.details.forEach((d) => {
        if (d.removed > 0) {
          console.log(`  ${d.platform}: ${d.removed} removed`);
        }
      });
    } else {
      console.log("ℹ️  No skills to remove.");
    }
  } catch (error) {
    console.error(`\n❌ Uninstall failed: ${error.message}`);
    process.exit(1);
  }

  console.log("");
}

function syncExternal(args) {
  console.log("\n🔄 Syncing external skills...\n");

  const options = {
    force: false,
    source: null,
    skill: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--force") {
      options.force = true;
    } else if (args[i] === "--source" && args[i + 1]) {
      options.source = args[++i];
    } else if (args[i] === "--skill" && args[i + 1]) {
      options.skill = args[++i];
    }
  }

  try {
    const result = externalSync.syncAll(options);

    console.log(`\n✓ Synced ${result.synced} source(s)`);
    console.log(`  Copied: ${result.copied} skill(s)`);
    console.log(`  Skipped: ${result.skipped} skill(s)`);
    if (result.failed > 0) {
      console.log(`  Failed: ${result.failed} source(s)`);
    }
    console.log("");
  } catch (error) {
    console.error(`\n❌ Sync failed: ${error.message}`);
    process.exit(1);
  }
}

function listExternal(args) {
  try {
    externalSync.list();
  } catch (error) {
    console.error(`\n❌ List failed: ${error.message}`);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "init":
    init(args.slice(1));
    break;
  case "install":
    install(args.slice(1));
    break;
  case "sync":
    sync(args.slice(1));
    break;
  case "sync-external":
    syncExternal(args.slice(1));
    break;
  case "list":
    listSkills();
    break;
  case "list-external":
    listExternal(args.slice(1));
    break;
  case "platforms":
    showPlatforms();
    break;
  case "uninstall":
    uninstall(args.slice(1));
    break;
  case "version":
  case "--version":
  case "-v":
    console.log(`v${VERSION}`);
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    showHelp();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Run "ai-agent help" for usage information.');
    process.exit(1);
}
