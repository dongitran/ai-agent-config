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
2. Package auto-installs Bitwarden MCP server to Antigravity (enabled by default)
3. On `ai-agent secrets sync`:
   - Package scans all MCP configs
   - Detects required env vars (e.g., ${GITHUB_TOKEN})
   - Uses Bitwarden CLI to fetch secrets
   - Automatically writes env vars to ~/.zshrc
4. Antigravity launches with all secrets available
```

**Bitwarden MCP Server**: Auto-installed to Antigravity and enabled by default. AI agents can query vault directly during conversations.


---

## 🏗️ Architecture Design

### Components

#### 1. Bitwarden CLI Integration

**Purpose**: Use Bitwarden CLI to fetch secrets programmatically

**Installation**: User installs Bitwarden CLI globally
```bash
npm install -g @bitwarden/cli
```

**Authentication**: Package handles automatically
- User prompted for password when running `ai-agent secrets sync`
- Session key managed in-memory only
- No manual unlock needed

**Usage in package**: 
```bash
# Fetch secret from vault
bw get password "GITHUB_TOKEN" --session $BW_SESSION --folder "MCP Secrets"
```

**Note**: Chúng ta dùng **Bitwarden CLI**, không phải Bitwarden MCP server. MCP server là optional nếu user muốn AI agent access Bitwarden vault (use case khác).

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
2. Get Bitwarden API credentials from Web Vault (Settings → Security → Keys)
3. Add API credentials to `~/.zshrc` (or `~/.bashrc` if using bash):
   ```bash
   echo 'export BW_CLIENTID="user.xxx"' >> ~/.zshrc
   echo 'export BW_CLIENTSECRET="yyy"' >> ~/.zshrc
   source ~/.zshrc  # Apply changes
   ```
4. Store all MCP secrets in Bitwarden vault (folder: `MCP Secrets`)

**Package Actions:**
1. Prompt for master password when running `ai-agent secrets sync`
2. Unlock vault programmatically (in-memory session)
3. Fetch secrets and write to `~/.zshrc`

### Phase 2: Secret Sync Workflow

**Two separate commands:**
- `ai-agent pull` - Pull code only (skills, workflows, MCP configs)
- `ai-agent secrets sync` - Sync secrets from Bitwarden (separate, explicit)

---

#### Command 1: `ai-agent pull`

Pull code from GitHub repository:
```bash
ai-agent pull

# Output:
📥 Pulling from GitHub...
✓ Skills: 5 new
✓ Workflows: 2 new  
✓ MCP Servers: 3 new

✅ Pull completed!
```

**No secrets sync** - keeps command focused and fast.

---

#### Command 2: `ai-agent secrets sync`

**Interactive password prompt:**

```bash
ai-agent secrets sync

# Output:
🔐 Bitwarden Secret Sync

? Enter Bitwarden master password: ****

🔓 Unlocking vault...
✓ Vault unlocked

🔍 Scanning MCP configs for required secrets...
Found 3 secrets:
  • GITHUB_TOKEN
  • OPENAI_API_KEY
  • DATABASE_PASSWORD

🔐 Fetching from Bitwarden (folder: MCP Secrets)...
✓ GITHUB_TOKEN (found)
✓ OPENAI_API_KEY (found)
⚠ DATABASE_PASSWORD (not found in vault)

💾 Writing secrets to ~/.zshrc...
✓ Added 2 environment variables

✅ Secrets synced successfully!

ℹ️  Next steps:
   1. Restart terminal or run: source ~/.zshrc
   2. Missing secret: DATABASE_PASSWORD (add to Bitwarden or set manually)
```

**Technical Implementation:**

1. **Password Prompt**: Use `inquirer` npm package
   ```javascript
   const inquirer = require('inquirer');
   
   const { masterPassword } = await inquirer.prompt([{
     type: 'password',
     name: 'masterPassword',
     message: 'Enter Bitwarden master password:',
     mask: '*'
   }]);
   ```

2. **Unlock Bitwarden**:
   ```bash
   # Pass password via stdin (không lưu trong env)
   echo "password" | bw unlock --passwordstdin --raw
   # → Returns session key
   ```

3. **Fetch Secrets**: Use session key (in-memory only)
   ```bash
   bw get password "GITHUB_TOKEN" --session $SESSION_KEY
   ```

4. **Write to Profile**: Append secrets to `~/.zshrc`
   ```bash
   # === AI Agent MCP Secrets (auto-generated) ===
   export GITHUB_TOKEN="ghp_xxx..."
   export OPENAI_API_KEY="sk_xxx..."
   # === End AI Agent MCP Secrets ===
   ```

5. **Cleanup**: Session key discarded after command completes

---

#### Security Model

**What gets stored:**
- ✅ API credentials (`BW_CLIENTID`, `BW_CLIENTSECRET`) in `~/.zshrc`
- ✅ Synced secrets (GITHUB_TOKEN, etc.) in `~/.zshrc`
- ❌ **NEVER** store Bitwarden master password

**Session handling:**
- Password prompted each time `secrets sync` runs
- Session key kept in memory only
- No persistent `BW_SESSION` env var

**User must:**
1. Setup Bitwarden API key once (in shell profile)
2. Run `secrets sync` when:
   - First time setup
   - Secrets changed in Bitwarden
   - New machine setup
3. Enter master password each time

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

### Bitwarden CLI Commands (used by package)

**Unlock with password stdin:**
```bash
echo "master_password" | bw unlock --passwordstdin --raw
# → Returns session key (in-memory only)
```

**Fetch Secret:**
```bash
bw get password "GITHUB_TOKEN" --session $SESSION_KEY
```

**List all items** (for discovery):
```bash
bw list items --session $SESSION_KEY --folder "MCP Secrets"
```

### Error Handling

**Scenario 1: Password prompt failed**
```
⚠️  Failed to unlock Bitwarden vault
ℹ️  Check your master password and try again
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

**Initial Setup (New Machine):**
```bash
# 1. Install package
npm install -g ai-agent-config

# 2. Install Bitwarden CLI
npm install -g @bitwarden/cli

# 3. Get Bitwarden API credentials (from Web Vault)
# Settings → Security → Keys → API Key

# 4. Add Bitwarden API credentials to ~/.zshrc
echo 'export BW_CLIENTID="user.xxx"' >> ~/.zshrc
echo 'export BW_CLIENTSECRET="yyy"' >> ~/.zshrc
source ~/.zshrc  # Apply changes immediately

# 5. Init with GitHub repo
ai-agent init --repo https://github.com/user/my-skills.git

# 6. Pull code
ai-agent pull
# → Downloads skills, workflows, MCP configs

# 7. Sync secrets (prompts for password)
ai-agent secrets sync
# ? Enter Bitwarden master password: ****
# ✓ Synced 3 secrets to ~/.zshrc

# 8. Apply env vars
source ~/.zshrc

# 9. Launch Antigravity - everything works! 🚀
```

---

**Daily Usage:**
```bash
# Pull latest code
ai-agent pull

# Re-sync secrets if needed (prompts password)
ai-agent secrets sync
```

---

**When Secrets Change:**
```bash
# 1. Update secret in Bitwarden vault (web/app)
# 2. Re-sync (prompts for password)
ai-agent secrets sync

# 3. Reload shell
source ~/.zshrc
```

> **Note**: `pull` only pulls code. Secrets sync là separate command, chỉ chạy khi cần.

---

## ✅ Success Criteria

1. ✅ `ai-agent pull` pulls code only (skills, workflows, MCP servers)
2. ✅ `ai-agent secrets sync` - separate command for Bitwarden integration
3. ✅ Password prompt using `inquirer` (masked input)
4. ✅ No plaintext password storage anywhere
5. ✅ Session key kept in memory only, discarded after sync
6. ✅ Secrets written to `~/.zshrc` with clear comments
7. ✅ Scan MCP configs to discover required env vars
8. ✅ Fetch from Bitwarden folder `MCP Secrets`
9. ✅ Handle missing secrets gracefully (warn user)
10. ✅ Secrets automatically written to `~/.zshrc` (no confirmation needed)

---

## 🚧 Challenges & Open Questions

### 1. Environment Variable Persistence

**Vấn đề**: Khi bạn chạy `export GITHUB_TOKEN="ghp_xxx"` trong terminal, env var này chỉ tồn tại trong **session hiện tại**. Khi bạn:
- Đóng terminal → mất hết
- Mở terminal mới → không có
- Restart máy → không có

**Ví dụ thực tế:**

**Session 1** (Terminal cũ):
```bash
export GITHUB_TOKEN="ghp_xxx"
echo $GITHUB_TOKEN  # → ghp_xxx ✅
```

**Session 2** (Terminal mới):
```bash
echo $GITHUB_TOKEN  # → (empty) ❌
```

**Giải pháp: Tự động lưu env vars vào shell profile để persist**

Package tự động append secrets vào `~/.zshrc` (macOS/Linux với zsh) hoặc `~/.bashrc` (bash):

```bash
# === AI Agent MCP Secrets (auto-generated, do not edit manually) ===
export GITHUB_TOKEN="ghp_xxx"
export OPENAI_API_KEY="sk-xxx"
# === End AI Agent MCP Secrets (last updated: 2024-01-15T10:30:00Z) ===
```

**Ưu điểm:**
- ✅ Tự động load mỗi khi mở terminal mới
- ✅ Persistent across restarts
- ✅ Không cần user manually source file
- ✅ Clear markers để dễ tìm và xóa nếu cần

**Bảo mật:**
- Secrets được lưu plaintext trong `~/.zshrc`
- Recommend: `chmod 600 ~/.zshrc` để bảo vệ file
- Master password **NEVER** stored anywhere

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

### 5. Security Considerations

**Risks**:
- ⚠️ Env vars visible in process list (`ps aux | grep`)
- ⚠️ Synced secrets persisted in `~/.zshrc` (plaintext)
- ⚠️ API credentials (`BW_CLIENTID`, `BW_CLIENTSECRET`) in shell profile

**Mitigations**:
- ✅ Master password **never** stored anywhere
- ✅ Session key in-memory only, discarded after sync
- ✅ Password prompt each time secrets sync runs
- ✅ `chmod 600 ~/.zshrc` to protect shell profile
- ✅ Document security best practices

---

## 🚀 Implementation Phases

### Phase 1: Core Secret Management

**Scope**: Bitwarden CLI integration with password prompt

Tasks:
- [ ] Add `inquirer` dependency for password input
- [ ] Create `secret-manager.js` module
- [ ] Implement `promptPassword()` - masked password input
- [ ] Implement `unlockBitwarden(password)` - unlock with stdin
- [ ] Implement `discoverRequiredSecrets()` - scan MCP configs
- [ ] Implement `fetchSecretsFromBitwarden(sessionKey)` - use `bw` CLI
- [ ] Implement `writeToShellProfile(secrets)` - append to ~/.zshrc
- [ ] Add CLI command: `ai-agent secrets sync`
- [ ] Keep `ai-agent pull` unchanged (code only)

### Phase 2: User Experience Enhancements

- [ ] Auto-detect shell type (zsh, bash) and write to correct profile
- [ ] Clear output with emojis and progress indicators
- [ ] Handle missing secrets gracefully (warn, don't fail)
- [ ] Detect shell type (zsh, bash) automatically
- [ ] Better error messages for common issues

### Phase 3: Testing & Documentation

- [ ] Unit tests for secret-manager module
- [ ] Test password prompt flow
- [ ] Test Bitwarden unlock/fetch
- [ ] Manual testing with real Bitwarden vault
- [ ] Documentation and usage examples
- [ ] Security best practices guide

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

## 🤔 Questions for Discussion

1. **✅ RESOLVED - Persistence**: Use shell profile (`~/.zshrc`) with user consent
2. **✅ RESOLVED - Bitwarden Folder**: Fixed folder name `MCP Secrets`, Login item type
3. **Fallback**: If Bitwarden fails or secret not found, allow user to manually set env var?
4. **Multi-Provider**: Support 1Password, HashiCorp Vault in future? Or Bitwarden-only for now?
5. **Auto-reload**: After adding secrets to profile, should package auto `source ~/.zshrc`? (Might affect current shell state)

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
