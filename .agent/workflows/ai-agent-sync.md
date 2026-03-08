---
description: Sync and install the latest AI agent skills from the central repository
---

# Update Skills Workflow

Sync and install the latest skills from the ai-agent-config repository.

## Steps

1. Pull latest skills from GitHub:
```bash
ai-agent pull
```

2. Update skills from all sources and install:
```bash
ai-agent update
```

## Notes

- Requires `ai-agent-config` npm package to be installed globally
- If not installed, run: `npm install -g ai-agent-config`
- Skills source: https://github.com/dongitran/ai-agent-config
