const test = require("node:test");
const assert = require("node:assert");
const configManager = require("../scripts/config-manager");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Use test directory for config
const TEST_CONFIG_DIR = path.join(os.tmpdir(), "ai-agent-test");
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, "config.json");

test("config-manager module", async (t) => {
  await t.test("should create default config", () => {
    const config = configManager.createDefaultConfig();
    assert.strictEqual(config.version, "2.3");
    assert.ok(config.sources);
    assert.ok(config.sources.official);
    assert.ok(config.sources.custom);
    assert.ok(Array.isArray(config.sources.official));
    assert.ok(Array.isArray(config.sources.custom));
  });

  await t.test("should validate valid config", () => {
    const config = configManager.createDefaultConfig();
    const result = configManager.validateConfig(config);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  await t.test("should detect invalid config", () => {
    const invalidConfig = { version: "2.3" }; // Missing sources
    const result = configManager.validateConfig(invalidConfig);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
  });
});
