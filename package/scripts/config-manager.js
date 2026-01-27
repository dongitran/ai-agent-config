/**
 * Config Manager Module
 * Manages user configuration for ai-agent-config v2.0
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".ai-agent");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const OFFICIAL_SOURCES = path.join(__dirname, "../config/official-sources.json");

/**
 * Get user config path
 */
function getConfigPath() {
  return CONFIG_FILE;
}

/**
 * Get config directory
 */
function getConfigDir() {
  return CONFIG_DIR;
}

/**
 * Check if user config exists
 */
function configExists() {
  return fs.existsSync(CONFIG_FILE);
}

/**
 * Load official sources from package
 */
function loadOfficialSources() {
  if (!fs.existsSync(OFFICIAL_SOURCES)) {
    console.warn("⚠️  Official sources file not found, using empty array");
    return [];
  }
  const data = JSON.parse(fs.readFileSync(OFFICIAL_SOURCES, "utf-8"));
  return data.sources || [];
}

/**
 * Create default config
 */
function createDefaultConfig() {
  const config = {
    version: "2.0",
    sources: {
      official: loadOfficialSources().map((s) => ({ ...s, enabled: true })),
      custom: [],
    },
    sync: {
      enabled: false,
      provider: null,
      config: {},
    },
    preferences: {
      autoUpdate: true,
      updateInterval: "weekly",
    },
  };
  return config;
}

/**
 * Initialize config directory and file
 */
function initConfig(force = false) {
  // Create directory if not exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Check if config already exists
  if (fs.existsSync(CONFIG_FILE) && !force) {
    return { created: false, reason: "Config already exists" };
  }

  // Create default config
  const config = createDefaultConfig();

  // Write config
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");

  return { created: true, path: CONFIG_FILE };
}

/**
 * Load user config
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    // Auto-initialize if not exists
    console.log("📝 Config not found, creating default config...");
    initConfig();
  }

  const data = fs.readFileSync(CONFIG_FILE, "utf-8");
  return JSON.parse(data);
}

/**
 * Save user config
 */
function saveConfig(config) {
  // Create backup
  if (fs.existsSync(CONFIG_FILE)) {
    const backupPath = `${CONFIG_FILE}.backup`;
    fs.copyFileSync(CONFIG_FILE, backupPath);
  }

  // Ensure directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Write config
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Validate config structure
 */
function validateConfig(config) {
  const errors = [];

  if (!config.version) {
    errors.push("Missing version field");
  }

  if (!config.sources) {
    errors.push("Missing sources field");
  } else {
    if (!config.sources.official || !Array.isArray(config.sources.official)) {
      errors.push("sources.official must be an array");
    }
    if (!config.sources.custom || !Array.isArray(config.sources.custom)) {
      errors.push("sources.custom must be an array");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all sources (official + custom)
 */
function getAllSources() {
  const config = loadConfig();
  return [
    ...(config.sources.official || []).filter((s) => s.enabled !== false),
    ...(config.sources.custom || []).filter((s) => s.enabled !== false),
  ];
}

/**
 * Add a custom source
 */
function addSource(sourceData) {
  const config = loadConfig();

  // Check if source already exists
  const existingOfficial = config.sources.official.find((s) => s.name === sourceData.name);
  const existingCustom = config.sources.custom.find((s) => s.name === sourceData.name);

  if (existingOfficial || existingCustom) {
    return { added: false, reason: `Source "${sourceData.name}" already exists` };
  }

  // Add metadata
  const source = {
    ...sourceData,
    enabled: true,
    metadata: {
      ...(sourceData.metadata || {}),
      addedAt: new Date().toISOString(),
    },
  };

  config.sources.custom.push(source);
  saveConfig(config);

  return { added: true, source };
}

/**
 * Remove a source
 */
function removeSource(sourceName) {
  const config = loadConfig();

  // Check if it's an official source
  const isOfficial = config.sources.official.find((s) => s.name === sourceName);
  if (isOfficial) {
    return {
      removed: false,
      reason: "Cannot remove official sources. Use 'disable' instead.",
    };
  }

  // Find and remove from custom
  const index = config.sources.custom.findIndex((s) => s.name === sourceName);
  if (index === -1) {
    return { removed: false, reason: `Source "${sourceName}" not found` };
  }

  const removed = config.sources.custom.splice(index, 1)[0];
  saveConfig(config);

  return { removed: true, source: removed };
}

/**
 * Enable/disable a source
 */
function toggleSource(sourceName, enabled) {
  const config = loadConfig();

  // Find in official sources
  let source = config.sources.official.find((s) => s.name === sourceName);
  if (source) {
    source.enabled = enabled;
    saveConfig(config);
    return { updated: true, source, type: "official" };
  }

  // Find in custom sources
  source = config.sources.custom.find((s) => s.name === sourceName);
  if (source) {
    source.enabled = enabled;
    saveConfig(config);
    return { updated: true, source, type: "custom" };
  }

  return { updated: false, reason: `Source "${sourceName}" not found` };
}

/**
 * Get source info
 */
function getSourceInfo(sourceName) {
  const config = loadConfig();

  let source = config.sources.official.find((s) => s.name === sourceName);
  if (source) {
    return { found: true, source, type: "official" };
  }

  source = config.sources.custom.find((s) => s.name === sourceName);
  if (source) {
    return { found: true, source, type: "custom" };
  }

  return { found: false, reason: `Source "${sourceName}" not found` };
}

/**
 * Export config
 */
function exportConfig(outputPath) {
  const config = loadConfig();
  const exportData = {
    ...config,
    exportedAt: new Date().toISOString(),
    exportedFrom: os.hostname(),
  };

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");
    return { exported: true, path: outputPath };
  } else {
    return { exported: true, data: exportData };
  }
}

/**
 * Import config
 */
function importConfig(inputPath, merge = false) {
  if (!fs.existsSync(inputPath)) {
    return { imported: false, reason: "Import file not found" };
  }

  const importData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  // Validate
  const validation = validateConfig(importData);
  if (!validation.valid) {
    return { imported: false, reason: "Invalid config", errors: validation.errors };
  }

  if (merge) {
    // Merge with existing config
    const existing = loadConfig();
    const merged = {
      ...existing,
      sources: {
        official: existing.sources.official,
        custom: [...existing.sources.custom, ...(importData.sources.custom || [])],
      },
    };
    saveConfig(merged);
  } else {
    // Replace entirely
    saveConfig(importData);
  }

  return { imported: true };
}

/**
 * Get config value by path
 */
function getConfigValue(keyPath) {
  const config = loadConfig();
  const keys = keyPath.split(".");
  let value = config;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return { found: false, reason: `Key "${keyPath}" not found` };
    }
  }

  return { found: true, value };
}

/**
 * Set config value by path
 */
function setConfigValue(keyPath, value) {
  const config = loadConfig();
  const keys = keyPath.split(".");
  const lastKey = keys.pop();
  let current = config;

  // Navigate to parent object
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  // Set value
  current[lastKey] = value;
  saveConfig(config);

  return { updated: true };
}

/**
 * Reset config to defaults
 */
function resetConfig() {
  const config = createDefaultConfig();
  saveConfig(config);
  return { reset: true };
}

module.exports = {
  getConfigPath,
  getConfigDir,
  configExists,
  loadOfficialSources,
  createDefaultConfig,
  initConfig,
  loadConfig,
  saveConfig,
  validateConfig,
  getAllSources,
  addSource,
  removeSource,
  toggleSource,
  getSourceInfo,
  exportConfig,
  importConfig,
  getConfigValue,
  setConfigValue,
  resetConfig,
};
