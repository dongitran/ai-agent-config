/**
 * External Skills Sync Module
 * Automatically sync skills from external repositories
 * v2.0: Now reads from user config at ~/.ai-agent/config.json
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const configManager = require("./config-manager");

const CACHE_DIR = path.join(require("os").homedir(), ".ai-agent-external-cache");

/**
 * Load external skills configuration from user config
 */
function loadConfig() {
  try {
    // Load sources from user config
    const sources = configManager.getAllSources();
    const config = configManager.loadConfig();

    // Target directory is the user's configured repository
    const targetDir = config.repository && config.repository.local
      ? path.join(config.repository.local, ".agent/skills")
      : path.join(require("os").homedir(), ".ai-agent/skills");

    return { sources, targetDir };
  } catch (error) {
    console.error("⚠️  Failed to load user config:", error.message);
    console.log("💡 Run 'ai-agent init' to create config");
    throw error;
  }
}

/**
 * Clone or update a repository
 */
function syncRepo(source) {
  const repoDir = path.join(CACHE_DIR, source.name);

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  try {
    if (fs.existsSync(repoDir)) {
      console.log(`   Updating ${source.name}...`);
      execSync(`git -C "${repoDir}" fetch origin`, { stdio: "pipe" });
      execSync(`git -C "${repoDir}" reset --hard origin/${source.branch}`, { stdio: "pipe" });
    } else {
      console.log(`   Cloning ${source.name}...`);
      execSync(`git clone --branch ${source.branch} "${source.repo}" "${repoDir}"`, {
        stdio: "pipe",
      });
    }
    return true;
  } catch (error) {
    console.error(`   Failed to sync ${source.name}: ${error.message}`);
    return false;
  }
}

/**
 * Copy a skill from cache to target directory
 */
function copySkill(sourcePath, targetPath, force = false, excludePaths = []) {
  if (!fs.existsSync(sourcePath)) {
    return { copied: false, reason: "source not found" };
  }

  if (fs.existsSync(targetPath) && !force) {
    return { copied: false, reason: "already exists (use --force to overwrite)" };
  }

  // Remove existing directory if force
  if (fs.existsSync(targetPath) && force) {
    fs.rmSync(targetPath, { recursive: true });
  }

  // Create target directory
  fs.mkdirSync(targetPath, { recursive: true });

  // Copy all files recursively, excluding specified paths
  copyDirRecursive(sourcePath, targetPath, excludePaths);

  return { copied: true };
}

/**
 * Recursively copy directory
 */
function copyDirRecursive(src, dest, excludePaths = []) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // Check if this entry should be excluded
    if (excludePaths.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath, excludePaths);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Add attribution to SKILL.md file
 */
function addAttribution(skillPath, attribution) {
  const skillFile = path.join(skillPath, "SKILL.md");

  if (!fs.existsSync(skillFile)) {
    return;
  }

  let content = fs.readFileSync(skillFile, "utf-8");

  // Check if attribution already exists
  if (content.includes(attribution)) {
    return;
  }

  // Add attribution at the top
  const attributionBlock = `---\nsource: external\nattribution: ${attribution}\n---\n\n`;
  content = attributionBlock + content;

  fs.writeFileSync(skillFile, content, "utf-8");
}

/**
 * Sync all external skills
 */
function syncAll(options = {}) {
  const { force = false, source = null, skill = null } = options;

  console.log("\n🔄 Syncing external skills...\n");

  const config = loadConfig();
  const targetDir = config.targetDir;
  let sources = config.sources;

  // Filter by source if specified
  if (source) {
    sources = sources.filter((s) => s.name === source);
    if (sources.length === 0) {
      throw new Error(`Source "${source}" not found in config`);
    }
  }

  const results = {
    synced: 0,
    copied: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const src of sources) {
    console.log(`📦 Source: ${src.name}`);

    // Sync repository
    const synced = syncRepo(src);
    if (!synced) {
      results.failed++;
      continue;
    }
    results.synced++;

    const repoDir = path.join(CACHE_DIR, src.name);
    let skills = src.skills;

    // Filter by skill if specified
    if (skill) {
      skills = skills.filter((s) => s.name === skill);
      if (skills.length === 0) {
        console.log(`   ⚠️  Skill "${skill}" not found in ${src.name}`);
        continue;
      }
    }

    // Copy each skill
    for (const skillDef of skills) {
      const sourcePath = path.join(repoDir, skillDef.path);
      const targetPath = path.join(targetDir, skillDef.name);
      const excludePaths = skillDef.excludePaths || [];

      const result = copySkill(sourcePath, targetPath, force, excludePaths);

      if (result.copied) {
        // Skip attribution to save tokens - attribution is already in external-skills.json
        // addAttribution(targetPath, src.attribution);
        console.log(`   ✓ ${skillDef.name}`);
        results.copied++;
      } else {
        console.log(`   ⊗ ${skillDef.name} (${result.reason})`);
        results.skipped++;
      }
    }

    console.log("");
  }

  return results;
}

/**
 * List available external skills
 */
function list() {
  console.log("\n📋 Available External Skills\n");

  const config = loadConfig();
  const targetDir = config.targetDir;

  for (const source of config.sources) {
    console.log(`Source: ${source.name}`);
    console.log(`  Repository: ${source.repo}`);
    console.log(`  License: ${source.license}`);
    console.log(`  Skills:`);

    for (const skill of source.skills) {
      const targetPath = path.join(targetDir, skill.name);
      const installed = fs.existsSync(targetPath) ? "✓ installed" : "";
      console.log(`    • ${skill.name} ${installed}`);
    }

    console.log("");
  }
}

module.exports = {
  syncAll,
  list,
  loadConfig,
};
