# ai-agent-config

> Universal Global Skills & Workflows for AI Coding Assistants - User-configurable skill sources

[![npm version](https://badge.fury.io/js/ai-agent-config.svg)](https://www.npmjs.com/package/ai-agent-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**One command to manage AI coding skills across Claude Code, Antigravity, Cursor, Windsurf, and more.**

## 🚀 What's New in v2.2

- ✅ **Minimal core** - Only 2 essential skills bundled (config-manager, skill-updater)
- ✅ **User-configurable sources** - Add any skill repositories from GitHub
- ✅ **Source management** - Enable, disable, add, remove sources via CLI
- ✅ **Config management** - Export/import configs for team sharing
- ✅ **Zero defaults** - No external sources by default, full user control

## 📦 Quick Start

```bash
# Install globally
npm install -g ai-agent-config

# Initialize (creates config at ~/.ai-agent/config.json)
ai-agent init

# Install bundled skills to platforms
ai-agent install
```

## 🎯 Bundled Skills (2)

The package includes 2 core skills for managing the system:

1. **config-manager** - Manage configuration and custom sources
2. **skill-updater** - Update skills from GitHub repositories

## 📚 Add More Skills

To get more skills, add custom sources from GitHub:

```bash
# Add Vercel Labs skills
ai-agent source add https://github.com/vercel-labs/agent-skills.git \
  --name vercel-labs \
  --path skills

# Add Everything Claude Code
ai-agent source add https://github.com/affaan-m/everything-claude-code.git \
  --name everything-claude-code \
  --path skills

# Update and install
ai-agent update
ai-agent install
```

## 🛠️ CLI Commands

### Source Management
```bash
ai-agent source add <repo-url> [options]    # Add custom source
ai-agent source remove <name>               # Remove source
ai-agent source list                        # List all sources
ai-agent source enable <name>               # Enable source
ai-agent source disable <name>              # Disable source
ai-agent source info <name>                 # View source details
```

### Config Management
```bash
ai-agent config get <key>                   # Get config value
ai-agent config set <key> <value>           # Set config value
ai-agent config edit                        # Edit in $EDITOR
ai-agent config validate                    # Validate config
ai-agent config export [file]               # Export config
ai-agent config import <file> [--merge]     # Import config
ai-agent config reset --yes                 # Reset to defaults
```

### Installation & Updates
```bash
ai-agent init                               # Initialize/migrate to v2.0
ai-agent update [--source name]             # Update skills from sources
ai-agent install [--platform name]          # Install to platforms
ai-agent list                               # List installed skills
ai-agent platforms                          # Show detected platforms
ai-agent uninstall                          # Remove skills
```

## 🎨 Use Cases

### For Companies
```bash
# Add your company's private skills repo
ai-agent source add https://github.com/acme-corp/coding-standards \
  --name acme-standards

# Share config file with team
ai-agent config export acme-config.json

# Team members import
ai-agent config import acme-config.json --merge
```

### For Individual Developers
```bash
# Add skills from multiple sources
ai-agent source add https://github.com/vercel-labs/agent-skills.git --name vercel
ai-agent source add https://github.com/yourname/my-skills --name personal

# Update and install
ai-agent update
ai-agent install
```

## 📍 File Locations

```
~/.ai-agent/
├── config.json                    # User configuration
└── .ai-agent-external-cache/      # Downloaded skill repositories

AI Platform Skills:
~/.claude/skills/                  # Claude Code
~/.gemini/antigravity/skills/      # Antigravity IDE
~/.cursor/skills/                  # Cursor
~/.windsurf/skills/                # Windsurf
```

## 🔧 Configuration File

User config at `~/.ai-agent/config.json`:

```json
{
  "version": "2.0",
  "sources": {
    "official": [],
    "custom": [
      {
        "name": "my-skills",
        "repo": "https://github.com/me/my-skills.git",
        "branch": "main",
        "path": "skills",
        "enabled": true
      }
    ]
  },
  "preferences": {
    "autoUpdate": true,
    "updateInterval": "weekly"
  }
}
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Share your skills**: Create skills repo and share with community
2. **Report issues**: [GitHub Issues](https://github.com/dongitran/ai-agent-config/issues)
3. **Submit PRs**: Improve the core tool

## 🌟 Why ai-agent-config?

- ✅ **Minimal & focused** - Only 2 core skills bundled, add what you need
- ✅ **Full control** - No default external sources, you decide what to install
- ✅ **User-configurable** - Add unlimited custom skill sources
- ✅ **Team-friendly** - Export/import configs for collaboration
- ✅ **Zero dependencies** - Lightweight, fast, secure
- ✅ **Open & extensible** - Use any GitHub repo as skill source

## 📊 Supported Platforms

| Platform | Status | Skills Directory |
|----------|--------|------------------|
| Claude Code | ✅ Supported | `~/.claude/skills/` |
| Antigravity IDE | ✅ Supported | `~/.gemini/antigravity/skills/` |
| Cursor | ✅ Supported | `~/.cursor/skills/` |
| Windsurf | ✅ Supported | `~/.windsurf/skills/` |
| Codex CLI | ✅ Supported | `~/.codex/skills/` |

## 📄 License

MIT © [Dong Tran](https://github.com/dongitran)

## 🔗 Links

- **NPM**: https://www.npmjs.com/package/ai-agent-config
- **GitHub**: https://github.com/dongitran/ai-agent-config
- **Issues**: https://github.com/dongitran/ai-agent-config/issues
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

**Keywords**: AI coding assistant, Claude Code, Antigravity, Cursor, Windsurf, AI skills, code automation, developer tools, coding standards, best practices, AI agent config, skill management, team collaboration, custom skills, GitHub integration
