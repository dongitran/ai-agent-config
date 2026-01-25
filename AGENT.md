# AI Agent Config

> Universal Global Skills & Workflows for AI Coding Assistants

**Repository:** https://github.com/dongitran/ai-agent-config

## Purpose

This repository provides a **global collection** of skills and workflows that are installed to user's home directory, making them available across **all projects** on the machine.

### Global Installation Paths

| Platform | Global Skills Path |
|----------|-------------------|
| **Claude Code** | `~/.claude/skills/` |
| **Antigravity IDE** | `~/.gemini/antigravity/skills/` |
| **Cursor** | `~/.cursor/skills/` |
| **Windsurf** | `~/.windsurf/skills/` |
| **Codex CLI** | `~/.codex/skills/` |

## Problem Statement

AI coding assistants support **global skills** - user-wide capabilities available across all projects. However:

1. **Manual setup**: Need to manually copy skills to each platform's directory
2. **No sync mechanism**: Difficult to update when skills are improved
3. **Platform fragmentation**: Each tool uses different paths
4. **No versioning**: Hard to track which version is installed

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

## Solution: Global NPM Package

### Installation

```bash
# Install globally
npm install -g @anthropic/ai-agent-config

# This automatically installs skills to all detected platforms
```

### How it works

1. **Detects installed platforms** (Claude Code, Antigravity, Cursor, etc.)
2. **Copies skills** to each platform's global directory
3. **Creates symlinks** for easy updates
4. **Provides CLI** for manual sync and management

### CLI Commands

```bash
ai-agent install           # Install to all detected platforms
ai-agent install --claude  # Install to Claude Code only
ai-agent sync              # Update from latest release
ai-agent list              # Show installed skills
ai-agent platforms         # Show detected platforms
ai-agent uninstall         # Remove all installed skills
```

## Package Structure

```
package/
├── package.json
├── bin/
│   └── cli.js              # CLI entry point
├── scripts/
│   ├── installer.js        # Main installation logic
│   ├── platforms.js        # Platform detection
│   └── postinstall.js      # Auto-run after npm install
├── skills/                 # Universal skills
│   ├── code-review/
│   │   └── SKILL.md
│   ├── testing/
│   │   └── SKILL.md
│   └── documentation/
│       └── SKILL.md
└── workflows/              # Shared workflows
    ├── create-pr.md
    └── deploy.md
```

## Platform Detection

The installer detects platforms by checking:

```javascript
const PLATFORMS = [
  {
    name: 'claude',
    detect: () => fs.existsSync(path.join(HOME, '.claude')),
    skillsPath: path.join(HOME, '.claude', 'skills'),
  },
  {
    name: 'antigravity',
    detect: () => fs.existsSync(path.join(HOME, '.gemini', 'antigravity')),
    skillsPath: path.join(HOME, '.gemini', 'antigravity', 'skills'),
  },
  {
    name: 'cursor',
    detect: () => fs.existsSync(path.join(HOME, '.cursor')),
    skillsPath: path.join(HOME, '.cursor', 'skills'),
  },
];
```

## Configuration

Optional config file at `~/.ai-agent-config.json`:

```json
{
  "platforms": ["claude", "antigravity"],
  "skills": {
    "include": ["*"],
    "exclude": ["deprecated-*"]
  },
  "sync": {
    "auto": true,
    "checkInterval": "weekly"
  }
}
```

## References

- [Claude Code Global Skills](https://code.claude.com/docs/en/skills) - `~/.claude/skills/`
- [Antigravity Global Skills](https://medium.com/google-cloud/tutorial-getting-started-with-antigravity-skills-864041811e0d) - `~/.gemini/antigravity/skills/`
- [Agent Skills Open Standard](https://github.com/anthropics/skills)
- [OpenPackage](https://github.com/enulus/OpenPackage) - Cross-platform installer reference

## Roadmap

- [x] Define package structure
- [x] Create CLI with basic commands
- [ ] Implement platform detection
- [ ] Create installation scripts
- [ ] Add sample skills
- [ ] Publish to npm
- [ ] Add auto-update mechanism

---

*Created: 2025-01-25*
