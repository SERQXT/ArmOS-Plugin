---
name: procode-app-fixer
tier: 1
description: "Diagnose and fix deployed Pro-Code apps that aren't working correctly. Handles: no live data (manifest key mismatch), blank pages (wrong fileName), SDK failures (ryuu.js issues), and other common deployment problems. Downloads source, validates manifest, applies fixes, and republishes. Trigger with 'fix the procode app', 'app has no data', 'app shows blank page', 'debug the custom app'."
maturity: beta
deprecated: true
deprecation_note: "Superseded by procode-app-fix (T1) in the v2 rebuild. Bug class decision tree content mined into the new skill."
audience: [code]
---

# Pro-Code App Fixer — Diagnose, Fix, Republish

Diagnoses and fixes common issues with deployed Pro-Code apps in Domo. Downloads the app source, identifies problems, applies fixes, validates, and republishes.

## Triggers

- "fix the procode app"
- "app has no data"
- "app shows blank page"
- "debug the custom app"
- "why doesn't the app show data"
- "republish the app with fixes"

---

## Prerequisites — Check Before Proceeding

Before executing any fix steps, verify these tools are available:
1. **domo-publish tools** — Call `mcp__domo-publish__health_check` first. If it fails or the tool is not found, STOP and report: "procode-app-fixer requires the domo-publish MCP server with customer credentials configured."
2. **domo-datasets tools** (if fixing data issues) — Call `mcp__domo-datasets__health_check` first.

Do NOT proceed with workarounds (curl, CLI commands, raw API calls) if the required MCP tools are unavailable. Report the dependency gap and let the user resolve credentials.

---

## Step 1: Identify the App

**Tool:** `procode_design_list`

Find the target app by name or design ID. If the user provides a design ID, use it directly. Otherwise, list designs and match by name.

```
procode_design_list(searchTerm: "app name", limit: 20)
```

Record: `designId`, `name`, latest `version`, `datasetsMapping`, `collectionsMapping`.

---

## Step 2: Download Source

**Tool:** `procode_source_download`

Download the app source code to a working directory for inspection:

```
procode_source_download(designId: "uuid", outputDir: "/path/to/workspace/app-name")
```

This extracts the full source including `manifest.json`, `index.html`, `app.js`, etc.

---

## Step 3: Validate Manifest

**Tool:** `procode_manifest_validate`

Run automated validation on the downloaded manifest:

```
procode_manifest_validate(manifestPath: "/path/to/workspace/app-name/manifest.json")
```

This checks for the most common issues:

### Critical Issues (app will not work)

| Issue | Symptom | Root Cause |
|-------|---------|------------|
| `"datasetsMapping"` instead of `"mapping"` | App loads but no data | `domo publish` silently ignores API-format keys. Dataset bindings never register. |
| `"collectionsMapping"` instead of `"collections"` | App loads but no AppDB data | Same — collections never bind. |
| `"packagesMapping"` instead of `"packages"` | Code Engine functions unavailable | Same pattern. |
| `"fileName": "manifest.json"` | Raw JSON displayed or blank page | Domo tries to serve manifest.json as the HTML entry point. |
| Placeholder `dataSetId` | Data calls fail | Dataset UUID was never replaced from template. |
| Stale `id` field (placeholder) | Publish creates wrong app or fails | App ID is a placeholder or from a different instance. Remove `id` for fresh publish. |
| Invalid dataset UUID format | Data calls fail silently | `dataSetId` value is not a valid UUID. Replace with correct UUID from target instance. |
| Both `mapping` and `datasetsMapping` present | Ambiguous — datasets may not bind | Conflicting keys. Remove `datasetsMapping`, keep `mapping`. |
| `fileName` points to missing file | Blank page | Entry file doesn't exist. Create it or update `fileName`. |

### Warning Issues (app may partially work)

| Issue | Symptom |
|-------|---------|
| Missing `name` or `version` | CLI may reject or create unnamed app |
| Missing `size` | Defaults to 1x1 — may be too small |
| Empty `mapping` + no `collections` | App has no data access at all |

---

## Step 4: Inspect HTML for SDK Issues

Read `index.html` and check for ryuu.js issues:

1. **Missing ryuu.js include**: The ryuu.js CDN script MUST be present in every Pro-Code app's `index.html`. If missing, add `<script src="https://unpkg.com/ryuu.js"></script>` before the app script. This is the #1 cause of "domo is not defined" errors.
2. **Wrong ryuu.js URL**: `https://unpkg.com/ryuu.js@latest/dist/index.umd.js` may not resolve. The correct URL is exactly `https://unpkg.com/ryuu.js`.
3. **ryuu.js load order**: The ryuu.js script tag MUST appear before `app.js` (or any script that references the `domo` global). If `app.js` loads first, `domo` will be undefined.
4. **Missing fallback handling**: If the app uses a custom data service that branches on `domo` availability (e.g., `if (typeof domo !== 'undefined')`), verify the production path uses `domo.get()` not `fetch()`.

---

## Step 4b: Check for Blocked Native Modals

Search `app.js` (and any other JS files) for calls to `confirm(`, `alert(`, or `prompt(`. These are **completely blocked** in Domo's sandboxed iframe and will silently fail with:

```
Ignored call to 'confirm()'. The document is sandboxed, and the 'allow-modals' keyword is not set.
```

If found, replace with a custom HTML/CSS modal overlay. See the **procode-app-builder** skill's "Sandbox Restrictions" section for drop-in replacement patterns.

---

## Step 5: Apply Fixes

> **⛔ NEVER edit files in `dist/`.** The `dist/` directory is build output — any changes are overwritten on the next `npm run build`. Always fix the SOURCE files (root `manifest.json`, `src/`, `index.html`, `app.js`) and rebuild. If you find that `dist/manifest.json` is correct but root `manifest.json` is wrong, the root is the bug — fix the root and rebuild.

> **CRITICAL: Surgical edits only.** Only modify the specific files and lines that contain the identified bug. Do NOT rewrite, regenerate, or overwrite files that don't need changes. If the bug is in `app.js` line 123, fix that line — don't rewrite the entire file. Preserving the user's existing code, formatting, comments, and structure is mandatory. The goal is the smallest possible diff that fixes the issue.

For each identified issue, apply the fix directly to the downloaded source files:

### Manifest Key Fixes
```json
// BEFORE (broken — API format)
{
  "datasetsMapping": [...],
  "collectionsMapping": [...],
  "packagesMapping": [...]
}

// AFTER (correct — CLI format)
{
  "mapping": [...],
  "collections": [...],
  "packages": [...]
}
```

### fileName Fix
```json
// BEFORE (broken)
"fileName": "manifest.json"

// AFTER (correct)
"fileName": "index.html"
// Or for React/Vite builds:
"fileName": "dist/index.html"
```

### ryuu.js Fix (in index.html)
```html
<!-- BEFORE (missing or wrong URL) -->
<!-- no ryuu.js include at all, or: -->
<script src="https://unpkg.com/ryuu.js@latest/dist/index.umd.js"></script>

<!-- AFTER (correct — MUST be present in every Pro-Code app, before app.js) -->
<script src="https://unpkg.com/ryuu.js"></script>
```

### Version Bump
Always bump the version in manifest.json after fixes so the deployment is trackable:
```json
"version": "1.0.1"  // was "1.0.0"
```

---

## Step 6: Re-validate

**Tool:** `procode_manifest_validate`

Run validation again on the fixed manifest to confirm all critical issues are resolved.

---

## Step 7: Republish

**Tool:** `procode_publish`

Publish the fixed app:

```
procode_publish(appDir: "/path/to/workspace/app-name")
```

This tool:
1. Validates the manifest (blocks publish if critical issues remain)
2. Checks that the `domo` CLI is installed and authenticated
3. Runs `domo publish` from the app directory
4. Returns the design ID and view URL

**First publish vs update**: If the manifest has an `id` field (from the original download), `domo publish` updates that existing design. If no `id`, it creates a new design.

### Known Issue: Ryuu CLI Manifest Rewriting

The `domo publish` CLI command rewrites manifest.json during publish:
- Sets `fileName` to "manifest.json" instead of the app entry point
- Converts `mapping` to `datasetsMapping` format

**This is now handled automatically** by the `procode_publish` MCP tool, which normalizes the manifest after every publish. If using the CLI directly (not via the tool), manually rename keys back after publish.

### Known Issue: File Upload Verification

File uploads may return HTTP 200 but files don't appear in the design version. After uploading:
1. Call `mcp__domo-publish__procode_design_list` to verify files are present
2. If files are missing, try: delete the design version, create a new one, and re-upload
3. If still failing after 2 attempts, report the issue — do not loop endlessly

---

## Step 8: Verify

After publishing, verify the app:

1. Report the view URL: `https://{instance}.domo.com/assetlibrary?designId={id}`
2. If screenshot tools are available, screenshot the **page view** (`/page/{pageId}`), NOT the card detail view. Card detail renders the app in a cross-origin iframe that Playwright cannot capture.
3. If not, instruct the user to check manually

---

## Output

```
## Pro-Code App Fix Report

**App:** [Name] (Design ID: [id])
**Instance:** [instance].domo.com
**Version:** [old] → [new]

### Issues Found & Fixed
| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | Critical | "datasetsMapping" → "mapping" | Renamed key |
| 2 | Critical | "fileName": "manifest.json" | Changed to "index.html" |
| 3 | Warning | Wrong ryuu.js URL | Fixed to unpkg.com/ryuu.js |

### Republish Status
- Published: ✓
- View URL: https://[instance].domo.com/assetlibrary?designId=[id]

### Next Steps
- Verify the app displays data correctly in Domo
- If the app is on a dashboard page, refresh the page to load the new version
```

---

## Guardrails

- **Replace all `confirm()`, `alert()`, `prompt()` calls.** Domo's sandboxed iframe blocks native browser modals entirely. Replace with custom HTML/CSS modal overlays.
- **Surgical edits only.** Only modify files that contain the identified bug. Never rewrite, regenerate, or replace files that don't need changes. The user's code, comments, formatting, and structure must be preserved. Aim for the smallest diff possible.
- **Never overwrite all files.** If the bug is in one file, only that file should change. If you need to fix `manifest.json` and `app.js`, only those two files should be modified — leave `index.html`, CSS, and everything else untouched.
- **Never edit `dist/` files directly.** Fix source files and rebuild. `dist/` is ephemeral build output.
- **This is NOT for App Studio.** This skill fixes Pro-Code apps (custom HTML/CSS/JS deployed via `domo publish`). App Studio apps are no-code dashboards — use Dashboard Builder for those.

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: root cause of the issue, fix applied, app design ID, what was broken vs working now.

## MCP Servers Required

- **domo-publish** — design listing, source download, manifest validation, publishing
- **domo-datasets** — for verifying dataset IDs referenced in the manifest
- **domo-appdb** — for verifying collection IDs (if app uses AppDB)
- **mcp-qa-testing** — for post-fix screenshot verification (optional)
