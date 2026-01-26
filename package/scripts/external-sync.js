/**
 * External Skills Sync Module
 * Automatically sync skills from external repositories
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONFIG_FILE = path.join(__dirname, "../../.agent/external-skills.json");
const CACHE_DIR = path.join(require("os").homedir(), ".ai-agent-external-cache");
const TARGET_DIR = path.join(__dirname, "../../.agent/skills");

/**
 * Load external skills configuration
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error(`Config file not found: ${CONFIG_FILE}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
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
function copySkill(sourcePath, targetPath, force = false) {
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

  // Copy all files recursively
  copyDirRecursive(sourcePath, targetPath);

  return { copied: true };
}

/**
 * Recursively copy directory
 */
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath);
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
      const targetPath = path.join(TARGET_DIR, skillDef.name);

      const result = copySkill(sourcePath, targetPath, force);

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

  for (const source of config.sources) {
    console.log(`Source: ${source.name}`);
    console.log(`  Repository: ${source.repo}`);
    console.log(`  License: ${source.license}`);
    console.log(`  Skills:`);

    for (const skill of source.skills) {
      const targetPath = path.join(TARGET_DIR, skill.name);
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
