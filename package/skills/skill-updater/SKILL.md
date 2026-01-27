# Skill Updater

Automatically update skills from all configured sources (official and custom).

## When to Use This Skill

Use this skill when the user wants to:
- Update all skills from configured sources
- Update a specific source
- Update a specific skill
- Sync latest changes from external repositories
- Keep skills up to date with latest best practices

## Capabilities

- **Multi-Source Updates**: Updates from both official and custom sources
- **Selective Updates**: Update specific source or skill
- **Force Updates**: Overwrite local changes
- **Progress Reporting**: Shows what was updated, copied, or skipped

## Command Reference

```bash
# Update all skills from all sources
ai-agent update

# Update from specific source
ai-agent update --source vercel-labs

# Update specific skill
ai-agent update --skill react-best-practices

# Force overwrite existing skills
ai-agent update --force

# Combine options
ai-agent update --source company-skills --force
```

## How It Works (v2.0)

1. **Reads User Config**: Loads `~/.ai-agent/config.json`
2. **Gets Enabled Sources**: Filters for enabled sources (official + custom)
3. **Clones/Updates Repos**: For each source, clones to `~/.ai-agent-external-cache/`
4. **Copies Skills**: Copies skills to `.agent/skills/` in the package directory
5. **Reports Results**: Shows what was updated

## Examples

### Regular Update

**User**: "Update my skills"

**Assistant**: I'll update all your skills from configured sources:

```bash
ai-agent update
```

This will:
- Pull latest from Vercel Labs, Everything Claude Code, etc.
- Update your custom sources too
- Copy new/updated skills to your system
- Show what changed

### Update After Adding Custom Source

**User**: "I just added a custom source, how do I get the skills?"

**Assistant**: After adding a source, update it:

```bash
# Update just your new source
ai-agent update --source your-source-name

# Then install to platforms
ai-agent install
```

### Force Update

**User**: "Some skills aren't updating"

**Assistant**: Use `--force` to overwrite existing skills:

```bash
ai-agent update --force
```

⚠️ Warning: This will overwrite any local modifications you made to skills.

## What's New in v2.0

- ✅ **Custom Sources**: Updates from your custom sources, not just official ones
- ✅ **User Config**: Reads from `~/.ai-agent/config.json` instead of hard-coded list
- ✅ **Selective Sync**: Update specific sources or skills
- ✅ **Better Reporting**: Shows which sources succeeded/failed

## Update vs Install

- **`ai-agent update`**: Downloads latest skills from sources to cache
- **`ai-agent install`**: Installs cached skills to AI platforms (Claude, Antigravity, etc.)

Typical workflow:
```bash
ai-agent update    # Get latest skills
ai-agent install   # Install to platforms
```

## Configuration

Skills are defined in your config file:

```json
{
  "sources": {
    "official": [
      {
        "name": "vercel-labs",
        "enabled": true,
        "skills": [
          { "path": "skills/react-best-practices", "name": "react-best-practices" }
        ]
      }
    ],
    "custom": [
      {
        "name": "my-skills",
        "enabled": true,
        "skills": [
          { "path": "skills/my-skill", "name": "my-skill" }
        ]
      }
    ]
  }
}
```

## Backward Compatibility

The old command still works:
```bash
ai-agent sync-external
```

This is now an alias for `ai-agent update`.

## Tips

1. **Regular Updates**: Run `ai-agent update` weekly to get latest skills
2. **Check Before Install**: After update, review changes before installing
3. **Test Custom Sources**: When adding custom sources, test with `--source` flag first
4. **Use Version Control**: If modifying skills, use git to track changes

## Troubleshooting

**Problem**: "Failed to load user config"
**Solution**: Run `ai-agent init` to create config file

**Problem**: Update fails for a source
**Solution**: Check repo URL is correct: `ai-agent source info <name>`

**Problem**: Skills not appearing
**Solution**: Make sure source is enabled: `ai-agent source list`

**Problem**: Git errors
**Solution**: Check internet connection and git is installed
