# Bitwarden MCP Server

> Access your Bitwarden vault directly from AI agents

## Overview

This MCP server allows AI agents (like Antigravity) to access your Bitwarden vault to retrieve secrets, passwords, and other sensitive information securely.

## Installation

## Enabled by Default

The Bitwarden MCP server is **enabled by default** starting from v2.5.7. It serves a different purpose than the `ai-agent secrets sync` command:

### Two Different Use Cases:

1. **`ai-agent secrets sync`** (Implemented) 
   - Scans MCP configs for `${ENV_VAR}` 
   - Fetches secrets from Bitwarden CLI
   - Writes to `~/.zshrc` for persistent environment variables
   - Run once when setting up or rotating secrets

2. **Bitwarden MCP Server** (Optional for discussion, but enabled for convenience)
   - AI agent can query vault directly during conversations
   - Ask questions like "What's my GitHub token?"
   - Create/update vault items via AI
   - Real-time vault access (no pre-sync needed)

## Setup

### Prerequisites

Same as `ai-agent secrets sync`:
- Bitwarden CLI installed: `npm install -g @bitwarden/cli`
- API credentials & Session in shell profile:
  ```bash
  # Personal Vault Access (required for MCP server to start)
  export BW_SESSION="your-session-key"
  
  # Organization API Access (optional)
  export BW_CLIENT_ID="your-client-id"
  export BW_CLIENT_SECRET="your-client-secret"
  ```

> [!NOTE]
> To get a `BW_SESSION` key, run `bw login` followed by `bw unlock`. Use the outputted key.

### Verification

1. **Install to Antigravity**:
   ```bash
   ai-agent install
   ```

2. **Verify** in Antigravity:
   - Open Antigravity
   - Go to "Manage MCP Servers"
   - Should see "bitwarden" server listed and ✅ enabled

## Usage Examples

Once enabled, you can ask the AI:

```
"What's my GitHub personal access token?"
"Show me my AWS credentials"
"Add a new API key to my vault: SERVICE_API_KEY = xyz123"
```

The AI will use the Bitwarden MCP server to fetch/store this information securely.

## Security Notes

- API credentials (`BW_CLIENT_ID`, `BW_CLIENT_SECRET`) are read from environment variables
- `BW_SESSION` is required for vault operations and must be refreshed if the vault locks
- Master password still required for vault access (MCP server handles this via session)
- No secrets stored in MCP config file

## Why Enable by Default?

1. **Seamless Integration**: AI agents can immediately help manage secrets
2. **Simplified Setup**: No manual editing of config files required
3. **Power User Ready**: Provides full vault access for autonomous agents

If you wish to disable it, you can do so in the Antigravity UI or by adding `"disabled": true` to the bitwarden server config in `~/.gemini/antigravity/mcp_config.json`.

## Documentation

- [Bitwarden MCP Server](https://github.com/bitwarden/mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
