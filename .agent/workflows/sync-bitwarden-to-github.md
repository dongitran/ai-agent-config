---
description: Sync secrets from Bitwarden vault to GitHub repository secrets/variables based on .agent/config/secret.yml
---

# Sync Bitwarden Secrets to GitHub Workflow

// turbo-all

Read `.agent/config/secret.yml`, fetch values from Bitwarden, and sync to GitHub repo secrets/variables.

## Secret Config Format

```yaml
repo: owner/repo-name
environment: null          # GitHub environment name (null = repo-level)
type: secret               # "secret" or "variable"

secrets:
  - name: SECRET_NAME      # GitHub secret/variable name
    bitwarden: BW_ITEM     # Bitwarden item name (Notes type)
```

## Steps

### 1. Read and parse config

Read `.agent/config/secret.yml` and extract:
- `repo` - target GitHub repository
- `environment` - GitHub environment (null = repo-level)
- `type` - "secret" or "variable"
- `secrets[].bitwarden` - all Bitwarden item names to fetch

### 2. Ensure Bitwarden is ready

```bash
bw status
```

If locked, unlock and export session:

```bash
export BW_SESSION=$(bw unlock --raw)
```

If not logged in, login first:

```bash
bw login --apikey
export BW_SESSION=$(bw unlock --raw)
```

Sync vault to get latest data:

```bash
bw sync --session $BW_SESSION
```

### 3. Fetch all secrets from Bitwarden

For each `bitwarden` item in config, fetch the Notes value:

```bash
bw get notes "BITWARDEN_ITEM_NAME" --session $BW_SESSION
```

All items are stored as **SecureNote** or have their value in the **Notes** field.

### 4. Set GitHub secrets/variables

Verify gh CLI is authenticated:

```bash
gh auth status
```

For `type: secret` - set GitHub secrets:

```bash
gh secret set SECRET_NAME --repo owner/repo --body "VALUE"
```

For `type: variable` - set GitHub variables:

```bash
gh variable set VAR_NAME --repo owner/repo --body "VALUE"
```

If `environment` is specified, add `--env ENV_NAME`:

```bash
gh secret set SECRET_NAME --repo owner/repo --env ENV_NAME --body "VALUE"
gh variable set VAR_NAME --repo owner/repo --env ENV_NAME --body "VALUE"
```

### 5. Lock Bitwarden vault

```bash
bw lock
```

## Notes

- All Bitwarden items use **Notes** field for the secret value
- Use `--env` flag only when `environment` is not null
- Secrets are set one by one - if one fails, continue with remaining and report errors at the end
- Never log or display secret values in output
- If a Bitwarden item is not found, warn and skip (do not abort entire sync)
