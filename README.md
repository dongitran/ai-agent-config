# 🌌 AI Agent Config

<div align="center">

**✨ Universal Global Skills & Workflows for AI Coding Assistants ✨**

[![npm](https://img.shields.io/npm/v/ai-agent-config)](https://www.npmjs.com/package/ai-agent-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Website](https://img.shields.io/badge/Website-ai--agent--config.pages.dev-8b5cf6)](https://ai-agent-config.pages.dev)

*One Universe of Skills - All AI Platforms* 🪐

</div>

---

## 🎯 What is this?

**ai-agent-config** is an NPM package that provides **global skills** for AI coding assistants. Install once, use everywhere.

## 🚀 Quick Start

```bash
# Install globally
npm install -g ai-agent-config

# CLI commands
ai-agent install              # Install to all platforms
ai-agent sync                 # Update from latest
ai-agent list                 # Show installed skills
ai-agent platforms            # Show detected platforms
ai-agent uninstall            # Remove installed skills

# Options
--platform claude             # Install to specific platform
--skill code-review           # Install specific skill
--force                       # Force overwrite existing files
```

## 🧠 Included Skills

| Skill | Description |
|-------|-------------|
| 🔍 **code-review** | Security, performance & best practices checks |
| 📝 **git-commit** | Conventional commit standards |

## 🔄 Included Workflows

| Workflow | Description |
|----------|-------------|
| 💡 **brainstorm** | 7-phase creative ideation process (Research → Confirm → Clarify → Ideate → Evaluate → Visualize → Decide) |
| 🚀 **create-pr** | GitHub Pull Request creation workflow |
| 🔄 **update-skills** | Sync & install latest skills from repository |

## 💫 Why?

- 🔗 **One source of truth** - Sync skills across all AI tools
- ⚡ **Auto-install** - NPM postinstall magic
- 🌍 **Cross-platform** - Works everywhere

## 🛸 Supported Platforms

| Platform | Path |
|----------|------|
| 🟣 **Claude Code** | `~/.claude/skills/` |
| 🔵 **Antigravity** | `~/.gemini/antigravity/skills/` |
| 🟢 **Cursor** | `~/.cursor/skills/` |
| 🌊 **Windsurf** | `~/.windsurf/skills/` |
| ⚡ **Codex CLI** | `~/.codex/skills/` |
| 🐙 **GitHub Copilot** | `~/.github/copilot-instructions.md` |

## 📂 Structure

```
📦 ai-agent-config
├── 🤖 bin/cli.js          # CLI entry
├── ⚙️  scripts/            # Installation logic
├── 🎯 skills/              # Universal skills
└── 🔄 workflows/           # Shared workflows
```

---

<div align="center">

**Made with 🤖 by [Dong Tran](https://github.com/dongitran)**

*Empowering the AI-assisted development universe* 🌟

</div>
