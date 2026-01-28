# AI Agent Config

> Minimal Skill Manager for AI Coding Assistants - User-configurable skill sources

**Website:** https://dongitran.github.io/ai-agent-config
**Repository:** https://github.com/dongitran/ai-agent-config
**NPM:** https://www.npmjs.com/package/ai-agent-config

## Purpose

This package provides a **minimal skill management system** for AI coding assistants. It bundles only 2 essential skills for managing the system itself, and allows users to add unlimited custom skill sources from GitHub repositories.

### Architecture Philosophy (v2.2)

- **Minimal Core**: Only 2 bundled skills (config-manager, skill-updater)
- **Zero Defaults**: No external sources by default - full user control
- **User-Configurable**: Add any GitHub repository as skill source
- **Team-Friendly**: Export/import configs for collaboration
- **Cross-Platform**: Works with Claude Code, Antigravity, Cursor, Windsurf, Codex CLI

### Global Installation Paths

| Platform | Global Skills Path |
|----------|-------------------|
| **Claude Code** | `~/.claude/skills/` |
| **Antigravity IDE** | `~/.gemini/antigravity/skills/` |
| **Cursor** | `~/.cursor/skills/` |
| **Windsurf** | `~/.windsurf/skills/` |
| **Codex CLI** | `~/.codex/skills/` |
| **GitHub Copilot** | `~/.github/copilot-instructions.md` |

## Problem Statement

AI coding assistants support **global skills** - user-wide capabilities available across all projects. However, existing solutions have issues:

**Old Problems (v2.1 and earlier):**
1. **Bloated packages**: Bundling 15+ skills users may not need
2. **No customization**: Users can't choose which skills to install
3. **Security concerns**: External sources included by default
4. **Manual setup**: Need to manually copy skills to each platform
5. **No sync mechanism**: Difficult to update when skills improve
6. **Platform fragmentation**: Each tool uses different paths

**v2.2 Solution:**
- Only 2 core skills bundled (config-manager, skill-updater)
- Users explicitly add sources they trust
- One command manages skills across all platforms
- Easy config sharing for teams

## What are Agent Skills?

Agent Skills are folders containing a `SKILL.md` file that the AI loads automatically when relevant:

```yaml
---
name: code-review
description: Perform thorough code review with best practices
---
# Code Review Skill

When reviewing code, follow these steps:
1. Check for security vulnerabilities
2. Verify error handling
3. Review code style and naming
...
```

**Key features:**
- **Progressive disclosure**: Skills are loaded only when needed
- **Auto-discovery**: AI finds skills in global directory automatically
- **Cross-platform**: Same skill format works across tools

## Quick Start

```bash
# Install globally
npm install -g ai-agent-config

# Initialize config
ai-agent init

# Install 2 bundled skills
ai-agent install

# (Optional) Add custom skill sources
ai-agent source add https://github.com/vercel-labs/agent-skills.git \
  --name vercel-labs \
  --path skills

# Update and install custom skills
ai-agent update
ai-agent install
```

## Bundled Skills (2)

The package includes only 2 core skills:

1. **config-manager** - Manage configuration and custom sources
2. **skill-updater** - Update skills from GitHub repositories

These skills are bundled in the NPM package at `package/.agent/skills/` and are installed to:
- Global NPM location: `$(npm root -g)/ai-agent-config/.agent/skills/`
- Platform directories: `~/.claude/skills/`, etc.

## Custom Skill Sources

Users can add unlimited custom sources from GitHub:

### Add Sources

```bash
# Add Vercel Labs skills
ai-agent source add https://github.com/vercel-labs/agent-skills.git \
  --name vercel-labs \
  --path skills

# Add Everything Claude Code
ai-agent source add https://github.com/affaan-m/everything-claude-code.git \
  --name everything-claude-code \
  --path skills

# Add your company's private repo
ai-agent source add https://github.com/acme-corp/coding-standards \
  --name acme-standards
```

### Manage Sources

```bash
ai-agent source list                    # List all sources
ai-agent source info <name>             # View source details
ai-agent source enable <name>           # Enable source
ai-agent source disable <name>          # Disable source
ai-agent source remove <name>           # Remove source
```

## CLI Commands

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

## Package Structure

```
package/
├── package.json                # NPM package config
├── bin/
│   └── cli.js                  # CLI entry point
├── scripts/
│   ├── installer.js            # Installation logic
│   ├── platforms.js            # Platform detection
│   ├── postinstall.js          # Post-install guidance
│   ├── config-manager.js       # Config management
│   └── source-manager.js       # Source management
├── config/
│   └── official-sources.json   # Default sources (empty in v2.2)
└── .agent/                     # Bundled content
    └── skills/                 # 2 bundled skills
        ├── config-manager/
        │   └── SKILL.md
        └── skill-updater/
            └── SKILL.md

User config:
~/.ai-agent/
├── config.json                 # User configuration
└── .ai-agent-external-cache/   # Downloaded skill repositories
```

## How Installation Works

### 1. Bundled Skills Installation

When `ai-agent install` runs:
1. Checks for bundled skills in NPM package at `$(npm root -g)/ai-agent-config/.agent/skills/`
2. Copies config-manager and skill-updater to platform directories
3. These 2 skills are available immediately after `npm install -g`

### 2. Custom Skills Installation

When user adds sources and runs `ai-agent update && ai-agent install`:
1. Clones GitHub repos to `~/.ai-agent/.ai-agent-external-cache/`
2. Copies skills from configured path to platform directories
3. Workflows are installed to appropriate locations per platform

### 3. Skill Priority

The installer prioritizes skills in this order:
1. **Bundled skills** from NPM package (config-manager, skill-updater)
2. **External skills** from user-configured sources (only if bundled not found)

This ensures the 2 core skills always work, even without external sources.

## Platform Detection

The installer detects platforms by checking:

```javascript
const PLATFORMS = [
  {
    name: 'claude',
    displayName: 'Claude Code',
    detect: () => fs.existsSync(path.join(HOME, '.claude')),
    skillsPath: path.join(HOME, '.claude', 'skills'),
  },
  {
    name: 'antigravity',
    displayName: 'Antigravity IDE',
    detect: () => fs.existsSync(path.join(HOME, '.gemini', 'antigravity')),
    skillsPath: path.join(HOME, '.gemini', 'antigravity', 'skills'),
    workflowsPath: path.join(HOME, '.gemini', 'antigravity', 'workflows'),
  },
  {
    name: 'cursor',
    displayName: 'Cursor',
    detect: () => fs.existsSync(path.join(HOME, '.cursor')),
    skillsPath: path.join(HOME, '.cursor', 'skills'),
  },
  {
    name: 'windsurf',
    displayName: 'Windsurf',
    detect: () => fs.existsSync(path.join(HOME, '.windsurf')),
    skillsPath: path.join(HOME, '.windsurf', 'skills'),
  },
  {
    name: 'codex',
    displayName: 'Codex CLI',
    detect: () => fs.existsSync(path.join(HOME, '.codex')),
    skillsPath: path.join(HOME, '.codex', 'skills'),
  },
];
```

## Configuration

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

### Official Sources (v2.2)

The `config/official-sources.json` file is intentionally empty:

```json
{
  "$schema": "https://ai-agent-config.dev/schema/v2.json",
  "version": "2.0",
  "sources": []
}
```

**Why empty?** Zero defaults philosophy - users must explicitly add sources they trust.

## Use Cases

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

## Version History

### v2.2.2 (2026-01-28)
- Fixed: Bundled skills installation prioritization
- Fixed: Prevented auto-syncing repo when bundled skills exist
- Verified: Clean environment testing passes

### v2.2.0 (2026-01-28)
- **BREAKING**: Removed all default external sources
- **BREAKING**: Only 2 bundled skills (config-manager, skill-updater)
- Added: User-configurable source management
- Added: Config export/import for team sharing
- Added: Zero defaults philosophy

### v2.1.1 (2026-01-25)
- Initial public release
- 4 official sources with 15+ skills bundled
- Auto-sync from GitHub repository

## Architecture Evolution

| Version | Bundled Skills | Default Sources | User Control |
|---------|---------------|-----------------|--------------|
| v2.1.1 | 15+ skills | 4 official sources | Limited |
| v2.2.0 | 2 skills | 0 sources | Full |
| v2.2.2 | 2 skills | 0 sources | Full (fixed bugs) |

## Development

### Publishing Workflow

```bash
# Update version
cd package
npm version patch  # or minor, major

# Test locally
npm install -g .

# Publish to npm
npm publish

# Test published version
npm uninstall -g ai-agent-config
npm install -g ai-agent-config

# Verify
ai-agent list
```

### Testing

```bash
# Clean environment test
rm -rf ~/.claude/skills/*
rm -rf ~/.ai-agent-config-cache
rm -rf ~/.ai-agent

# Install and verify
npm install -g ai-agent-config
ai-agent init
ai-agent install

# Should show 2 skills installed
ai-agent list
```

## References

- [Claude Code Global Skills](https://code.claude.com/docs/en/skills) - `~/.claude/skills/`
- [Antigravity Global Skills](https://medium.com/google-cloud/tutorial-getting-started-with-antigravity-skills-864041811e0d) - `~/.gemini/antigravity/skills/`
- [Agent Skills Open Standard](https://github.com/anthropics/skills)
- [Vercel Labs Agent Skills](https://github.com/vercel-labs/agent-skills)
- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)

## Roadmap

**Completed (v2.2):**
- [x] Minimal core architecture (2 bundled skills)
- [x] User-configurable source management
- [x] Config export/import
- [x] Zero defaults implementation
- [x] Cross-platform support (6 platforms)
- [x] Professional landing page

**Future (v2.3+):**
- [ ] Auto-update mechanism for sources
- [ ] Skill dependency management
- [ ] Skill marketplace/discovery
- [ ] Team workspace support
- [ ] CI/CD integration
- [ ] VS Code extension for GUI management

---

*Created: 2025-01-25*
*Updated: 2026-01-28 (v2.2.2)*
