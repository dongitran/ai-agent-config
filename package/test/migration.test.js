const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const { setupTestHome, freshRequire } = require("./helpers");

describe("Migration Module", () => {
  let env, migration, configManager;

  before(() => {
    env = setupTestHome();
    configManager = freshRequire("../scripts/config-manager", ["../scripts/platforms"]);
    migration = freshRequire("../scripts/migration", ["../scripts/config-manager", "../scripts/platforms"]);
  });

  after(() => { env.cleanup(); });

  beforeEach(() => {
    const dir = configManager.getConfigDir();
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  });

  describe("needsMigration", () => {
    it("should return true when no config", () => {
      assert.strictEqual(migration.needsMigration(), true);
    });
    it("should return false when config exists", () => {
      configManager.initConfig();
      assert.strictEqual(migration.needsMigration(), false);
    });
  });

  describe("migrate", () => {
    it("should create config when needed (silent)", () => {
      const r = migration.migrate({ silent: true });
      assert.strictEqual(r.migrated, true);
      assert.ok(r.configPath);
    });
    it("should skip when already migrated (silent)", () => {
      configManager.initConfig();
      assert.strictEqual(migration.migrate({ silent: true }).migrated, false);
    });
    it("should print output when not silent and needs migration", () => {
      const r = migration.migrate({ silent: false });
      assert.strictEqual(r.migrated, true);
    });
    it("should print skip message when not silent and already migrated", () => {
      configManager.initConfig();
      assert.strictEqual(migration.migrate({ silent: false }).migrated, false);
    });
    it("should use default options", () => {
      const r = migration.migrate();
      assert.strictEqual(r.migrated, true);
    });
  });

  describe("autoMigrate", () => {
    it("should migrate when needed", () => {
      assert.strictEqual(migration.autoMigrate().migrated, true);
    });
    it("should skip when not needed", () => {
      configManager.initConfig();
      assert.strictEqual(migration.autoMigrate().migrated, false);
    });
  });
});
