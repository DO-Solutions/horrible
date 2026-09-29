# horrible

A parody AI website builder.
Describe a website and an agent builds the worst possible version of it.

Powered by [DigitalOcean Managed Agents](https://docs.digitalocean.com/products/managed-agents/) (public preview) running the `opencode` harness.
Everything - sandbox and model inference - runs on DigitalOcean; there's no separate model provider account to set up.

## Prerequisites

- Node.js 20.9 or newer.
- A DigitalOcean account with Managed Agents enabled (public preview).
- The `doctl` CLI, version 1.174.0 or newer (older versions have no `harness-runtime` command), installed and authenticated (`doctl auth init`).
  Check with `doctl version` and `doctl harness-runtime --help`.
  This app shells out to `doctl harness-runtime` on the same machine that runs the Next.js server - there is no JavaScript/TypeScript SDK for this product yet, since it only launched in public preview recently.

## Setup

1. Clone the repo.

   ```bash
   git clone https://github.com/do-solutions/horrible.git
   cd horrible
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Start the dev server.

   ```bash
   npm run dev
   ```

4. Open http://localhost:3100.

If `doctl` isn't authenticated on your machine, copy `.env.local.example` to `.env.local` and set `DIGITALOCEAN_ACCESS_TOKEN` there instead.
`.env.local` is git-ignored, so the token never gets committed.
Never paste a token into any tracked file.

That's it - no model provider keys, no separate setup step. Every build creates a fresh `doctl harness-runtime` session on demand.

## How it works

- `POST /api/build` runs `doctl harness-runtime create --harness opencode` to start a session, then queues the first prompt.
- `GET /api/build/[sessionId]/stream` relays that session's live build log to the browser as Server-Sent Events.
- `POST /api/build/[sessionId]/message` queues a follow-up prompt ("Make it worse").
- `POST /api/build/[sessionId]/interrupt` kills the local `doctl` process watching the current turn, then queues a follow-up asking the agent to tone things down.
- `GET /api/build/[sessionId]/site` reads `index.html` back out of the session's `/workspace` via `doctl harness-runtime files cat`.

Each session is a real `doctl harness-runtime` session with its own sandbox; prompts to it run through `doctl harness-runtime prompt`, whose stderr streams one line per tool call (`· write`, `· echo test`, ...) while it works, and whose stdout carries the final answer as JSON once the turn finishes. The Next.js server keeps an in-memory queue and event log per session (in `lib/session-runtime.ts`) so the browser can watch it live and send follow-ups without waiting.

## Known limitations of this integration

DigitalOcean Managed Agents launched very recently and only exposes a CLI (`doctl`) and a Go SDK so far - no JS/TS SDK yet. That shapes a few things here:

- **No true mid-run interrupt.** `doctl` has no cancel/stop verb. "STOP, it's too ugly" kills the local process watching the run; the remote agent may keep working briefly regardless before the follow-up message reaches it.
- **Coarser live updates than a native event stream.** Tool calls appear as bare activity lines (tool name or, for shell commands, the command itself) rather than structured calls with full arguments.
- **The model isn't pinned.** The `opencode` harness doesn't let you choose a specific model yet - DigitalOcean's own API says so explicitly (`model: accepted but not enforced in Private Beta`). It currently runs whatever DigitalOcean defaults it to.
- **Real cost per session.** Every build spends from your DigitalOcean team's prepayment balance.

## Security

- The dev and start scripts bind to `127.0.0.1` only, so the app is not reachable from other machines on your network.
  Don't change this: the app has no login, and anyone who can reach it can spend your DigitalOcean balance.
- Build and message endpoints reject cross-site requests, so other web pages you visit can't drive the app.
- The DigitalOcean token is passed to `doctl` through the environment, never on the command line.
- This app is meant for local use.
  Don't expose it to the internet without adding authentication first.

## Notes

- The generated site renders in a sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`), so it can never read or write anything on the parent page.
- This is a tight MVP: no auth, no database, no deployment, no build history, no session cleanup.

## License

[MIT](LICENSE)
