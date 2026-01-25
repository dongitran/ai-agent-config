# AI Agent Config

> Universal Global Skills & Workflows for AI Coding Assistants

[![npm version](https://badge.fury.io/js/@dongitran%2Fai-agent-config.svg)](https://www.npmjs.com/package/@dongitran/ai-agent-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Install a curated collection of AI agent skills from [github.com/dongitran/ai-agent-config](https://github.com/dongitran/ai-agent-config) to your global configuration.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Repository                                              │
│  github.com/dongitran/ai-agent-config                           │
│  └── .agent/                                                    │
│      ├── skills/         ◄── Skills are defined here            │
│      │   ├── code-review/                                       │
│      │   └── git-commit/                                        │
│      └── workflows/                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ai-agent sync
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Local Cache                                                    │
│  ~/.ai-agent-config-cache/                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ai-agent install
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Platform Global Directories                                    │
│  ├── ~/.claude/skills/           (Claude Code)                  │
│  ├── ~/.gemini/antigravity/skills/ (Antigravity IDE)            │
│  ├── ~/.cursor/skills/           (Cursor)                       │
│  └── ~/.windsurf/skills/         (Windsurf)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Install the CLI globally
npm install -g @dongitran/ai-agent-config

# Sync skills from repository
ai-agent sync

# Install to your platforms
ai-agent install
```

## CLI Usage

```bash
ai-agent help          # Show all commands
ai-agent sync          # Sync from GitHub repository
ai-agent install       # Install to all detected platforms
ai-agent list          # List available skills
ai-agent platforms     # Show detected platforms
ai-agent uninstall     # Remove installed skills
```

### Options

```bash
ai-agent install --platform claude   # Install to specific platform
ai-agent install --skill code-review # Install specific skill
ai-agent install --force             # Overwrite existing files
```

## Supported Platforms

| Platform | Global Skills Path |
|----------|-------------------|
| Claude Code | `~/.claude/skills/` |
| Antigravity IDE | `~/.gemini/antigravity/skills/` |
| Cursor | `~/.cursor/skills/` |
| Windsurf | `~/.windsurf/skills/` |
| Codex CLI | `~/.codex/skills/` |

## Available Skills

Skills are defined in the repository's `.agent/skills/` directory:

- **code-review** - Thorough code review with security, performance checks
- **git-commit** - Conventional commit message formatting
- *More coming soon...*

## Configuration

Optional config at `~/.ai-agent-config.json`:

```json
{
  "platforms": ["claude", "antigravity"],
  "skills": {
    "include": ["*"],
    "exclude": []
  }
}
```

## Contributing

Add your skills to the repository:

1. Fork [github.com/dongitran/ai-agent-config](https://github.com/dongitran/ai-agent-config)
2. Create skill in `.agent/skills/your-skill/SKILL.md`
3. Submit a pull request

## License

MIT
