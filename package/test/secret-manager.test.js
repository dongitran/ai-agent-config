const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { setupTestHome, requireWithMockedChildProcess } = require("./helpers");

describe("Secret Manager Module", () => {
  let env, secretManager, mocks, configManager;

  before(() => {
    env = setupTestHome();
    const result = requireWithMockedChildProcess("../scripts/secret-manager", [
      "../scripts/config-manager",
      "../scripts/platforms",
      "../scripts/mcp-installer",
    ]);
    secretManager = result.module;
    mocks = result.mocks;
    configManager = require("../scripts/config-manager");
  });

  after(() => { env.cleanup(); });

  beforeEach(() => {
    const dir = configManager.getConfigDir();
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    configManager.initConfig();
    mocks.execSync.reset();
    mocks.spawnSync.reset();
  });

  describe("validateBitwardenCLI", () => {
    it("should return valid when bw exists", () => {
      mocks.execSync.mockImplementation(() => "/usr/local/bin/bw");
      assert.strictEqual(secretManager.validateBitwardenCLI().valid, true);
    });

    it("should return invalid when bw not found", () => {
      mocks.execSync.mockImplementation(() => { throw new Error("not found"); });
      const r = secretManager.validateBitwardenCLI();
      assert.strictEqual(r.valid, false);
      assert.ok(r.message.includes("Bitwarden CLI not found"));
    });
  });

  describe("ensureBitwardenLogin", () => {
    it("should return valid when already logged in", () => {
      mocks.spawnSync.mockImplementation(() => ({
        status: 0, stdout: JSON.stringify({ status: "locked" }),
      }));
      const r = secretManager.ensureBitwardenLogin();
      assert.strictEqual(r.valid, true);
    });

    it("should auto-login when unauthenticated with credentials", () => {
      const origId = process.env.BW_CLIENTID;
      const origSecret = process.env.BW_CLIENTSECRET;
      process.env.BW_CLIENTID = "test-id";
      process.env.BW_CLIENTSECRET = "test-secret";

      mocks.spawnSync.mockImplementation((cmd, args) => {
        if (args && args.includes("status")) {
          return { status: 0, stdout: JSON.stringify({ status: "unauthenticated" }) };
        }
        if (args && args.includes("login")) {
          return { status: 0, stdout: "" };
        }
        return { status: 0, stdout: "" };
      });

      const r = secretManager.ensureBitwardenLogin();
      assert.strictEqual(r.valid, true);

      process.env.BW_CLIENTID = origId;
      process.env.BW_CLIENTSECRET = origSecret;
    });

    it("should fail when login fails without credentials", () => {
      delete process.env.BW_CLIENTID;
      delete process.env.BW_CLIENTSECRET;

      mocks.spawnSync.mockImplementation(() => ({
        status: 0, stdout: JSON.stringify({ status: "unauthenticated" }),
      }));

      const r = secretManager.ensureBitwardenLogin();
      assert.strictEqual(r.valid, false);
    });
  });

  describe("unlockBitwarden", () => {
    it("should return session key on success", () => {
      mocks.spawnSync.mockImplementation(() => ({
        status: 0, stdout: "session-key-123",
      }));
      const r = secretManager.unlockBitwarden("password");
      assert.strictEqual(r.success, true);
      assert.strictEqual(r.sessionKey, "session-key-123");
    });

    it("should return failure on bad password", () => {
      mocks.spawnSync.mockImplementation(() => ({
        status: 1, stderr: "Invalid password",
      }));
      const r = secretManager.unlockBitwarden("wrong");
      assert.strictEqual(r.success, false);
      assert.ok(r.message.includes("Invalid password"));
    });

    it("should handle exception", () => {
      mocks.spawnSync.mockImplementation(() => { throw new Error("spawn error"); });
      const r = secretManager.unlockBitwarden("pass");
      assert.strictEqual(r.success, false);
    });
  });

  describe("discoverRequiredSecrets", () => {
    it("should return secrets from MCP configs", () => {
      // Setup MCP server with bitwardenEnv
      const repoLocal = configManager.loadConfig().repository.local;
      const expanded = repoLocal.replace(/^~/, env.tmpDir);
      const mcpDir = path.join(expanded, ".agent", "mcp-servers", "test-srv");
      fs.mkdirSync(mcpDir, { recursive: true });
      fs.writeFileSync(path.join(mcpDir, "config.json"), JSON.stringify({
        name: "test-srv", command: "cmd", args: [],
        bitwardenEnv: { API_KEY: "bw-item" },
      }), "utf-8");

      const r = secretManager.discoverRequiredSecrets();
      assert.strictEqual(r.found, true);
      assert.ok(r.secrets.includes("bw-item"));
    });

    it("should return empty when no MCP servers", () => {
      const r = secretManager.discoverRequiredSecrets();
      // Either found:false (no dir) or found:true with empty secrets
      assert.ok(r.secrets.length === 0);
    });
  });

  describe("fetchSecretsFromBitwarden", () => {
    it("should find secrets by login password", () => {
      mocks.execSync.mockImplementation(() => JSON.stringify([
        { name: "my-key", login: { password: "secret123" } },
      ]));
      const r = secretManager.fetchSecretsFromBitwarden("session", ["my-key"]);
      assert.strictEqual(r.found.length, 1);
      assert.strictEqual(r.found[0].value, "secret123");
    });

    it("should find secrets by notes", () => {
      mocks.execSync.mockImplementation(() => JSON.stringify([
        { name: "note-key", notes: "note-secret" },
      ]));
      const r = secretManager.fetchSecretsFromBitwarden("session", ["note-key"]);
      assert.strictEqual(r.found[0].value, "note-secret");
    });

    it("should find secrets by custom field", () => {
      mocks.execSync.mockImplementation(() => JSON.stringify([
        { name: "field-key", fields: [{ name: "value", value: "field-val" }] },
      ]));
      const r = secretManager.fetchSecretsFromBitwarden("session", ["field-key"]);
      assert.strictEqual(r.found[0].value, "field-val");
    });

    it("should find secrets by secret field name", () => {
      mocks.execSync.mockImplementation(() => JSON.stringify([
        { name: "sec-key", fields: [{ name: "Secret", value: "sec-val" }] },
      ]));
      const r = secretManager.fetchSecretsFromBitwarden("session", ["sec-key"]);
      assert.strictEqual(r.found[0].value, "sec-val");
    });

    it("should report missing secrets", () => {
      mocks.execSync.mockImplementation(() => JSON.stringify([]));
      const r = secretManager.fetchSecretsFromBitwarden("session", ["missing"]);
      assert.strictEqual(r.missing.length, 1);
      assert.ok(r.missing.includes("missing"));
    });

    it("should report item with no extractable value as missing", () => {
      mocks.execSync.mockImplementation(() => JSON.stringify([
        { name: "empty-item" },
      ]));
      const r = secretManager.fetchSecretsFromBitwarden("session", ["empty-item"]);
      assert.strictEqual(r.missing.length, 1);
    });

    it("should handle bw errors gracefully", () => {
      mocks.execSync.mockImplementation(() => { throw new Error("vault locked"); });
      const r = secretManager.fetchSecretsFromBitwarden("session", ["key1", "key2"]);
      assert.strictEqual(r.missing.length, 2);
    });
  });

  describe("detectShellProfile", () => {
    it("should detect zsh", () => {
      const origShell = process.env.SHELL;
      process.env.SHELL = "/bin/zsh";
      const p = secretManager.detectShellProfile();
      assert.ok(p.endsWith(".zshrc"));
      process.env.SHELL = origShell;
    });

    it("should detect bash", () => {
      const origShell = process.env.SHELL;
      process.env.SHELL = "/bin/bash";
      const p = secretManager.detectShellProfile();
      assert.ok(p.endsWith(".bashrc"));
      process.env.SHELL = origShell;
    });

    it("should default to zsh", () => {
      const origShell = process.env.SHELL;
      process.env.SHELL = "";
      const p = secretManager.detectShellProfile();
      assert.ok(p.endsWith(".zshrc"));
      process.env.SHELL = origShell;
    });
  });

  describe("writeToShellProfile", () => {
    it("should create new block", () => {
      const secrets = [{ name: "KEY1", value: "val1" }];
      const r = secretManager.writeToShellProfile(secrets);
      assert.ok(r.path);
      assert.strictEqual(r.count, 1);
      const content = fs.readFileSync(r.path, "utf-8");
      assert.ok(content.includes("export KEY1="));
      assert.ok(content.includes("AI Agent MCP Secrets"));
    });

    it("should replace existing block", () => {
      // First write
      secretManager.writeToShellProfile([{ name: "OLD", value: "old" }]);
      // Second write
      const r = secretManager.writeToShellProfile([{ name: "NEW", value: "new" }]);
      const content = fs.readFileSync(r.path, "utf-8");
      assert.ok(content.includes("export NEW="));
      // Should not have duplicate markers
      const markers = content.match(/AI Agent MCP Secrets \(auto-generated/g);
      assert.strictEqual(markers.length, 1);
    });
  });

  describe("tryReuseAntigravitySession", () => {
    it("should fail when no antigravity", () => {
      const r = secretManager.tryReuseAntigravitySession();
      assert.strictEqual(r.success, false);
    });

    it("should fail when no mcp config file", () => {
      const platforms = require("../scripts/platforms");
      const ag = platforms.getByName("antigravity");
      fs.mkdirSync(path.dirname(ag.mcpConfigPath), { recursive: true });
      // Don't create the file
      const r = secretManager.tryReuseAntigravitySession();
      assert.strictEqual(r.success, false);
    });

    it("should fail when no BW_SESSION in config", () => {
      const platforms = require("../scripts/platforms");
      const ag = platforms.getByName("antigravity");
      fs.mkdirSync(path.dirname(ag.mcpConfigPath), { recursive: true });
      fs.writeFileSync(ag.mcpConfigPath, JSON.stringify({ mcpServers: {} }), "utf-8");
      const r = secretManager.tryReuseAntigravitySession();
      assert.strictEqual(r.success, false);
    });

    it("should succeed when valid session exists", () => {
      const platforms = require("../scripts/platforms");
      const ag = platforms.getByName("antigravity");
      fs.mkdirSync(path.dirname(ag.mcpConfigPath), { recursive: true });
      fs.writeFileSync(ag.mcpConfigPath, JSON.stringify({
        mcpServers: { bitwarden: { env: { BW_SESSION: "valid-session" } } },
      }), "utf-8");
      mocks.spawnSync.mockImplementation(() => ({ status: 0 }));
      const r = secretManager.tryReuseAntigravitySession();
      assert.strictEqual(r.success, true);
      assert.strictEqual(r.sessionKey, "valid-session");
    });

    it("should fail when session is expired", () => {
      const platforms = require("../scripts/platforms");
      const ag = platforms.getByName("antigravity");
      fs.mkdirSync(path.dirname(ag.mcpConfigPath), { recursive: true });
      fs.writeFileSync(ag.mcpConfigPath, JSON.stringify({
        mcpServers: { bitwarden: { env: { BW_SESSION: "expired" } } },
      }), "utf-8");
      mocks.spawnSync.mockImplementation(() => ({ status: 1 }));
      const r = secretManager.tryReuseAntigravitySession();
      assert.strictEqual(r.success, false);
    });
  });
});
