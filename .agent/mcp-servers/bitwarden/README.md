# Bitwarden MCP Server

> Access your Bitwarden vault directly from AI agents

## Overview

This MCP server allows AI agents (like Antigravity) to access your Bitwarden vault to retrieve secrets, passwords, and other sensitive information securely.

## Installation

The Bitwarden MCP server is **disabled by default**. It serves a different purpose than the `ai-agent secrets sync` command:

### Two Different Use Cases:

1. **`ai-agent secrets sync`** (Implemented) 
   - Scans MCP configs for `${ENV_VAR}` 
   - Fetches secrets from Bitwarden CLI
   - Writes to `~/.zshrc` for persistent environment variables
   - Run once when setting up or rotating secrets

2. **Bitwarden MCP Server** (Optional)
   - AI agent can query vault directly during conversations
   - Ask questions like "What's my GitHub token?"
   - Create/update vault items via AI
   - Real-time vault access (no pre-sync needed)

## Setup

### Prerequisites

Same as `ai-agent secrets sync`:
- Bitwarden CLI installed: `npm install -g @bitwarden/cli`
- API credentials in shell profile:
  ```bash
  export BW_CLIENTID="user.xxx"
  export BW_CLIENTSECRET="yyy"
  ```

### Enable the MCP Server

1. **Edit config** to enable:
   ```bash
   # Edit this file
   nano /Users/dongtran/Code/Working/ai-agent-config/.agent/mcp-servers/bitwarden/config.json
   
   # Change "enabled": false to "enabled": true
   ```

2. **Install to Antigravity** (after implementing Plan 01 MCP sync):
   ```bash
   ai-agent install
   ```

3. **Verify** in Antigravity:
   - Open Antigravity
   - Go to "Manage MCP Servers"
   - Should see "bitwarden" server listed

## Usage Examples

Once enabled, you can ask the AI:

```
"What's my GitHub personal access token?"
"Show me my AWS credentials"
"Add a new API key to my vault: SERVICE_API_KEY = xyz123"
```

The AI will use the Bitwarden MCP server to fetch/store this information securely.

## Security Notes

- API credentials (`BW_CLIENTID`, `BW_CLIENTSECRET`) are read from environment variables
- Master password still required for vault access (MCP server handles this)
- Session management handled by Bitwarden MCP server
- No secrets stored in MCP config file

## Disabled by Default

This MCP server is **disabled by default** (`"enabled": false`) because:
1. Not everyone needs AI agent vault access
2. Most users only need `ai-agent secrets sync` for MCP environment variables
3. Reduces attack surface if not needed

Enable only if you want AI agents to have direct vault query capabilities.

## Documentation

- [Bitwarden MCP Server](https://github.com/bitwarden/mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)
