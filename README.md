# ai-agent-config

> Universal Global Skills & Workflows for AI Coding Assistants - User-configurable skill sources

[![npm version](https://badge.fury.io/js/ai-agent-config.svg)](https://www.npmjs.com/package/ai-agent-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**One command to manage AI coding skills across Claude Code, Antigravity, Cursor, Windsurf, and more.**

## 🚀 What's New in v2.0

- ✅ **User-configurable sources** - Add custom skill repositories from GitHub
- ✅ **Source management** - Enable, disable, add, remove sources via CLI
- ✅ **Config management** - Export/import configs for team sharing
- ✅ **Auto-migration** - Seamless upgrade from v1.x
- ✅ **Backward compatible** - All v1 commands still work

## 📦 Quick Start

```bash
# Install globally
npm install -g ai-agent-config

# Initialize (creates config at ~/.ai-agent/config.json)
ai-agent init

# Update skills from all sources
ai-agent update

# Install to your AI platforms
ai-agent install
```

## 🎯 Key Features

### Add Custom Skills from Any GitHub Repo

```bash
# Add your company's skills
ai-agent source add https://github.com/mycompany/ai-skills \
  --name company-skills \
  --branch main \
  --path skills \
  --exclude .git,README.md

# Update and install
ai-agent update
ai-agent install
```

### Manage Skill Sources

```bash
# List all sources (official + custom)
ai-agent source list

# Enable/disable sources
ai-agent source disable playwright-skill
ai-agent source enable vercel-labs

# Remove custom source
ai-agent source remove old-source

# View source details
ai-agent source info company-skills
```

### Share Config with Your Team

```bash
# Export your config
ai-agent config export team-config.json

# Team members import
ai-agent config import team-config.json --merge
```

## 📚 Available Skills (Official Sources)

### Frontend Development
- `react-best-practices` - React & Next.js optimization (Vercel Labs)
- `frontend-design` - Production-grade UI components (Vercel Labs)
- `web-design-guidelines` - Web interface best practices (Vercel Labs)
- `frontend-patterns` - Frontend architecture patterns

### Backend & Database
- `backend-patterns` - API design, server-side patterns
- `postgres-patterns` - PostgreSQL optimization (Supabase)
- `nestjs-best-practices` - NestJS architecture & patterns
- `security-review` - Security checklist & patterns

### Testing & Quality
- `tdd-workflow` - Test-driven development workflow
- `playwright` - Browser automation & testing
- `code-review` - Code review best practices
- `eval-harness` - Evaluation framework for AI sessions

### Development Tools
- `coding-standards` - Universal coding standards
- `continuous-learning` - Extract reusable patterns
- `strategic-compact` - Context management

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
# 1. Create private skills repo
# 2. Add to all team members
ai-agent source add https://github.com/acme-corp/coding-standards \
  --name acme-standards

# 3. Share config file
ai-agent config export acme-config.json
# Send to team via Slack/Email

# 4. Team members import
ai-agent config import acme-config.json --merge
```

### For Individual Developers
```bash
# Add skills from multiple sources
ai-agent source add https://github.com/username/my-skills
ai-agent source add https://github.com/another/awesome-skills

# Disable skills you don't use
ai-agent source disable playwright-skill

# Keep only what you need
ai-agent update
```

### For Open Source Projects
```bash
# Create project-specific skills
# Share via GitHub repo
# Contributors use the same standards

ai-agent source add https://github.com/project/ai-skills \
  --name project-standards
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
    "official": [
      {
        "name": "vercel-labs",
        "repo": "https://github.com/vercel-labs/agent-skills.git",
        "branch": "main",
        "enabled": true,
        "skills": [...]
      }
    ],
    "custom": [
      {
        "name": "my-skills",
        "repo": "https://github.com/me/my-skills.git",
        "branch": "main",
        "path": "skills",
        "excludePaths": [".git", "README.md"],
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

1. **Add skills to official sources**: Submit PR to add new curated sources
2. **Report issues**: [GitHub Issues](https://github.com/dongitran/ai-agent-config/issues)
3. **Share your skills**: Create skills repo and share with community

## 📖 Migration from v1.x

v2.0 automatically migrates your setup:

```bash
# Install v2.0
npm install -g ai-agent-config@latest

# Run init (auto-detects v1 and migrates)
ai-agent init

# ✅ Done! All your skills are preserved
```

**No breaking changes** - All v1 commands work in v2.

## 🌟 Why ai-agent-config?

- ✅ **One source of truth** for AI coding skills across all platforms
- ✅ **User-configurable** - Add unlimited custom skill sources
- ✅ **Team-friendly** - Export/import configs for collaboration
- ✅ **Auto-sync** - Weekly updates from official sources
- ✅ **Zero dependencies** - Lightweight, fast, secure
- ✅ **Open & extensible** - Use any GitHub repo as skill source

## 📊 Supported Platforms

| Platform | Status | Skills Directory |
|----------|--------|------------------|
| Claude Code | ✅ Supported | `~/.claude/skills/` |
| Antigravity IDE | ✅ Supported | `~/.gemini/antigravity/skills/` |
| Cursor | ✅ Supported | `~/.cursor/skills/` |
| Windsurf | ✅ Supported | `~/.windsurf/skills/` |
| Copilot (GitHub) | 🔄 Coming soon | - |

## 📄 License

MIT © [Dong Tran](https://github.com/dongitran)

## 🔗 Links

- **NPM**: https://www.npmjs.com/package/ai-agent-config
- **GitHub**: https://github.com/dongitran/ai-agent-config
- **Issues**: https://github.com/dongitran/ai-agent-config/issues
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

---

**Keywords**: AI coding assistant, Claude Code, Antigravity, Cursor, Windsurf, AI skills, code automation, developer tools, coding standards, best practices, AI agent config, skill management, team collaboration, custom skills, GitHub integration
