# Config Manager Skill

Manage ai-agent-config user configuration interactively.

## When to Use This Skill

Use this skill when the user needs to:
- Add a new custom skill source from GitHub
- Configure sync settings
- Manage their skill sources (enable/disable/remove)
- Export or import config files
- Share config with team members
- Understand how to configure ai-agent-config

## Capabilities

- **Source Management**: Add, remove, enable, disable custom skill sources
- **Config Operations**: Get, set, validate, export, import config values
- **Migration Support**: Help users migrate from v1 to v2
- **Team Sharing**: Export configs for team collaboration

## Command Reference

### Source Management
```bash
# Add a custom source
ai-agent source add <repo-url> --name <name> --branch <branch>

# List all sources
ai-agent source list

# Enable/disable a source
ai-agent source enable <name>
ai-agent source disable <name>

# Remove a custom source
ai-agent source remove <name>

# Get source info
ai-agent source info <name>
```

### Config Management
```bash
# Get config value
ai-agent config get <key>

# Set config value
ai-agent config set <key> <value>

# Edit config in editor
ai-agent config edit

# Validate config
ai-agent config validate

# Export config
ai-agent config export [output-file]

# Import config
ai-agent config import <file> [--merge]

# Reset to defaults
ai-agent config reset --yes
```

## Examples

### Adding Company Skills

**User**: "Add skills from my company's GitHub repo"

**Assistant**: I'll help you add your company's skills repository. Use this command:

```bash
ai-agent source add https://github.com/yourcompany/ai-skills \
  --name company-skills \
  --branch main
```

After adding the source, you'll need to:
1. Update skills: `ai-agent update --source company-skills`
2. Edit config to specify which skills to use: `ai-agent config edit`
3. Install to platforms: `ai-agent install`

### Sharing Config with Team

**User**: "How do I share my skill configuration with my team?"

**Assistant**: You can export your config and share it with your team:

```bash
# Export your config
ai-agent config export team-config.json

# Team members can import it
ai-agent config import team-config.json --merge
```

The `--merge` flag will combine your existing config with the imported one, keeping both official and custom sources.

### Checking Current Config

**User**: "What sources do I have configured?"

**Assistant**: Run this command to see all your sources:

```bash
ai-agent source list
```

This will show both official sources (from the package) and your custom sources.

## Config File Location

- **User config**: `~/.ai-agent/config.json`
- **Cache**: `~/.ai-agent-external-cache/`

## Config Structure

The v2.0 config file has this structure:

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
        "enabled": true,
        "skills": [...]
      }
    ]
  },
  "sync": {
    "enabled": false,
    "provider": null,
    "config": {}
  },
  "preferences": {
    "autoUpdate": true,
    "updateInterval": "weekly"
  }
}
```

## Migration from v1.x

If the user is on v1.x, help them migrate:

```bash
ai-agent init
```

This will automatically create the v2.0 config file with all official sources enabled.

## Tips

1. **Test before sharing**: Always validate your config before sharing: `ai-agent config validate`
2. **Backup**: The config manager automatically creates backups when modifying config
3. **Edit safely**: Use `ai-agent config edit` to open in your editor with syntax checking
4. **Source names**: Use descriptive names for custom sources (e.g., "company-standards", "team-utils")

## Troubleshooting

**Problem**: "Source already exists" error
**Solution**: Remove the old source first or use a different name

**Problem**: Config validation errors
**Solution**: Run `ai-agent config validate` to see specific errors, then fix manually or reset

**Problem**: Can't find custom source
**Solution**: Check the source is enabled: `ai-agent source info <name>`
