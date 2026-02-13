# ai-agent-config

> Universal skill & workflow manager for AI coding assistants with bi-directional GitHub sync

[![npm version](https://badge.fury.io/js/ai-agent-config.svg)](https://www.npmjs.com/package/ai-agent-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

One command to manage AI coding skills across Claude Code, Antigravity, Cursor, Windsurf, Codex CLI, and more.

## Quick Start

```bash
npm install -g ai-agent-config

# Initialize with your GitHub repo
ai-agent init --repo https://github.com/youruser/my-ai-skills.git

# Pull skills from repo and auto-install to platforms
ai-agent pull

# Push local changes to repo
ai-agent push
```

## Add External Skills

```bash
# Add skill sources from GitHub
ai-agent source add https://github.com/vercel-labs/agent-skills.git \
  --name vercel-labs --path skills

ai-agent source add https://github.com/affaan-m/everything-claude-code.git \
  --name everything-claude-code --path skills

# Sync and install
ai-agent update
ai-agent install
```

## CLI Commands

### GitHub Sync
```bash
ai-agent init --repo <url>              # Initialize with repository
ai-agent push [--message "msg"]         # Push skills to GitHub
ai-agent pull                           # Pull from GitHub + auto-install
```

### Source Management
```bash
ai-agent source add <url> [options]     # Add custom source
ai-agent source remove <name>           # Remove source
ai-agent source list                    # List all sources
ai-agent source enable/disable <name>   # Toggle source
ai-agent source info <name>             # View source details
```

### Config Management
```bash
ai-agent config get/set <key> [value]   # Get or set config
ai-agent config edit                    # Open in $EDITOR
ai-agent config validate                # Validate config
ai-agent config export/import [file]    # Export or import config
ai-agent config reset --yes             # Reset to defaults
```

### Installation
```bash
ai-agent update                         # Update from all sources (pull -> sync -> push)
ai-agent install                        # Install skills to platforms
ai-agent list                           # List installed skills
ai-agent platforms                      # Show detected platforms
ai-agent uninstall                      # Remove installed skills
```

### Secret Management
```bash
ai-agent secrets sync                   # Sync MCP secrets from Bitwarden vault
```

## Supported Platforms

| Platform | Skills Path |
|----------|-------------|
| Claude Code | `~/.claude/skills/` |
| Antigravity IDE | `~/.gemini/antigravity/skills/` |
| Cursor | `~/.cursor/skills/` |
| Windsurf | `~/.windsurf/skills/` |
| Codex CLI | `~/.codex/skills/` |
| GitHub Copilot | `~/.github/copilot-instructions.md` |

## File Locations

```
~/.ai-agent/config.json                 # User configuration
~/.ai-agent/sync-repo/                  # Local git clone for sync
~/.ai-agent-external-cache/             # Cached external repos
```

## Team Sharing

```bash
# Export your config
ai-agent config export team-config.json

# Team members import
ai-agent config import team-config.json --merge
```

## License

MIT
