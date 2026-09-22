---
name: publish
tier: 0
description: "Build and publish Domo custom apps with the dist/ workflow, Domo CLI authentication, first-publish ID handling, and pre-publish checklist. MUST use `domo publish` CLI first — do NOT call the procode_publish MCP tool unless the CLI fails. Trigger with 'publish app', 'domo publish', 'deploy domo app', 'upload app', 'build and publish'."
maturity: alpha
audience: [code]
---

# Build & Publish a Domo Custom App

## Tool choice — MANDATORY ordering

**Step 1: ALWAYS try `domo publish` CLI first.** Run it from the app directory (or `dist/` if the app has a build step). Do NOT skip this step. Do NOT call the MCP tool before trying the CLI. The CLI is how Domo designs publish to work.

**Step 2: ONLY if the CLI fails**, use `mcp__domo-publish__procode_publish` as a fallback. Valid reasons to fall back:
- `domo` CLI binary is not installed or not found on PATH
- `domo publish` returned an error after you tried it (auth failure, upload failure, etc.)

**Do NOT use the MCP tool as the first attempt.** The MCP tool is a safety net, not the primary path. If you reach for `procode_publish` without first trying `domo publish`, you are doing it wrong.

**When you DO fall back to `procode_publish`, pass `appDir` (the app's local directory) — NOT inline `files`.** The app is already on disk in your workspace, so point the tool at it. Inlining a whole app's file contents as one payload can blow the agent turn budget and time out (the publish may still land, but the turn dies with no confirmation). Reserve `files` for cloud callers that have no filesystem access. Note the tool picks its own transport: if the `domo` CLI isn't on PATH it uses the Domo REST API automatically — **a missing CLI is not a reason to inline files.**

**Always-apply rules:**
- Don't run `domo login` interactively — it needs a TTY the agent doesn't have. Call `mcp__armos-control__authenticate_instance` first if the user isn't authenticated to the target instance yet. It opens browser OAuth and writes the same Ryuu session file.
- Don't edit, copy, or otherwise mutate files under `~/.config/configstore/ryuu/`. The CLI manages those itself.
- Don't edit `.env` for Domo auth. Auth is via the Ryuu session.

## Prerequisites

- Node.js installed
- Domo CLI installed (`npm install -g @domoinc/ryuu`)
- A Ryuu session for the target instance — see `authenticate_instance` if missing

## Local development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (usually Vite)
```

For API calls to work locally, ryuu-proxy must be configured and the Ryuu session must be valid.

## Build for production

```bash
npm run build        # Outputs to dist/ (Vite) or build/ (CRA)
```

## Publishing (primary path — CLI)

```bash
cd dist
domo publish
```

If publish includes new/updated Code Engine packages, run package lifecycle steps first.

**First publish:**
- On first publish, Domo generates a new `id` for the app. It appears in `dist/manifest.json`.
- Copy that `id` back to your source `manifest.json` (e.g. `public/manifest.json`) so the next publish updates the existing app rather than creating a new one.

```bash
# After first publish, copy the generated ID:
# dist/manifest.json -> public/manifest.json (just the "id" field)
```

## Subsequent publishes

```bash
npm run build && cd dist && domo publish
```

## MCP fallback (ONLY after CLI fails)

You MUST have already tried `domo publish` and it MUST have failed before calling this. If `domo publish` errored out — most commonly an auth issue or an oversize-payload upload — call `mcp__domo-publish__procode_publish({ appDir: "<absolute path to the app dir, NOT dist>" })`. It will:

1. Run manifest validation up front and surface critical issues before attempting publish
2. Try `domo publish` internally
3. If the CLI fails, fall back to a direct API publish using the user's Ryuu session
4. Write the generated `id` back to the source `manifest.json` for you on first publish

When the tool returns a Design ID + Asset Library URL, the publish is complete — don't run any "verify" or "fix" follow-up Bash. Internal status messages inside a successful result describe the tool's strategy, not unfinished work.

## Pre-publish checklist

Before running `domo publish` (or `procode_publish`), make sure the manifest passes:
- [ ] `manifest.json` has correct `dataSetId` (not `id`) for any datasets it references
- [ ] `manifest.json` has `fields: []` in each dataset mapping
- [ ] `thumbnail.png` exists and is 300×300 pixels
- [ ] All queries use `.select()` with specific columns (never fetch all columns)
- [ ] Each visualization has its own optimized query
- [ ] No `.aggregate()` calls (use `.groupBy()` or client-side aggregation)
- [ ] `.groupBy()` calls have a grouping column (not just aggregations)

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) — Riley Stahura's Domo AI skills collection. Updated 2026-05-04 to clarify CLI-primary / MCP-fallback policy and to call out the narrow safety rules (no Ryuu file edits, no interactive `domo login`).
