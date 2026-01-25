# 🌌 AI Agent Config

<div align="center">

**✨ Universal Global Skills & Workflows for AI Coding Assistants ✨**

[![npm](https://img.shields.io/npm/v/ai-agent-config)](https://www.npmjs.com/package/ai-agent-config)
[![CI](https://github.com/dongitran/ai-agent-config/actions/workflows/ci.yml/badge.svg)](https://github.com/dongitran/ai-agent-config/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/Website-ai--agent--config.pages.dev-8b5cf6)](https://ai-agent-config.pages.dev)

*One Universe of Skills - All AI Platforms* 🪐

</div>

---

## 🎯 What is this?

**ai-agent-config** is an NPM package that provides **global skills & workflows** for AI coding assistants. Install once, use everywhere - with automatic syncing from curated external sources.

## ✨ Features

- 🔗 **Cross-Platform** - Works with Claude Code, Antigravity, Cursor, Windsurf, and more
- 🔄 **Auto-Sync** - Automatically sync skills from external repositories (Vercel Labs, etc.)
- 🤖 **GitHub Actions** - Weekly auto-updates with PR creation
- 📦 **Universal Skills** - Share skills across all AI coding assistants
- ✅ **Tested** - Comprehensive test suite with CI/CD pipeline
- 🎨 **Curated** - Hand-picked skills from industry leaders

## 🚀 Quick Start

```bash
# Install globally
npm install -g ai-agent-config

# Sync and install
ai-agent sync                 # Sync from main repository
ai-agent sync-external        # Sync from external sources (Vercel Labs, etc.)
ai-agent install              # Install to all detected platforms

# List available skills
ai-agent list                 # Show main skills & workflows
ai-agent list-external        # Show external skills

# Manage platforms
ai-agent platforms            # Show detected platforms
ai-agent --version            # Show version
```

## 📦 CLI Commands

| Command | Description |
|---------|-------------|
| `ai-agent install` | Install skills to all detected platforms |
| `ai-agent sync` | Sync skills from main GitHub repository |
| `ai-agent sync-external` | Sync skills from external sources (NEW!) |
| `ai-agent list` | List available skills and workflows |
| `ai-agent list-external` | List available external skills (NEW!) |
| `ai-agent platforms` | Show detected AI platforms |
| `ai-agent uninstall` | Remove installed skills |
| `ai-agent version` | Show version number |

### Options

```bash
--platform <name>    # Target specific platform (claude, antigravity, cursor)
--skill <name>       # Install specific skill only
--force              # Force overwrite existing files
--source <name>      # Sync from specific external source
```

## 🧠 Included Skills

### Main Skills

| Skill | Description | Platforms |
|-------|-------------|-----------|
| 🔍 **code-review** | Security, performance & best practices checks | All |
| 📝 **git-commit** | Conventional commit standards with Co-Authored-By | All |

### External Skills (Auto-Synced)

| Skill | Source | Description |
|-------|--------|-------------|
| ⚛️ **react-best-practices** | Vercel Labs | 57 React/Next.js optimization rules from Vercel Engineering |
| 🎨 **web-design-guidelines** | Vercel Labs | Web design best practices and patterns |

*External skills are automatically synced weekly via GitHub Actions*

## 🔄 Included Workflows

| Workflow | Description | Available As |
|----------|-------------|--------------|
| 💡 **brainstorm** | 7-phase creative ideation process | `/brainstorm` in Claude Code |
| 🚀 **create-pr** | GitHub Pull Request creation workflow | `/create-pr` in Claude Code |
| 🔄 **update-skills** | Sync & install latest skills | `/update-skills` in Claude Code |

*Note: Workflows are automatically converted to skills format for Claude Code*

## 🛸 Supported Platforms

| Platform | Skills Path | Workflows Support |
|----------|-------------|-------------------|
| 🟣 **Claude Code** | `~/.claude/skills/` | ✅ (as skills) |
| 🔵 **Antigravity** | `~/.gemini/antigravity/skills/` | ✅ Native |
| 🟢 **Cursor** | `~/.cursor/skills/` | ❌ |
| 🌊 **Windsurf** | `~/.windsurf/skills/` | ❌ |
| ⚡ **Codex CLI** | `~/.codex/skills/` | ❌ |
| 🐙 **GitHub Copilot** | `~/.github/copilot-instructions.md` | ❌ |

## 🔄 External Skills Auto-Sync

### How it works

1. **Configuration**: Define external sources in `.agent/external-skills.json`
2. **Manual Sync**: Run `ai-agent sync-external` anytime
3. **Auto-Sync**: GitHub Actions runs weekly and creates PR when updates detected
4. **Attribution**: Automatic license attribution added to synced skills

### Configure External Sources

Edit `.agent/external-skills.json`:

```json
{
  "sources": [
    {
      "name": "vercel-labs",
      "repo": "https://github.com/vercel-labs/agent-skills.git",
      "branch": "main",
      "skills": [
        { "path": "skills/react-best-practices", "name": "react-best-practices" },
        { "path": "skills/web-design-guidelines", "name": "web-design-guidelines" }
      ],
      "license": "MIT",
      "attribution": "Skills from Vercel Labs (https://github.com/vercel-labs/agent-skills)"
    }
  ]
}
```

### Sync Commands

```bash
# Sync all external skills
ai-agent sync-external

# Sync with force overwrite
ai-agent sync-external --force

# Sync from specific source
ai-agent sync-external --source vercel-labs

# Sync specific skill only
ai-agent sync-external --skill react-best-practices

# List available external skills
ai-agent list-external
```

## 💫 Why?

- 🔗 **One source of truth** - Sync skills across all AI tools
- ⚡ **Auto-install** - NPM postinstall detection and guidance
- 🌍 **Cross-platform** - Works with all major AI coding assistants
- 🤖 **Auto-updates** - GitHub Actions sync external skills weekly
- 📚 **Curated sources** - Hand-picked skills from industry leaders (Vercel, etc.)
- ✅ **Tested** - Comprehensive test suite with CI/CD
- 🎯 **Slash commands** - Workflows available as `/commands` in Claude Code

## 📂 Project Structure

```
📦 ai-agent-config
├── 🤖 package/
│   ├── bin/cli.js              # CLI entry point
│   ├── scripts/
│   │   ├── installer.js        # Main installation logic
│   │   ├── platforms.js        # Platform detection & config
│   │   └── external-sync.js    # External skills sync (NEW!)
│   └── test/                   # Test suite (NEW!)
├── 🎯 .agent/
│   ├── skills/                 # Main + External skills
│   │   ├── code-review/
│   │   ├── git-commit/
│   │   ├── react-best-practices/    # From Vercel Labs
│   │   └── web-design-guidelines/   # From Vercel Labs
│   ├── workflows/              # Shared workflows
│   │   ├── brainstorm.md
│   │   ├── create-pr.md
│   │   └── update-skills.md
│   └── external-skills.json    # External sources config (NEW!)
├── 🔧 .github/workflows/
│   ├── ci.yml                  # Test & build (NEW!)
│   └── sync-external.yml       # Auto-sync external skills (NEW!)
└── 📖 docs/                    # Landing page
```

## 🧪 Testing

```bash
# Run tests
cd package && npm test

# Test output
✓ 32 tests passed
  - 8 CLI tests
  - 6 Installer tests
  - 18 Platform tests
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Add your skills** to `.agent/skills/`
2. **Add external sources** to `.agent/external-skills.json`
3. **Run tests** with `npm test`
4. **Submit PR** - CI will automatically test

## 📜 License

MIT License - see [LICENSE](LICENSE) file

### Attribution

- Main skills: Created by [@dongitran](https://github.com/dongitran)
- External skills:
  - `react-best-practices`, `web-design-guidelines`: From [Vercel Labs](https://github.com/vercel-labs/agent-skills) (MIT License)

## 🔗 Links

- 📦 [NPM Package](https://www.npmjs.com/package/ai-agent-config)
- 🌐 [Website](https://ai-agent-config.pages.dev)
- 📖 [Documentation](https://github.com/dongitran/ai-agent-config)
- 🐛 [Issues](https://github.com/dongitran/ai-agent-config/issues)
- 🔄 [Changelog](https://github.com/dongitran/ai-agent-config/releases)

---

<div align="center">

**Made with 🤖 by [Dong Tran](https://github.com/dongitran)**

*Empowering the AI-assisted development universe* 🌟

[⭐ Star on GitHub](https://github.com/dongitran/ai-agent-config) • [📦 Install from NPM](https://www.npmjs.com/package/ai-agent-config) • [🌐 Visit Website](https://ai-agent-config.pages.dev)

</div>
