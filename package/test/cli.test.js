/**
 * Tests for CLI
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

describe("CLI Module", () => {
  const cliPath = path.join(__dirname, "..", "bin", "cli.js");

  describe("CLI file", () => {
    it("should exist", () => {
      assert.ok(fs.existsSync(cliPath));
    });

    it("should be executable (have shebang)", () => {
      const content = fs.readFileSync(cliPath, "utf-8");
      assert.ok(content.startsWith("#!/usr/bin/env node"));
    });

    it("should have correct version", () => {
      const content = fs.readFileSync(cliPath, "utf-8");
      assert.ok(content.includes('const VERSION = "2.4.3"'));
    });

    it("should define all commands", () => {
      const content = fs.readFileSync(cliPath, "utf-8");
      const expectedCommands = [
        "init",
        "pull",
        "push",
        "update",
        "install",
        "list",
        "platforms",
        "uninstall",
        "list-external",
        "sync-external",
      ];
      expectedCommands.forEach((cmd) => {
        assert.ok(content.includes(`case "${cmd}":`), `Should have ${cmd} command`);
      });
    });

    it("should have showHelp function", () => {
      const content = fs.readFileSync(cliPath, "utf-8");
      assert.ok(content.includes("function showHelp()"));
      assert.ok(content.includes("AI Agent Config CLI"));
    });

    it("should have version in help header", () => {
      const content = fs.readFileSync(cliPath, "utf-8");
      assert.ok(content.includes("AI Agent Config CLI v${VERSION"));
    });

    it("should handle version command", () => {
      const content = fs.readFileSync(cliPath, "utf-8");
      assert.ok(content.includes('case "version":'));
      assert.ok(content.includes('case "--version":'));
      assert.ok(content.includes('case "-v":'));
      assert.ok(content.includes("console.log(`v${VERSION}`)"));
    });
  });

  describe("Package.json bin field", () => {
    it("should have correct bin entry", () => {
      const packageJson = require("../package.json");
      assert.ok(packageJson.bin);
      assert.ok(packageJson.bin["ai-agent"]);
      assert.ok(packageJson.bin["ai-agent"].includes("cli.js"));
    });
  });
});
