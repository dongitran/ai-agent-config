# Plan 03: MCP Servers with Bitwarden Environment Resolution

> Tích hợp MCP servers vào hệ thống ai-agent-config với `bitwardenEnv` thay cho `env`
> Secrets được resolve tự động từ Bitwarden vault khi chạy `secrets sync`

**Version**: v2.6.0
**Created**: 2026-02-13
**Status**: Implemented
**Depends on**: [Plan 01](01-mcp-sync-feature.md) (MCP structure), [Plan 02](02-bitwarden-secret-management.md) (Bitwarden integration)

---

## Problem Statement

### Hiện trạng

Plan 01 đã define cấu trúc `.agent/mcp-servers/` và Plan 02 đã implement `secrets sync` để lấy secrets từ Bitwarden. Nhưng **kiến trúc hiện tại bị couple chặt với platform**:

1. **`secrets sync` scan trực tiếp `mcp_config.json` của Antigravity** để tìm `${VAR}` placeholder
2. → Phải install MCP vào Antigravity trước, rồi mới sync secrets được
3. → Muốn thêm Claude Code (`.mcp.json`) hoặc platform khác → phải viết thêm scanner riêng cho mỗi platform
4. → **Không scale được**

### Vấn đề kiến trúc (code hiện tại: `secret-manager.js:157-185`)

```javascript
// HIỆN TẠI - discoverRequiredSecrets() scan PLATFORM config (Antigravity):
function discoverRequiredSecrets() {
    const mcpConfigPath = path.join(antigravity.configPath, "mcp_config.json");
    //                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                    Scan file CỦA PLATFORM → couple chặt với Antigravity
    const content = fs.readFileSync(mcpConfigPath);
    const regex = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;  // tìm ${VAR}
    return [...content.matchAll(regex)];
}
```

**Vấn đề:**
- Scan file config **của platform** (Antigravity) → couple chặt
- Phải install MCP vào Antigravity trước, thì mới có file để scan
- Muốn thêm Claude Code? → viết thêm scanner đọc `.mcp.json` (format khác)
- Muốn thêm Cursor? → lại thêm scanner nữa
- **Mỗi platform 1 format riêng, mỗi platform 1 scanner = không scale**

### Giải pháp: Scan từ REPO clone về, write ra platforms

```
Plan 03 - Source of truth = Repo đã clone về local:

  secrets sync
       ↓
  Scan USER REPO (clone về khi chạy `ai-agent init --repo`):
       ~/.ai-agent/sync-repo/.agent/mcp-servers/*/config.json
       ↑
       User repo, clone/update bởi SyncManager khi pull/push
       1 format duy nhất, KHÔNG phụ thuộc platform nào
       ↓
  Đọc field "bitwardenEnv" từ mỗi config.json
       ↓
  Fetch values từ Bitwarden vault
       ↓
  Write ra từng platform (mỗi platform chỉ cần 1 writer function):
       ├── writeToAntigravity(servers)  → ~/.gemini/antigravity/mcp_config.json  ← implement trước
       ├── writeToClaudeCode(servers)   → ~/.claude/.mcp.json                   ← thêm sau
       ├── writeToCursor(servers)       → ~/.cursor/mcp.json                    ← thêm sau
       └── ...

→ Thêm platform mới = chỉ thêm 1 writer function
→ Config format trong repo KHÔNG ĐỔI
→ Repo sync 1 lần, install cho tất cả platforms
```

**Tại sao scan repo chứ không scan platform?**
1. **Không cần install trước**: Repo đã clone sẵn khi gắn với package (`ai-agent init --repo`), scan được ngay
2. **1 format duy nhất**: Tất cả MCP servers define cùng schema (`bitwardenEnv`, `command`, `args`)
3. **Platform-agnostic**: Thêm Claude Code = chỉ thêm 1 writer function, config repo không đổi
4. **Nhất quán**: Secrets resolve 1 lần từ Bitwarden → write cho tất cả platforms cùng lúc

---

## Design

### 1. MCP Server Config Format (Updated)

**File**: `.agent/mcp-servers/<name>/config.json`

```jsonc
{
  "name": "github",
  "description": "GitHub MCP Server - Access GitHub repos, issues, PRs",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],

  // NEW: Bitwarden-backed env vars
  // Key = env var name khi install vào platform
  // Value = tên item trong Bitwarden vault (folder "MCP Secrets")
  "bitwardenEnv": {
    "GITHUB_TOKEN": "GITHUB_TOKEN"
  },

  // Optional: disable specific tools
  "disabledTools": [],

  // Optional: default enabled/disabled
  "enabled": true
}
```

**Giải thích các field:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Server identifier, phải match folder name |
| `description` | string | No | Mô tả server |
| `command` | string | Yes | Executable command |
| `args` | string[] | Yes | Command arguments |
| `bitwardenEnv` | object | No | Env vars cần fetch từ Bitwarden. Key = env var name, Value = Bitwarden item name |
| `disabledTools` | string[] | No | Tools cần disable |
| `enabled` | boolean | No | Default: true. Set false để skip install |

### 2. Ví dụ

**`.agent/mcp-servers/github/config.json`**:
```json
{
  "name": "github",
  "description": "GitHub MCP Server",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "bitwardenEnv": {
    "GITHUB_TOKEN": "GITHUB_TOKEN"
  },
  "enabled": true
}
```

### 3. Lưu ý: Bỏ qua folder `bitwarden`

Folder `.agent/mcp-servers/bitwarden/` đã tồn tại trong repo nhưng **Bitwarden MCP server được quản lý riêng bởi `postinstall.js`** (auto-setup khi `npm install`). Khi scan `.agent/mcp-servers/`, **bỏ qua folder `bitwarden`** để tránh conflict với logic cài đặt hiện tại.

### 4. Flow tổng thể

```
                    .agent/mcp-servers/
                    ├── github/config.json      (bitwardenEnv: {GITHUB_TOKEN: "GITHUB_TOKEN"})
                    ├── bitwarden/              ← SKIP (quản lý bởi postinstall.js)
                    └── .../config.json
                              │
                              ▼
              ┌──────────────────────────────┐
              │    ai-agent secrets sync      │
              │                              │
              │  1. Đọc tất cả config.json   │
              │  2. Thu thập bitwardenEnv     │
              │  3. Prompt master password    │
              │  4. Unlock Bitwarden vault    │
              │  5. Fetch secrets             │
              │  6. Build env cho mỗi server  │
              │  7. Merge vào mcp_config.json │
              │  8. Lock vault                │
              └──────────────────────────────┘
                              │
                              ▼
              ~/.gemini/antigravity/mcp_config.json
              {
                "mcpServers": {
                  "github": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-github"],
                    "env": { "GITHUB_TOKEN": "ghp_actual_token_here" }
                  },
                  "bitwarden": { ... },  ← giữ nguyên (quản lý bởi postinstall.js)
                  ...
                }
              }
```

### 4. `ai-agent pull` Flow (Updated)

```
ai-agent pull
  ├── git pull origin main
  ├── Auto-install skills (existing)
  ├── Auto-install workflows (existing)
  └── Auto-install MCP servers (NEW)
        ├── Đọc .agent/mcp-servers/*/config.json từ cache
        ├── Filter enabled servers
        └── Merge vào mcp_config.json
              ├── Server mới → thêm (với bitwardenEnv chưa resolve, dùng placeholder)
              ├── Server đã có → skip (giữ config local có secrets thật)
              └── --force → overwrite
```

**Quan trọng**: `pull` chỉ install structure (command, args, disabledTools). Env vars sẽ dùng placeholder `${VAR}`. User cần chạy `secrets sync` riêng để resolve secrets.

### 5. `ai-agent secrets sync` Flow (Updated)

```
ai-agent secrets sync
  │
  ├── 1. Discover: Đọc .agent/mcp-servers/*/config.json
  │     └── Thu thập tất cả bitwardenEnv entries
  │         { "GITHUB_TOKEN": "GITHUB_TOKEN", "BW_SESSION": "BW_SESSION", ... }
  │
  ├── 2. Authenticate: Prompt master password → unlock vault
  │
  ├── 3. Fetch: Lấy giá trị từ Bitwarden folder "MCP Secrets"
  │     ├── GITHUB_TOKEN → "ghp_xxx" ✅
  │     ├── BW_SESSION → "abc123" ✅
  │     └── MISSING_KEY → ⚠️ warn
  │
  ├── 4. Build: Tạo env object cho mỗi server
  │     github: { env: { GITHUB_TOKEN: "ghp_xxx" } }
  │
  ├── 5. Install: Merge vào mcp_config.json
  │     ├── Đọc existing mcp_config.json
  │     ├── Với mỗi server từ repo (skip bitwarden folder):
  │     │   ├── Nếu chưa có → tạo mới với env resolved
  │     │   └── Nếu đã có → update env field (giữ nguyên các field khác user đã custom)
  │     └── Ghi lại mcp_config.json
  │
  ├── 6. Report:
  │     ✅ github: 1 secret synced
  │     ⚠️ postgres: 1 secret missing
  │
  └── 7. Lock vault
```

---

## Implementation

### Files cần thay đổi

```
NEW:    package/scripts/mcp-installer.js    # Core MCP install + merge logic
EDIT:   package/scripts/installer.js        # Gọi mcp-installer trong install flow
EDIT:   package/scripts/platforms.js        # Thêm mcpConfigPath cho antigravity
EDIT:   package/scripts/secret-manager.js   # Update secrets sync để đọc bitwardenEnv
EDIT:   package/scripts/sync-manager.js     # git add .agent/mcp-servers/
EDIT:   package/bin/cli.js                  # Update list + install + pull output
NEW:    .agent/mcp-servers/notion/config.json      # Example MCP server config
```

### Phase 1: Foundation
- `platforms.js` - thêm `mcpConfigPath` cho Antigravity
- `mcp-installer.js` (NEW) - `getAvailableMcpServers()`, `validateMcpConfig()`, `installMcpServers()`, `collectBitwardenEnvs()`, `installMcpServersWithSecrets()`

### Phase 2: Installer Integration
- `installer.js` - gọi `mcp-installer` trong `installToPlatform()` (Antigravity only)
- `sync-manager.js` - thêm `git add .agent/mcp-servers/` vào `gitCommit()`

### Phase 3: Secrets Sync Integration
- `secret-manager.js` - `discoverRequiredSecrets()` đọc `bitwardenEnv` từ repo thay vì scan `${VAR}` từ platform config
- `syncSecrets()` gọi `installMcpServersWithSecrets()` sau khi fetch secrets

### Phase 4: CLI Integration
- `cli.js` - update `list`, `install`, `secrets sync` output để hiển thị MCP servers

### Merge Rules

| Scenario | Hành vi |
|----------|---------|
| Server mới, chưa có trong local | Thêm mới |
| Server đã có, `pull` (no force) | **Skip** - giữ nguyên local (có thể đã có secrets thật) |
| Server đã có, `pull --force` | Overwrite (mất secrets thật, cần re-run `secrets sync`) |
| Server đã có, `secrets sync` | **Update env field** - giữ nguyên command/args/disabledTools nếu user đã custom |
| Server disabled (`enabled: false`) | Không install |
| Folder `bitwarden` | **Skip** - quản lý riêng bởi `postinstall.js` |

---

## Security Considerations

1. **Repo không chứa secrets**: `bitwardenEnv` chỉ map tên, không có giá trị thật
2. **mcp_config.json chứa secrets thật**: File local, không commit vào git
3. **Bitwarden vault là source of truth**: Mọi secret đều từ vault
4. **Session ephemeral**: Master password prompt mỗi lần sync, session key chỉ in-memory
5. **Shell profile backup**: Giữ backward compat, secrets vẫn write vào `~/.zshrc`

---

## Backward Compatibility

| Feature | Trước | Sau | Breaking? |
|---------|-------|------|-----------|
| `pull` | Chỉ skills + workflows | + MCP servers | No (additive) |
| `install` | Chỉ skills + workflows | + MCP servers | No (additive) |
| `secrets sync` | Scan `${VAR}` từ mcp_config.json | Đọc `bitwardenEnv` từ repo | **Yes** - nhưng tốt hơn |
| `list` | Skills + workflows | + MCP servers | No (additive) |
| Existing mcp_config.json | Không bị touch | Được merge | No (chỉ thêm, không xóa) |
| `env` field trong config.json | Supported | Replaced by `bitwardenEnv` | **Yes** - trong repo format |

---

## Implementation Phases

### Phase 1: Foundation
- [x] Update `platforms.js` - thêm `mcpConfigPath` cho Antigravity
- [x] Create `mcp-installer.js` - getAvailableMcpServers, validateMcpConfig, installMcpServers
- [x] ~~Update `.agent/mcp-servers/bitwarden/config.json`~~ - bitwarden folder đã xoá, quản lý riêng bởi postinstall.js

### Phase 2: Install Integration
- [x] Update `installer.js` - gọi mcp-installer trong installToPlatform
- [x] Update `sync-manager.js` - git add .agent/mcp-servers/
- [x] Update `installer.js` - import mcp-installer module

### Phase 3: Secrets Sync Integration
- [x] Update `secret-manager.js` - đọc bitwardenEnv thay vì scan ${VAR}
- [x] Implement `installMcpServersWithSecrets()` trong mcp-installer.js
- [x] Update syncSecrets() flow

### Phase 4: CLI + UX
- [x] Update `cli.js` - list command hiển thị MCP servers
- [x] Update `cli.js` - install output có MCP servers
- [x] Update `cli.js` - secrets sync output mới
- [x] Thêm hint "Run secrets sync" sau install

### Phase 5: Testing + Polish
- [ ] Manual test: pull → install → secrets sync → Antigravity loads
- [ ] Test merge logic: existing server không bị overwrite
- [ ] Test secrets sync: bitwardenEnv → resolved env
- [ ] Test edge cases: missing secrets, disabled servers, no BW vault
- [x] Update AGENT.md, README

---

## Example: Full User Journey

```bash
# 1. Setup (one-time)
npm install -g ai-agent-config
ai-agent init --repo https://github.com/user/my-ai-config.git

# 2. Pull code + configs
ai-agent pull
# ⬇️ Pulling from GitHub...
# ✅ Pulled successfully!
# 📥 Auto-installing...
# ✓ Installed 15 skills, 4 workflows, 3 MCP servers
# 💡 Run 'ai-agent secrets sync' to resolve Bitwarden secrets

# 3. Resolve secrets
ai-agent secrets sync
# ? Enter Bitwarden master password: ****
# ✓ github: 1 secret resolved
# ✓ bitwarden: 3 secrets resolved
# ✓ filesystem: static env only
# ✅ 3 MCP servers installed to Antigravity

# 4. Launch Antigravity - everything works!

# 5. Daily: khi có update
ai-agent pull
# (MCP mới thêm từ team? Chạy secrets sync)
ai-agent secrets sync
```

---

## Open Questions

1. **Có nên tạo thêm MCP server mẫu** (github, filesystem) ngay trong repo không?
2. **Nếu user đã custom disabledTools** trong local, `secrets sync` có nên giữ nguyên không? (Đề xuất: có)
3. **External MCP sources** (tương tự external-skills.json) - cần thiết chưa hay đợi v2.7?
4. **Claude Code MCP support** (.mcp.json format) - plan riêng hay mở rộng plan này?

---

**Next Steps:**
1. Review plan
2. Tạo thêm MCP server config mẫu (github, filesystem)
3. Implement Phase 1
