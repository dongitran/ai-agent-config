# ai-agent-config

> Universal skill & workflow manager for AI coding assistants with bi-directional GitHub sync

[![npm version](https://badge.fury.io/js/ai-agent-config.svg)](https://www.npmjs.com/package/ai-agent-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install -g ai-agent-config
```

## Quick Start

```bash
# Initialize with your GitHub repo
ai-agent init --repo https://github.com/youruser/my-ai-skills.git

# Pull skills and auto-install to platforms
ai-agent pull

# Add external skill sources
ai-agent source add https://github.com/vercel-labs/agent-skills.git \
  --name vercel-labs --path skills

# Sync external skills (pull -> sync -> push)
ai-agent update
```

## Commands

| Command | Description |
|---------|-------------|
| `init --repo <url>` | Initialize config and clone repo |
| `push` / `pull` | Git push/pull with your skills repo |
| `update` | Pull -> sync external skills -> push |
| `install` | Copy skills to platform directories |
| `list` | List installed skills |
| `platforms` | Show detected platforms |
| `source add/remove/list` | Manage skill sources |
| `config get/set/edit` | Manage configuration |
| `uninstall` | Remove installed skills |

## Supported Platforms

| Platform | Skills Path |
|----------|-------------|
| Claude Code | `~/.claude/skills/` |
| Antigravity IDE | `~/.gemini/antigravity/skills/` |
| Cursor | `~/.cursor/skills/` |
| Windsurf | `~/.windsurf/skills/` |
| Codex CLI | `~/.codex/skills/` |
| GitHub Copilot | `~/.github/copilot-instructions.md` |

## Configuration

User config at `~/.ai-agent/config.json`:

```json
{
  "version": "2.3",
  "repository": {
    "url": "https://github.com/youruser/my-ai-skills.git",
    "branch": "main",
    "local": "~/.ai-agent/sync-repo"
  },
  "sources": {
    "official": [],
    "custom": []
  }
}
```

## License

MIT
