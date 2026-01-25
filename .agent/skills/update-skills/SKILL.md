---
name: update-skills
description: Sync and install the latest AI agent skills from the central repository
allowed-tools: [Bash]
---

# Update Skills

When invoked, this skill syncs and installs the latest skills from the ai-agent-config repository.

## Usage

Run this skill when you want to update all AI agent skills to the latest version.

## Steps

1. Sync from GitHub repository:
```bash
ai-agent sync
```

2. Install/update all skills with force flag:
```bash
ai-agent install --force
```

## One-liner

You can also run both commands together:
```bash
ai-agent sync && ai-agent install --force
```

## Notes

- This requires `ai-agent-config` npm package to be installed globally
- If not installed, run: `npm install -g ai-agent-config`
- Skills are sourced from: https://github.com/dongitran/ai-agent-config
