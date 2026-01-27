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
- 🔄 **Auto-Sync** - Automatically sync skills from external repositories (Vercel Labs, Everything Claude Code, etc.)
- 🤖 **GitHub Actions** - Weekly auto-updates with PR creation
- 📦 **26+ Production Skills** - 2 core + 2 Vercel + 11 Everything Claude Code + 1 NestJS + 1 Playwright + 4 workflows
- ✅ **Tested** - Comprehensive test suite with CI/CD pipeline
- 🎨 **Curated** - Hand-picked skills from industry leaders and hackathon winners

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

#### From Vercel Labs
| Skill | Description |
|-------|-------------|
| ⚛️ **react-best-practices** | 57 React/Next.js optimization rules from Vercel Engineering |
| 🎨 **web-design-guidelines** | Web design best practices and patterns |

#### From Everything Claude Code (Anthropic Hackathon Winner)
| Skill | Description |
|-------|-------------|
| 🔧 **backend-patterns** | API design, caching strategies, database optimization |
| 🐘 **postgres-patterns** | PostgreSQL optimization, indexing, query patterns |
| 💎 **frontend-patterns** | Component architecture, state management, rendering optimization |
| 📐 **project-guidelines-example** | Project structure templates and organizational patterns |
| 📋 **coding-standards** | Language-specific best practices and style guides |
| 🛡️ **security-review** | Security checklist and vulnerability analysis |
| 🧪 **tdd-workflow** | Test-driven development methodology |
| 🎓 **continuous-learning** | Auto-extract patterns from sessions into reusable skills |
| ⚡ **eval-harness** | Evaluation framework with pass@k metrics |
| 🔄 **verification-loop** | Continuous verification with checkpoint system |
| 📦 **strategic-compact** | Context optimization and compaction strategies |

#### From Kadajett (NestJS Expert)
| Skill | Description |
|-------|-------------|
| 🏗️ **nestjs-best-practices** | 40 production-ready NestJS patterns: modules, DI, security, performance, microservices |

#### From Testing Tools
| Skill | Description |
|-------|-------------|
| 🎭 **playwright** | End-to-end testing automation with Playwright |

## 🔄 Included Workflows

| Workflow | Description | Available As |
|----------|-------------|--------------|
| 📋 **release-notes** | Generate comprehensive release notes with migration guides & diagrams | `/release-notes` in Claude Code |
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
  - `backend-patterns`, `postgres-patterns`, `frontend-patterns`, `coding-standards`, `security-review`, `tdd-workflow`, `continuous-learning`, `eval-harness`, `verification-loop`, `strategic-compact`, `project-guidelines-example`: From [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) by Affaan Mustafa (MIT License)
  - `nestjs-best-practices`: From [agent-nestjs-skills](https://github.com/Kadajett/agent-nestjs-skills) by Kadajett (MIT License)
  - `playwright`: From [playwright-skill](https://github.com/lackeyjb/playwright-skill) by lackeyjb (MIT License)

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
