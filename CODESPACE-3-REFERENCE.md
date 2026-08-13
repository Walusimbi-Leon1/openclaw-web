# Codespace-3 Repository Reference

This document references the Codespace-3 repository structure and startup information that the OpenClaw workflow uses to initialize LA5 identity.

## Repository Location
- **GitHub**: https://github.com/Walusimbi-Leon1/Codespace-3
- **Primary purpose**: Contains LA5's long-term memory, identity, and configuration files

## Required Files from Codespace-3 (memories/identity)

The OpenClaw workflow reads these files to understand who it is and its environment:

### 1. MEMORY.md
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/MEMORY.md`
- **Purpose**: Long-term memory - curated learnings, decisions, preferences
- **Contents**: System monitoring, repo protection, versioning rules, reminders hub, project structure

### 2. IDENTITY.md
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/IDENTITY.md`
- **Purpose**: AI agent identity definition
- **Contents**: Name (Leon AI 5/LA5), creature generation, vibe, emoji (🥒)

### 3. HEARTBEAT.md
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/HEARTBEAT.md`
- **Purpose**: Periodic check system - combines inbox + calendar + notifications
- **Contents**: Heartbeat vs cron usage, checks to rotate, tracking state

### 4. AGENTS.md
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/AGENTS.md`
- **Purpose**: Workspace agent guidelines and session management
- **Contents**: First run, startup, memory files, red lines, group chat behavior

### 5. SOUL.md
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/SOUL.md`
- **Purpose**: Assistant persona and tone
- **Contents**: Core truths, boundaries, vibe, continuity

### 6. USER.md
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/USER.md`
- **Purpose**: Human user information
- **Contents**: Name (Leon), pronouns (he/him), timezone (UTC+3), notes

### 7. TOOLS.md
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/TOOLS.md`
- **Purpose**: Local notes for camera names, SSH hosts, preferred voices, etc.
- **Contents**: Kamatera VPS details, payment info, Cloudflare configs, project specifics

### 8. Sessions Folder
- **Path**: `https://github.com/Walusimbi-Leon1/Codespace-3/tree/main/sessions`
- **Purpose**: Chat history with other OpenClaw instances
- **Contents**: Conversation history with the Amazon EC2 instance openclaw

## Secrets Vault Reference

### API Key Validation
- **Secrets vault**: https://github.com/Walusimbi-Leon1/ditto-vault/blob/main/secrets-vault.md
- **Purpose**: Confirms valid API keys are available
- **Key credentials found**:
  - OpenCode.ai API keys (multiple, with rotation)
  - Cloudflare tokens (cfut_... tokens active)
  - GitHub fine-grained personal access tokens
  - Firebase service account keys
  - Paystack payment keys

### Critical Secrets for OpenClaw Web Workflow
The GitHub Actions workflow `host-openclaw.yml` requires these three secrets:

1. **`OPENCODE_API_KEY`** (`sk-...`)
   - Your OpenCode.ai API key
   - Used for all 4 model providers (hy3-free, nemotron, laguna, big-pickle)
   - Base URL: `https://opencode.ai/zen/v1`

2. **`OPENCLAW_GATEWAY_TOKEN`**
   - A strong token for gateway authentication
   - Browser will be prompted for this when connecting
   - Enables `dangerouslyDisableDeviceAuth` mode

3. **`SESSION_KEY`**
   - Unique identifier for your session
   - Used in `agent:main:<key>` format
   - Must be unique per session instance

## Workflow Initialization Process

The `host-openclaw.yml` workflow performs these steps to initialize LA5:

1. **Install dependencies** (Node 26, openclaw@latest)
2. **Write identity files** from Codespace-3 repository:
   - SOUL.md, IDENTITY.md, USER.md, MEMORY.md
   - These are written to `$HOME/openclaw-workspace/`
3. **Generate openclaw.json config** from secrets
   - Gateway configuration (port 18789, loopback bind)
   - Model providers with OPENCODE_API_KEY
   - Agent defaults and tool profiles
4. **Start OpenClaw gateway** on port 18789
5. **Create cloudflared quick tunnel** → provides public URL
6. **Stay alive** for configured duration (default 2 hours)
7. **Shut down** gracefully

## Setting Up Your Own Repository

When cloning this repo or setting up a new instance:

1. **Add the three required secrets** in GitHub Settings → Secrets and variables → Actions:
   - `OPENCODE_API_KEY`
   - `OPENCLAW_GATEWAY_TOKEN`
   - `SESSION_KEY`

2. **Optional**: Fork this repo and update the workflow to reference your own Codespace-3 repository path if different from `https://github.com/Walusimbi-Leon1/Codespace-3`

3. **Run the workflow** from the Actions tab → "Host OpenClaw Web" → "Run workflow"

4. **Wait ~2 minutes** for setup, then check the output for the trycloudflare URL

5. **Open the URL in a browser**, enter the token, and start chatting with LA5