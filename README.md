# OpenClaw Web

Host **Leon AI 5 (LA5)** — Leon's OpenClaw AI agent — on a GitHub Action behind a Cloudflare trycloudflare tunnel, accessible from any browser in ~2 minutes.

## Overview

This repo provides a GitHub Actions workflow that:
1. **Installs OpenClaw** (Node 26 + openclaw@latest) on an Ubuntu runner
2. **Writes identity files** (SOUL.md, IDENTITY.md, USER.md, MEMORY.md) from the Codespace-3 repository so OpenClaw starts as LA5
3. **Generates config** from GitHub Secrets with your OpenCode.ai API key.ai API key
4. **Starts the OpenClaw gateway** on port 18789
5. **Creates a cloudflared quick tunnel** → prints a `https://<random>.trycloudflare.com` URL
6. **Stays alive for 2 hours** (configurable), then shuts down
7. **Syncs sessions with Firebase Realtime Database** — so your chat history persists across runs!

No device approval needed — the gateway config uses `dangerouslyDisableDeviceAuth` so the browser connects directly with just the token.

## Identity Source: Codespace-3 Repository

The AI gets its identity from the Codespace-3 repository (https://github.com/Walusimbi-Leon1/Codespace-3). The workflow reads these files to initialize LA5:

| File | Path in Codespace-3 | Purpose |
|------|---|---|
| **MEMORY.md** | `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/MEMORY.md` | Long-term memory - curated learnings, decisions, preferences |
| **IDENTITY.md** | `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/IDENTITY.md` | AI agent identity: Name (Leon AI 5/LA5), creature, vibe, emoji (🥒) |
| **HEARTBEAT.md** | `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/HEARTBEAT.md` | Periodic check system - combines inbox + calendar + notifications |
| **AGENTS.md** | `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/AGENTS.md` | Workspace agent guidelines and session management |
| **SOUL.md** | `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/SOUL.md` | Assistant persona and tone, core truths, boundaries |
| **USER.md** | `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/USER.md` | Human user information: Name (Leon), pronouns (he/him), timezone (UTC+3) |
| **TOOLS.md** | `https://github.com/Walusimbi-Leon1/Codespace-3/blob/main/TOOLS.md` | Local notes: camera names, SSH hosts, preferred voices, device nicknames |
| **sessions/** | `https://github.com/Walusimbi-Leon1/Codespace-3/tree/main/sessions` | Chat history with other OpenClaw instances (e.g., Amazon EC2 openclaw) |

## Secrets Required

Set these in **Settings → Secrets and variables → Actions** on this repo:

| Secret | Required | Description |
|---|---|---|
| `OPENCODE_API_KEY` | ✅ | Your OpenCode.ai API key (`sk-...`) — used for the chat models |
| `OPENCLAW_GATEWAY_TOKEN` | ⬜ optional | Token the browser will ask for. If left empty, uses fixed token `la5-colab-8133ea97d77b5c47` for consistency across runs. |
| `GH_PAT_Codespace3` | ✅ | A GitHub PAT (classic or fine-grained) with **read** access to the private `Codespace-3` repo, so the identity files (SOUL/IDENTITY/USER/MEMORY) can be fetched. Without it the agent won't get its LA5 identity. |
| `SESSION_KEY` | ⬜ optional | Identifier used as `agent:main:<SESSION_KEY>`. Defaults to `main` if unset. |
| `FIREBASE_SERVICE_ACCOUNT` | ⬜ optional | **For session persistence**: JSON string of Firebase service account key. Enables syncing chat sessions across workflow runs via Firebase Realtime Database. |
| `FIREBASE_DATABASE_URL` | ⬜ optional | **For session persistence**: Firebase RTDB database URL (e.g. `https://<project>-default-rtdb.firebaseio.com`). Required with `FIREBASE_SERVICE_ACCOUNT`. |

> Note: the built-in `GITHUB_TOKEN` has **no cross-repo access** to `Codespace-3`, so the dedicated `GH_PAT_Codespace3` secret is required (the workflow falls back to `GITHUB_TOKEN` only if `GH_PAT_Codespace3` is absent).

## Session Persistence with Firebase

When both `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_DATABASE_URL` are set:
- **Before starting**: OpenClaw pulls existing sessions from Firebase RTDB
- **After stopping**: OpenClaw pushes updated sessions back to Firebase RTDB
- This ensures your chat history, context, and session state persist across different workflow runs!

## How It Works

```
Browser → trycloudflare.com → cloudflared (GH Actions runner) → localhost:18789 → OpenClaw Gateway
                                    ↕
                           Firebase Realtime Database (session sync)
```

The cloudflared quick tunnel provides a public HTTPS URL that proxies to the OpenClaw gateway running on the GitHub Actions runner. Since the gateway is bound to `loopback` and auth is via token + `dangerouslyDisableDeviceAuth`, no device pairing is required.

## Model Configuration

The `openclaw.json` is generated with 4 OpenCode.ai models:
- `oc/hy3-free` (primary, alias "LA5")
- `oc/nemotron-3.5-lightning-free` (fast, alias "LA5-Fast")
- `oc/laguna-s-2.1-free` (fallback, alias "LA5-Fallback")
- `big-pickle` (last resort, alias "LA5-BigPickle")

All use the same `OPENCODE_API_KEY` and `https://opencode.ai/zen/v1` base URL.

## Codespace-3 Reference

For detailed information about the Codespace-3 repository structure and startup files, see: [CODESPACE-3-REFERENCE.md](CODESPACE-3-REFERENCE.md)

## Usage

1. Go to **Settings → Secrets and variables → Actions** in this repo
2. Add the required secrets above (add Firebase ones for session persistence)
3. Go to the **Actions** tab → **Host OpenClaw Web** workflow → **Run workflow**
4. Wait ~2 minutes for everything to set up
5. Check the workflow output/logs for the **trycloudflare URL** and **token**
6. Open the URL in your browser, enter the token, and start chatting with LA5
7. Your chat history will persist across runs when Firebase sync is enabled!

### Duration

By default the instance runs for **2 hours** (7200 seconds). You can override this when triggering:
- **Run workflow** → set the `duration` input (in seconds)
