/**
 * Tests for installer.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const installer = require("../scripts/installer");
const path = require("path");

describe("Installer Module", () => {
  describe("Constants", () => {
    it("should have REPO_URL defined", () => {
      assert.ok(installer.REPO_URL);
      assert.ok(installer.REPO_URL.includes("github.com"));
      assert.ok(installer.REPO_URL.includes("ai-agent-config"));
    });

    it("should have CACHE_DIR defined", () => {
      assert.ok(installer.CACHE_DIR);
      assert.ok(installer.CACHE_DIR.includes(".ai-agent-config-cache"));
    });

    it("should have REPO_SKILLS_DIR defined", () => {
      assert.ok(installer.REPO_SKILLS_DIR);
      assert.ok(installer.REPO_SKILLS_DIR.includes("skills"));
    });

    it("should have REPO_WORKFLOWS_DIR defined", () => {
      assert.ok(installer.REPO_WORKFLOWS_DIR);
      assert.ok(installer.REPO_WORKFLOWS_DIR.includes("workflows"));
    });
  });

  describe("isRepoCached", () => {
    it("should return boolean", () => {
      const result = installer.isRepoCached();
      assert.strictEqual(typeof result, "boolean");
    });
  });

  describe("getAvailableSkills", () => {
    test("should return array", () => {
      const skills = installer.getAvailableSkills();
      assert.ok(Array.isArray(skills));
    });

    test("should return bundled skills from package", () => {
      const skills = installer.getAvailableSkills();
      assert.ok(skills.includes("config-manager"));
      assert.ok(skills.includes("ai-agent-config"));
    });
  });

  describe("getAvailableWorkflows", () => {
    it("should return array", () => {
      const workflows = installer.getAvailableWorkflows();
      assert.ok(Array.isArray(workflows));
    });

    it("should return empty array if repo not cached", () => {
      if (!installer.isRepoCached()) {
        const workflows = installer.getAvailableWorkflows();
        assert.strictEqual(workflows.length, 0);
      }
    });
  });

  describe("copyDir", () => {
    it("should be a function", () => {
      assert.strictEqual(typeof installer.copyDir, "function");
    });

    it("should return object with copied and skipped counts", () => {
      const result = installer.copyDir("/non-existent-src", "/non-existent-dest");
      assert.ok(typeof result === "object");
      assert.ok("copied" in result);
      assert.ok("skipped" in result);
      assert.strictEqual(result.copied, 0);
      assert.strictEqual(result.skipped, 0);
    });
  });

  describe("Module exports", () => {
    it("should export all required functions", () => {
      assert.strictEqual(typeof installer.install, "function");
      assert.strictEqual(typeof installer.uninstall, "function");
      assert.strictEqual(typeof installer.syncRepo, "function");
      assert.strictEqual(typeof installer.isRepoCached, "function");
      assert.strictEqual(typeof installer.getAvailableSkills, "function");
      assert.strictEqual(typeof installer.getAvailableWorkflows, "function");
      assert.strictEqual(typeof installer.copyDir, "function");
    });
  });
});
