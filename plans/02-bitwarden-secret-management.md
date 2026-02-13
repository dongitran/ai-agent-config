# Brainstorm: Bitwarden-Based Secret Management for MCP

> Tự động quản lý secrets cho MCP servers bằng Bitwarden integration

**Version**: v2.6.0 (Future)  
**Created**: 2026-02-13  
**Status**: Brainstorming

---

## 🎯 Problem Statement

### Current Challenges

1. **Security Risk**: MCP config files được push lên GitHub public
   - Không thể hardcode API keys, tokens trong config
   - `${ENV_VAR}` syntax yêu cầu user manually set env vars

2. **User Friction**: 
   - User phải manually export env vars trước khi start Antigravity
   - Mỗi máy mới phải setup lại tất cả env vars
   - Dễ quên hoặc setup sai env var names

3. **No Central Management**:
   - Secrets scattered across different places
   - Hard to rotate/update keys
   - No audit trail

---

## 💡 Proposed Solution

### High-Level Concept

**Use Bitwarden as the single source of truth for all MCP secrets**

**Workflow:**
```
1. User stores all secrets in Bitwarden vault
2. Package bundles Bitwarden MCP server (pre-configured)
3. On `ai-agent pull/install`:
   - Package scans all MCP configs
   - Detects required env vars (e.g., ${GITHUB_TOKEN})
   - Uses Bitwarden MCP to fetch secrets
   - Automatically sets env vars on local machine
4. Antigravity launches with all secrets available
```

---

## 🏗️ Architecture Design

### Components

#### 1. Bundled Bitwarden MCP Server

**Location**: `package/.agent/mcp-servers/bitwarden/`

**Purpose**: Pre-configured Bitwarden MCP server bundled with package

**Config**: `package/.agent/mcp-servers/bitwarden/config.json`
```
{
  "name": "bitwarden",
  "description": "Password manager for secure secret storage",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-bitwarden"],
  "env": {
    "BW_SESSION": "${BW_SESSION}"
  },
  "platform": ["antigravity"],
  "enabled": true,
  "bundled": true
}
```

**Key Point**: Bitwarden MCP itself needs `BW_SESSION` env var to authenticate

#### 2. Secret Discovery Module

**Create**: `package/scripts/secret-manager.js`

**Functions**:
- `discoverRequiredSecrets()` - Scan all MCP configs, collect `${VAR}` references
- `validateBitwardenAuth()` - Check if `BW_SESSION` is set
- `fetchSecretsFromBitwarden()` - Use Bitwarden CLI/MCP to retrieve secrets
- `setEnvironmentVariables()` - Export vars to shell environment

#### 3. Installation Flow Integration

**Update**: `package/bin/cli.js`

Add new command: `ai-agent secrets sync`
- Discover required secrets from MCP configs
- Fetch from Bitwarden
- Set env vars (write to shell profile or `.env` file)

---

## 📝 Detailed Workflow

### Phase 1: Initial Setup

**User Actions:**
1. Install Bitwarden CLI: `npm install -g @bitwarden/cli`
2. Login to Bitwarden: `bw login`
3. Unlock vault and set session: 
   ```bash
   export BW_SESSION=$(bw unlock --raw)
   ```
4. Store all MCP secrets in Bitwarden vault (organized by folders/items)

**Package Actions:**
1. Bundle Bitwarden MCP server in package
2. Auto-install Bitwarden MCP to Antigravity on first `ai-agent install`

### Phase 2: Secret Sync Workflow

**Step 1: Pull MCP Configs**
```bash
ai-agent pull
```
- Downloads MCP server configs from GitHub repo
- Configs contain `${VAR}` placeholders

**Step 2: Discover Required Secrets**

Package scans all MCP configs and finds:
```
Required secrets:
- ${GITHUB_TOKEN}
- ${OPENAI_API_KEY}
- ${DATABASE_PASSWORD}
```

**Step 3: Validate Bitwarden Authentication**

Check if `BW_SESSION` is set:
- ✅ If set → proceed to fetch
- ❌ If not → warn user to unlock Bitwarden vault

**Step 4: Fetch Secrets from Bitwarden**

Use Bitwarden CLI or MCP server to retrieve secrets:

**Option A: Using Bitwarden CLI**
```bash
bw get password "GITHUB_TOKEN" --session $BW_SESSION
```

**Option B: Using Bitwarden MCP** (if Antigravity supports it)
- Query Bitwarden MCP server via MCP protocol
- Retrieve secret values programmatically

**Step 5: Set Environment Variables**

**Option 1: Write to shell profile** (persistent)
```bash
# Append to ~/.zshrc or ~/.bashrc
echo 'export GITHUB_TOKEN="ghp_xxx..."' >> ~/.zshrc
source ~/.zshrc
```

**Option 2: Write to `.env` file** (project-specific)
```bash
# Create ~/.ai-agent/.env
GITHUB_TOKEN=ghp_xxx...
OPENAI_API_KEY=sk-xxx...
```

**Option 3: Set for current session only**
```bash
export GITHUB_TOKEN="ghp_xxx..."
```

**Step 6: Verify Setup**

Package confirms:
```
✓ Fetched 3 secrets from Bitwarden
✓ Set environment variables
✓ MCP servers ready to use
```

### Phase 3: Antigravity Launch

When Antigravity starts:
1. Reads `mcp_config.json`
2. Resolves `${GITHUB_TOKEN}` from environment
3. Launches GitHub MCP server with token
4. All MCP servers work seamlessly

---

## 🔍 Implementation Details

### Secret Naming Convention

**In Bitwarden Vault:**

Organization structure:
```
Folder: MCP Secrets
├── Item: GITHUB_TOKEN
│   └── Password: ghp_xxx...
├── Item: OPENAI_API_KEY
│   └── Password: sk-xxx...
└── Item: DATABASE_PASSWORD
    └── Password: mypass123
```

**Mapping Rule**: 
- Env var name `${GITHUB_TOKEN}` → Bitwarden item name `GITHUB_TOKEN`
- Use item's password field as secret value

### Bitwarden CLI Commands

**Login & Unlock:**
```bash
bw login
export BW_SESSION=$(bw unlock --raw)
```

**Fetch Secret:**
```bash
SECRET_VALUE=$(bw get password "GITHUB_TOKEN" --session $BW_SESSION)
```

**List all items** (for discovery):
```bash
bw list items --session $BW_SESSION --search "MCP Secrets"
```

### Error Handling

**Scenario 1: `BW_SESSION` not set**
```
⚠️  Bitwarden session not found
ℹ️  Run: export BW_SESSION=$(bw unlock --raw)
```

**Scenario 2: Secret not found in Bitwarden**
```
⚠️  Secret GITHUB_TOKEN not found in Bitwarden vault
ℹ️  Add it to Bitwarden or set manually: export GITHUB_TOKEN=...
```

**Scenario 3: Bitwarden CLI not installed**
```
⚠️  Bitwarden CLI not found
ℹ️  Install: npm install -g @bitwarden/cli
```

---

## 🎯 User Experience

### Ideal Workflow

**New Machine Setup:**
```bash
# 1. Install package
npm install -g ai-agent-config

# 2. Init with GitHub repo
ai-agent init --repo https://github.com/user/my-skills.git

# 3. Setup Bitwarden (one-time)
bw login
export BW_SESSION=$(bw unlock --raw)

# 4. Sync secrets automatically
ai-agent pull
ai-agent secrets sync

# Output:
# 🔍 Scanning MCP configs...
# Found 3 required secrets: GITHUB_TOKEN, OPENAI_API_KEY, DATABASE_PASSWORD
# 
# 🔐 Fetching from Bitwarden...
# ✓ GITHUB_TOKEN
# ✓ OPENAI_API_KEY
# ✓ DATABASE_PASSWORD
#
# ✓ Set 3 environment variables
# ✓ MCP servers ready to use!

# 5. Install to Antigravity
ai-agent install

# 6. Launch Antigravity - everything works!
```

**Daily Usage:**
```bash
# Just pull and install - secrets already configured
ai-agent pull
ai-agent install
```

---

## ✅ Success Criteria

1. ✅ User chỉ cần setup Bitwarden vault một lần
2. ✅ `ai-agent secrets sync` tự động fetch và set env vars
3. ✅ Không cần hardcode secrets trong config files
4. ✅ Config files vẫn safe để push lên GitHub public
5. ✅ Package tự detect `BW_SESSION` và warn nếu chưa setup
6. ✅ Clear error messages khi secrets missing
7. ✅ Support multiple machines (secrets centralized in Bitwarden)

---

## 🚧 Challenges & Open Questions

### 1. Environment Variable Persistence

**Challenge**: Env vars set via `export` chỉ tồn tại trong current session

**Options**:
- **A**: Write to shell profile (`~/.zshrc`, `~/.bashrc`) - persistent
  - ✅ Pro: Survives restarts
  - ❌ Con: Pollutes user's shell profile
  
- **B**: Write to `.env` file, load before Antigravity
  - ✅ Pro: Clean separation
  - ❌ Con: User must manually load or setup auto-load
  
- **C**: Rely on user to set `BW_SESSION` before each Antigravity launch
  - ✅ Pro: Maximum security (session expires)
  - ❌ Con: User friction

**Recommendation**: Option A with user consent
- Ask user: "Add env vars to ~/.zshrc? (Y/n)"
- Or: `ai-agent secrets sync --profile` flag

### 2. Bitwarden MCP vs Bitwarden CLI

**Challenge**: Should we use Bitwarden MCP server or Bitwarden CLI for fetching secrets?

**Bitwarden CLI** (Recommended for Phase 1):
- ✅ Simpler, well-documented
- ✅ Direct command execution
- ✅ Works in shell scripts
- ❌ Requires `bw` CLI installed

**Bitwarden MCP Server**:
- ✅ Native MCP integration
- ✅ Could leverage Antigravity's MCP support
- ❌ More complex setup
- ❌ Might require Antigravity to be running

**Recommendation**: Start with CLI, migrate to MCP later

### 3. Secret Rotation

**Challenge**: How to handle secret updates?

**Solution**:
- `ai-agent secrets sync --refresh` - refetch all secrets from Bitwarden
- User updates secret in Bitwarden → re-run sync → new values exported

### 4. Cross-Platform Support

**Challenge**: Shell profiles differ (zsh, bash, fish, PowerShell)

**Solution**:
- Detect shell: `echo $SHELL`
- Write to correct profile:
  - macOS/Linux: `~/.zshrc` or `~/.bashrc`
  - Windows: PowerShell profile or `.env` file

### 5. Bitwarden Folder Organization

**Challenge**: How should users organize secrets in Bitwarden?

**Recommendation**:
- Enforce folder structure: `MCP Secrets/` folder
- Or: Use tags (e.g., tag items with `mcp-secret`)
- Package scans only items in designated folder/tag

**Config**:
```json
{
  "secrets": {
    "provider": "bitwarden",
    "folder": "MCP Secrets",
    "sessionVar": "BW_SESSION"
  }
}
```

### 6. Security Considerations

**Risks**:
- ⚠️ Env vars visible in process list (`ps aux | grep`)
- ⚠️ Env vars persisted in shell history if typed manually
- ⚠️ `BW_SESSION` grants full vault access

**Mitigations**:
- ✅ Use `BW_SESSION` only (no master password in env)
- ✅ Session expires after inactivity
- ✅ Recommend users lock Bitwarden when not in use
- ✅ Document security best practices

---

## 🚀 Implementation Phases

### Phase 1: Core Secret Management

**Scope**: Antigravity only, Bitwarden CLI-based

Tasks:
- [ ] Bundle Bitwarden MCP server in package
- [ ] Create `secret-manager.js` module
- [ ] Implement `discoverRequiredSecrets()` - scan MCP configs
- [ ] Implement `validateBitwardenAuth()` - check `BW_SESSION`
- [ ] Implement `fetchSecretsFromBitwarden()` - use `bw` CLI
- [ ] Implement `setEnvironmentVariables()` - write to shell profile
- [ ] Add CLI command: `ai-agent secrets sync`
- [ ] Add validation during `ai-agent install`

### Phase 2: User Experience Enhancements

- [ ] Interactive prompt for shell profile selection
- [ ] `--refresh` flag to update secrets
- [ ] `--dry-run` to preview changes
- [ ] Better error messages and troubleshooting
- [ ] Documentation and examples

### Phase 3: Advanced Features

- [ ] Support multiple secret providers (1Password, HashiCorp Vault)
- [ ] GUI for secret mapping (if needed)
- [ ] Auto-refresh on secret expiration
- [ ] Secret health check command
- [ ] Team sharing configurations

---

## 📚 Alternative Approaches

### Option A: Manual `.env` File

**User manually creates** `~/.ai-agent/.env`:
```
GITHUB_TOKEN=ghp_xxx...
OPENAI_API_KEY=sk-xxx...
```

Package loads this file before setting env vars.

**Pros**: Simple, no Bitwarden dependency
**Cons**: Secrets in plaintext, not centralized

### Option B: Encrypted Config File

Package encrypts secrets using master password:
```bash
ai-agent secrets add GITHUB_TOKEN
# Prompt for secret value
# Encrypt with master password
# Store in ~/.ai-agent/secrets.enc
```

**Pros**: No external dependencies
**Cons**: Re-inventing password manager, less secure than Bitwarden

### Option C: OS Keychain Integration

Use macOS Keychain, Windows Credential Manager, Linux Secret Service:
```bash
ai-agent secrets add GITHUB_TOKEN --keychain
```

**Pros**: OS-native, secure
**Cons**: Platform-specific code, not cross-platform

---

## 🤔 Questions for User

1. **Persistence Strategy**: Shell profile vs `.env` file vs session-only?
2. **Bitwarden Folder**: Should we enforce a specific folder name or let users configure?
3. **Fallback**: If Bitwarden not available, allow manual env var setup?
4. **Automatic vs Manual**: Should `ai-agent install` auto-run secrets sync, or require explicit `ai-agent secrets sync`?
5. **Multi-Provider**: Support 1Password, Vault in future? Or Bitwarden-only?

---

## 📖 Related Resources

- [Bitwarden MCP Server](https://github.com/bitwarden/mcp-server)
- [Bitwarden CLI Docs](https://bitwarden.com/help/cli/)
- [MCP Auth Spec](https://modelcontextprotocol.io/docs/concepts/authentication)
- [Environment Variable Best Practices](https://12factor.net/config)

---

**Next Steps:**
1. ⏳ Get user feedback on brainstorm
2. ⏳ Decide on persistence strategy
3. ⏳ Prototype `secret-manager.js` module
4. ⏳ Test Bitwarden CLI integration
5. ⏳ Create detailed implementation plan
