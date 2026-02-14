/**
 * Shared test utilities
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ai-agent-test-"));
}

function cleanTempDir(dir) {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Set HOME to a temp directory and clear module caches so
 * modules re-compute paths using the new HOME.
 */
function setupTestHome() {
  const tmpDir = createTempDir();
  const originalHome = process.env.HOME;
  process.env.HOME = tmpDir;
  return { tmpDir, originalHome, cleanup: () => { process.env.HOME = originalHome; cleanTempDir(tmpDir); } };
}

/**
 * Clear require cache for the given module paths (resolved from package root).
 */
function clearModuleCache(...modulePaths) {
  for (const p of modulePaths) {
    const resolved = require.resolve(p);
    delete require.cache[resolved];
  }
}

/**
 * Require a module with a fresh HOME and cleared caches.
 * Returns the freshly loaded module.
 */
function freshRequire(modulePath, extraClear = []) {
  const allClear = [modulePath, ...extraClear];
  for (const p of allClear) {
    delete require.cache[require.resolve(p)];
  }
  return require(modulePath);
}

/**
 * Create a mock child_process in require.cache, then fresh-require a module.
 * Returns { module, mocks } where mocks = { execSync, spawnSync }.
 */
function requireWithMockedChildProcess(modulePath, extraClear = []) {
  const cp = require("child_process");
  const mockExecSync = function (...args) { return mockExecSync._impl(...args); };
  mockExecSync._impl = () => "";
  mockExecSync.calls = [];
  const originalExecSync = mockExecSync._impl;

  const mockSpawnSync = function (...args) { return mockSpawnSync._impl(...args); };
  mockSpawnSync._impl = () => ({ status: 0, stdout: "", stderr: "" });
  mockSpawnSync.calls = [];

  // Wrap to track calls
  const wrappedExecSync = function (...args) {
    wrappedExecSync.calls.push(args);
    return mockExecSync._impl(...args);
  };
  wrappedExecSync.calls = [];
  wrappedExecSync.mockImplementation = (fn) => { mockExecSync._impl = fn; };
  wrappedExecSync.reset = () => { wrappedExecSync.calls = []; mockExecSync._impl = () => ""; };

  const wrappedSpawnSync = function (...args) {
    wrappedSpawnSync.calls.push(args);
    return mockSpawnSync._impl(...args);
  };
  wrappedSpawnSync.calls = [];
  wrappedSpawnSync.mockImplementation = (fn) => { mockSpawnSync._impl = fn; };
  wrappedSpawnSync.reset = () => { wrappedSpawnSync.calls = []; mockSpawnSync._impl = () => ({ status: 0, stdout: "", stderr: "" }); };

  // Replace child_process in cache
  const cpResolved = require.resolve("child_process");
  const originalCpCache = require.cache[cpResolved];
  require.cache[cpResolved] = {
    id: cpResolved,
    exports: { ...cp, execSync: wrappedExecSync, spawnSync: wrappedSpawnSync },
    loaded: true,
  };

  // Clear target modules
  const allModules = [modulePath, ...extraClear];
  for (const p of allModules) {
    delete require.cache[require.resolve(p)];
  }

  const mod = require(modulePath);

  // Restore original child_process cache
  require.cache[cpResolved] = originalCpCache;

  return {
    module: mod,
    mocks: { execSync: wrappedExecSync, spawnSync: wrappedSpawnSync },
  };
}

module.exports = {
  createTempDir,
  cleanTempDir,
  setupTestHome,
  clearModuleCache,
  freshRequire,
  requireWithMockedChildProcess,
};
