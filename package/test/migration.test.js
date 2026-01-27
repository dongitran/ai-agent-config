const test = require("node:test");
const assert = require("node:assert");
const migration = require("../scripts/migration");

test("migration module", async (t) => {
  await t.test("should have needsMigration function", () => {
    assert.strictEqual(typeof migration.needsMigration, "function");
  });

  await t.test("should have migrate function", () => {
    assert.strictEqual(typeof migration.migrate, "function");
  });

  await t.test("should have autoMigrate function", () => {
    assert.strictEqual(typeof migration.autoMigrate, "function");
  });
});
