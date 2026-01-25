/**
 * Tests for platforms.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const platforms = require("../scripts/platforms");

describe("Platforms Module", () => {
  describe("SUPPORTED platforms", () => {
    it("should have all required platforms defined", () => {
      const platformNames = platforms.SUPPORTED.map((p) => p.name);
      assert.ok(platformNames.includes("claude"));
      assert.ok(platformNames.includes("antigravity"));
      assert.ok(platformNames.includes("cursor"));
      assert.ok(platformNames.includes("windsurf"));
    });

    it("should have required properties for each platform", () => {
      platforms.SUPPORTED.forEach((platform) => {
        assert.ok(platform.name, `Platform should have name`);
        assert.ok(platform.displayName, `Platform ${platform.name} should have displayName`);

        // Copilot uses instructionsFile instead of configDir/skillsDir
        if (platform.name !== "copilot") {
          assert.ok(platform.configDir, `Platform ${platform.name} should have configDir`);
          assert.ok(platform.skillsDir, `Platform ${platform.name} should have skillsDir`);
        }

        assert.ok(
          typeof platform.detect === "function",
          `Platform ${platform.name} should have detect function`
        );
      });
    });

    it("should have configPath getter for most platforms", () => {
      platforms.SUPPORTED.forEach((platform) => {
        // Skip copilot as it doesn't have configPath
        if (platform.name === "copilot") return;

        assert.ok(platform.configPath, `Platform ${platform.name} should have configPath`);
        assert.ok(
          platform.configPath.includes(platform.configDir.split('/')[0]),
          `configPath should include configDir`
        );
      });
    });

    it("should have skillsPath getter for most platforms", () => {
      platforms.SUPPORTED.forEach((platform) => {
        // Skip copilot as it uses instructionsFile instead
        if (platform.name === "copilot") return;

        assert.ok(platform.skillsPath, `Platform ${platform.name} should have skillsPath`);
        assert.ok(
          platform.skillsPath.includes(platform.skillsDir),
          `skillsPath should include skillsDir`
        );
      });
    });
  });

  describe("getByName", () => {
    it("should return platform by name", () => {
      const claude = platforms.getByName("claude");
      assert.ok(claude);
      assert.strictEqual(claude.name, "claude");
      assert.strictEqual(claude.displayName, "Claude Code");
    });

    it("should return null for unknown platform", () => {
      const unknown = platforms.getByName("unknown-platform");
      assert.strictEqual(unknown, null);
    });
  });

  describe("getAllNames", () => {
    it("should return array of platform names", () => {
      const names = platforms.getAllNames();
      assert.ok(Array.isArray(names));
      assert.ok(names.length > 0);
      assert.ok(names.includes("claude"));
      assert.ok(names.includes("antigravity"));
    });
  });

  describe("detectAll", () => {
    it("should return array", () => {
      const detected = platforms.detectAll();
      assert.ok(Array.isArray(detected));
    });

    it("should return platforms with required properties", () => {
      const detected = platforms.detectAll();
      detected.forEach((platform) => {
        assert.ok(platform.name);
        assert.ok(platform.displayName);
        assert.ok(platform.skillsPath);
      });
    });
  });

  describe("ensureSkillsDir", () => {
    it("should return skills path for platform", () => {
      const claude = platforms.getByName("claude");
      const skillsPath = platforms.ensureSkillsDir(claude);
      assert.ok(skillsPath);
      assert.ok(skillsPath.includes("skills"));
    });
  });

  describe("Claude Code platform", () => {
    it("should have workflowsDir and workflowsPath", () => {
      const claude = platforms.getByName("claude");
      assert.ok(claude.workflowsDir, "Claude should have workflowsDir");
      assert.strictEqual(claude.workflowsDir, "workflows");
      assert.ok(claude.workflowsPath, "Claude should have workflowsPath");
      assert.ok(
        claude.workflowsPath.includes("workflows"),
        "workflowsPath should include workflows"
      );
    });
  });

  describe("Antigravity platform", () => {
    it("should have workflowsDir and workflowsPath", () => {
      const antigravity = platforms.getByName("antigravity");
      assert.ok(antigravity.workflowsDir, "Antigravity should have workflowsDir");
      assert.strictEqual(antigravity.workflowsDir, "workflows");
      assert.ok(antigravity.workflowsPath, "Antigravity should have workflowsPath");
    });
  });
});
