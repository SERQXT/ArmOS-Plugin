---
name: procode-app-fix
tier: t1
description: "Judgment-heavy diagnosis and repair of deployed Pro-Code Domo apps. Downloads source, walks the decision tree for the known bug classes (no data, blank page, SDK failure, modal blocked, dist/ overwrite), applies surgical fixes, and republishes. Refuses when the bug class is not in the decision tree and redirects to architecture-debt log for recurring patterns. Trigger with 'fix the procode app', 'app has no data', 'app shows blank page', 'debug the custom app', 'why doesn't the app show data'."
bucket: customer-delivery
status: draft
visibility: anyone
created_by: lane-L7-procode
created_at: 2026-06-07T00:00:00Z
---

# Pro-Code App Fix

Diagnoses and repairs deployed Pro-Code apps by walking a structured decision tree of known bug classes. Downloads the source, identifies the root cause, applies the smallest possible fix, and republishes. Refuses when the symptom is outside the known decision tree rather than guessing.

## When to use

- "Fix the Pro-Code app — it has no data"
- "The custom app shows a blank page"
- "Debug the deployed Domo app"
- "Why doesn't the app show data after publish?"
- "The app shows `domo is not defined`"
- "Republish the app with the fix applied"

## When NOT to use

Do not use this skill when the app does not yet exist — use `procode-app-decide` + `procode-app-build` to create it. Do not use this skill for App Studio no-code apps (wrong runtime entirely). If the bug recurs across multiple engage­ments and appears to be a systemic pattern (e.g., every app built with a particular template ships with the wrong manifest key), record it in the architecture-debt log and surface to the team rather than fixing each instance individually.

## What this skill does

Downloads the app source, validates the manifest against the known-critical-issue table, inspects `index.html` for SDK inclusion errors, checks `app.js` for sandbox-blocked browser APIs, applies surgical fixes, re-validates, and republishes. Each fix targets the specific file and line containing the bug — the rest of the source is untouched.

## Design principles

- **Decision-tree first.** Walk the known bug classes in order before forming any hypothesis. The decision tree is sourced from production-failure patterns across 301 apps.
- **Surgical edits only.** Only the files containing the identified bug change. Never rewrite, regenerate, or overwrite files that do not contain the issue.
- **Refuse outside the tree.** If the symptom does not match any known bug class after the full decision tree is walked, stop and say so clearly rather than guessing. Guessing creates new bugs.
- **Recurring patterns go to debt.** If the same bug class appears on the same engagement twice, note it in the architecture-debt log — it is a process failure upstream, not just a one-off fix.

## Bug class decision tree

Walk in this order. Stop at the first matching class and apply the fix.

### Class 1 — No live data (manifest key mismatch)

**Symptom:** App loads UI but all data is empty/undefined.
**Root cause:** `manifest.json` uses API-format keys (`datasetsMapping`, `collectionsMapping`, `packagesMapping`) instead of CLI-format keys (`mapping`, `collections`, `packages`). `domo publish` silently ignores API-format keys.
**Fix:** Rename keys. Never add `datasetsMapping` alongside `mapping` — remove the wrong key entirely.

### Class 2 — Blank page or raw JSON displayed

**Symptom:** Domo renders a blank white page or the raw JSON of `manifest.json`.
**Root cause:** `"fileName": "manifest.json"` in the manifest. Domo is serving the manifest as the entry point instead of `index.html`.
**Fix:** Set `"fileName": "index.html"` (or `"dist/index.html"` for React/Vite apps).

### Class 3 — SDK failure (`domo is not defined`)

**Symptom:** Browser console shows `ReferenceError: domo is not defined`.
**Root cause (check in order):**
- ryuu.js `<script>` tag is missing from `index.html` entirely
- Wrong ryuu.js URL (e.g., `unpkg.com/ryuu.js@latest/dist/index.umd.js` does not resolve reliably)
- ryuu.js loads after `app.js` — `domo` global is not yet defined when app code runs

**Fix:** Ensure `<script src="https://unpkg.com/ryuu.js"></script>` appears in `index.html` before any app scripts. The exact URL matters — use the bare package URL.

### Class 4 — Silent modal failure

**Symptom:** Confirm/alert/prompt calls in app code silently do nothing.
**Root cause:** Domo's sandboxed iframe blocks `confirm()`, `alert()`, and `prompt()` entirely. The `allow-modals` sandbox keyword is not set.
**Fix:** Replace every `confirm(`, `alert(`, and `prompt(` call with a custom HTML/CSS modal overlay. Reference `procode-app-build` for drop-in modal patterns.

### Class 5 — Fix regresses on next publish (dist/ overwrite)

**Symptom:** A fix was applied and the app worked, but re-publishing overwrites the fix.
**Root cause:** The fix was applied to `dist/` files (Vite build output) rather than source files. The next `npm run build` overwrites `dist/`.
**Fix:** Identify the source file that maps to the broken `dist/` output. Apply the fix there and rebuild. Never edit `dist/` directly.

### Class 6 — Stale or placeholder dataset UUID

**Symptom:** Data API calls return 404 or 403; dataset ID in manifest is not a real UUID on this instance.
**Root cause:** The manifest was copied from another instance or from a template and the `dataSetId` values were never updated.
**Fix:** Replace each placeholder UUID with the real dataset UUID for this instance. Verify via `mcp__domo-datasets__health_check` if available.

### Class 7 — Stale `id` field (wrong-instance app update)

**Symptom:** `domo app publish` updates the wrong design, or publish succeeds but the app is a different name/design than expected. Customer reports: "it updated someone else's app."
**Root cause:** The `id` field in `manifest.json` contains a design UUID from a different Domo instance or a previous engagement. The Go CLI uses `id` to determine update vs create — if `id` is present, it updates that design regardless of instance.
**Diagnostic:** Check `manifest.json` for an `"id"` field. Run `domo app get --id <value>` to confirm whether it resolves on the current instance.
**Fix:** Remove the `id` field from `manifest.json` before publishing to create a new design on the correct instance.

### Class 8 — `fileName` points to a missing file

**Symptom:** Blank page or 404 when the app loads; the entry file referenced in `manifest.json` `fileName` does not exist in the published zip.
**Root cause:** `fileName` was set to a path that doesn't exist — e.g., `"dist/index.html"` but the build output `dist/` directory was not included in the publish, or `fileName` was left as `"manifest.json"` after a CLI rewrite.
**Diagnostic:** Download the app (`domo app download --id <id>`), unzip, and compare the file list to the `fileName` field. Common mismatches: `"dist/index.html"` (correct only if `dist/` is published), `"manifest.json"` (always wrong — Domo serves manifest as JSON, not HTML entry).
**Fix:** Set `fileName` to match the actual entry file at the correct path in the published zip. For React/Vite apps with `outDir: '.'`, use `"index.html"`. Remove the `fileName` key entirely if using `datasetsMapping` without a custom entry file (CLI will default to `index.html`).

### Class 9 — React/Vite naive build → blank-page MIME rejection

**Symptom:** App shows a blank page. No JavaScript errors in the browser console (the iframe sandbox swallows them). The `index.html` in the deployed zip contains `<script type="module" crossorigin src="/assets/index-*.js">`.
**Root cause:** Vite's default build outputs ES modules (`type="module"`). Domo's CDN serves `.js` as `Content-Type: application/octet-stream`, which browsers refuse to execute as a module (MIME type mismatch). The app silently fails to load.
**Diagnostic:** Download the published app zip. Open `index.html`. Look for `type="module"` on any script tag. If present, this is the root cause.
**Fix:** Rebuild with the Domo-required Vite config. In `vite.config.ts`, set `build.lib.formats: ['iife']`, `build.outDir: '.'`, and `build.rollupOptions.output.entryFileNames: 'index.js'`. Update `index.html` to reference `<script src="./index.js">` with no `type="module"`, no `defer`, no `crossorigin`. Republish the corrected build. See `procode-app-build ## React/Vite build constraints` for the full config example.

### Class 10 — `process is not defined` runtime error

**Symptom:** App loads (HTML returns 200, bundle returns 200), but the page is blank with `Uncaught ReferenceError: process is not defined` in the browser console. The `<script src>` loads without error, but React never mounts.
**Root cause:** The Vite bundle was built without a `process.env` shim. Browsers have no `process` global. React and many npm dependencies reference `process.env.NODE_ENV` at runtime in IIFE builds unless Vite explicitly replaces it. In `build.lib` mode, this replacement may not apply to all transitive dependencies.
**Diagnostic:** Download the zip, extract `index.js`, and run:
```bash
grep -c "process\.env\.NODE_ENV" index.js  # >0 means the shim is missing
grep -oE "process\.\w+" index.js | sort -u  # enumerate all process.* references
```
**Fix:** Add to `vite.config.ts`:
```typescript
define: {
  'process.env': '{}',
  'process.env.NODE_ENV': '"production"',
},
```
Rebuild and republish. Verify `grep -c "process\.env\.NODE_ENV" index.js` returns 0 after the fix.

### Class 11 — 403 on bundle due to absolute asset path (chunk-path mismatch)

**Symptom:** App iframe loads (HTML returns 200), but the JS bundle returns 403 in the browser console network tab. Error appears as `Failed to load resource: 403` on the `index.js` (or a chunk file like `assets/index-*.js`).
**Root cause:** Without `base: './'` in `vite.config.ts`, Vite generates absolute paths for assets (`/assets/index-*.js`). In Domo's CDN, the iframe base URL is a version-specific path (`https://{instance}/domoapps/{versionId}/`). Absolute paths resolve to the Domo root rather than within the app's CDN scope — the CDN returns 403 because the path is outside the app's allowed asset boundary. An additional trigger: publishing the entire source directory (not just the build output) creates a large zip with both `dist/` and root-level files, which can confuse Domo's asset resolution.
**Diagnostic:** Download the app zip, extract `index.html`, and check the `<script src>` value:
- If `src="/assets/index-*.js"` (absolute path starting with `/`): chunk-path mismatch
- If `src="./index.js"` but it still 403s: investigate whether source files were included in the zip, creating path ambiguity
**Fix:** Set `base: './'` in `vite.config.ts` and rebuild. Also ensure only the built output files (`index.html`, `index.js`, `index.css`, `manifest.json`, `thumbnail.png`) are included in the publish — do not publish `src/`, `node_modules/`, `dist/`, or source config files. Republish the corrected build.
```typescript
// vite.config.ts — add this:
base: './',
```
_Validated live on domo-alex-dengate.domo.com 2026-06-08._

## Inputs

- App name or design ID (required)
- Domo instance name (required for download and republish)
- Description of the symptom observed (helps prioritise which bug class to check first)

## Outputs

```
## Pro-Code App Fix Report

**App:** [Name] (Design ID: [id])
**Instance:** [instance].domo.com
**Version:** [old] → [new]

### Root cause
[Bug class N — one sentence description]

### Fix applied
[Exact file(s) changed and what changed]

### Republish status
- Published: [yes / no — reason if no]
- View URL: https://[instance].domo.com/assetlibrary?designId=[id]
```

## Failure modes and recovery

- **Bug class not in decision tree:** stop after walking all eleven classes and report "symptom does not match any known Pro-Code bug class." Do not guess. Provide the symptom, any console errors, and the manifest state for the user to investigate further.
- **MCP tools unavailable:** if `mcp__domo-publish__health_check` fails, stop and report the credential gap — do not fall back to raw CLI or curl for download/publish operations.
- **File upload verification:** after publishing, if the design list does not show the new version, try once more then stop — do not loop.
- **Recurring bug:** if this is the second time the same bug class appears on the same engagement, note it in the architecture-debt log before applying the fix.
