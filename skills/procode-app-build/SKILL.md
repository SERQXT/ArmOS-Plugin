---
name: procode-app-build
tier: t2
description: "Deterministic scaffold-to-ship pipeline for Pro-Code Domo apps. Requires a build spec from procode-app-decide. Steps: scaffold files, wire data access, configure manifest, build (React only), publish via domo publish. Refuses when build spec is missing, deployment target is unspecified, or data-access pattern conflicts with deployment shape."
bucket: customer-delivery
status: draft
visibility: anyone
created_by: lane-L7-procode
created_at: 2026-06-07T00:00:00Z
input_contract: "Requires a build spec from procode-app-decide naming architecture pattern, framework (vanilla/react), deployment shape, and dataset aliases. Refuses when spec is missing, deployment target unspecified, or data-access pattern conflicts with deployment shape (e.g. packages-only spec with no packageId values)."
---

# Pro-Code App Build

> **Pro-Code Custom Apps vs App Studio dataapps — two different Domo products.** This skill builds **Pro-Code Custom Apps** (HTML/JS/React bundle deploys — URLs like `/assetlibrary?designId={uuid}`). It does NOT build **App Studio dataapps** (drag-drop containers with rooster widgets, embedded cards, themes — URLs like `/app-studio/{designId}/pages/{viewId}`). If the user wants an App Studio dataapp, route to `app-studio-page-build` instead. CLI namespaces: Pro-Code uses `domo app *` + `domo app publish`; App Studio uses `domo appstudio *` (all behind `--experimental`).

Deterministic scaffold-to-ship pipeline for Pro-Code Domo apps. Consumes the build spec produced by `procode-app-decide` and executes each phase in order: scaffold, wire data, configure manifest, build (React only), validate, publish.

## When to use

- A build spec from `procode-app-decide` is in context and the user says "build it" or "go ahead"
- "Scaffold the Pro-Code app from the spec"
- "Execute the procode build plan"

## When NOT to use

Use `procode-app-decide` first if no build spec exists. Use `procode-app-fix` if the app is already deployed and broken — this skill creates new apps, it does not debug existing ones.

## What this skill does

Executes the build spec step by step without improvising architecture. Each step has a clear exit condition; if a step fails, the skill stops and surfaces the blocker rather than guessing a workaround.

## Dependencies

- `procode-app-decide` — must have produced the build spec consumed here
- `mcp__domo-publish__procode_publish` — publish the completed app
- `mcp__domo-publish__procode_manifest_validate` — validate manifest before publish
- `mcp__domo-datasets__health_check` — verify dataset access for dataset-pattern apps
- Domo Go CLI (`domo publish`) — primary publish path; MCP tool is the fallback

## Steps

1. **Verify prerequisites.** Read the build spec from context. If the spec is missing or does not name a deployment target (size + fullpage), stop and request `procode-app-decide` output. Call `mcp__domo-datasets__health_check` for any spec that includes dataset aliases.

2. **Scaffold file structure.** Create the working directory and seed the canonical file set based on the framework from the spec:
   - Vanilla: `index.html`, `app.js`, `manifest.json`, `thumbnail.png` (300×300 transparent PNG placeholder)
   - React/Vite: `index.html`, `src/main.tsx`, `src/App.tsx`, `manifest.json`, `vite.config.ts`, `tsconfig.json`, `package.json`, `thumbnail.png`
   Include `<script src="https://unpkg.com/ryuu.js"></script>` before app scripts in every `index.html`.

3. **Wire data access.** Based on the architecture pattern in the spec:
   - Dataset-only: add `domo.get('/data/v1/{alias}')` call in app code for each alias; use `encodeURIComponent` for SQL queries.
   - Dataset + Collections: add dataset reads plus `domo.get`/`domo.post` for AppDB collection endpoints.
   - Collections-only: wire only AppDB endpoints.
   - Packages-only: wire `domo.post('/domo/codeengine/v2/packages/{functionName}', payload)` for each package alias.
   - Full-stack: combine dataset + collections + packages patterns.

4. **Configure manifest.json.** Write the manifest using the keys that the Go CLI (`domo app publish`) expects: `datasetsMapping` (with `fields: []` on each entry), `collectionsMapping`, `packagesMapping`. Set `size`, `name`, and `version: "1.0.0"`. Use real dataset UUIDs from the spec; if placeholders remain, note them and continue — the publish step will validate. See `## Manifest normalization after domo app publish` below for the full key requirements and the post-publish `id` field behaviour.

5. **Build (React only).** Configure `vite.config.ts` with the Domo-required build settings before running `npm install` then `npm run build`. The default Vite config produces a broken deploy. See `## React/Vite build constraints` below for the required config. If the build fails, report the exact compiler error and stop — do not attempt workarounds.

6. **Validate manifest.** Call `mcp__domo-publish__procode_manifest_validate` on the manifest file. Stop if any critical issue is reported (wrong key names, placeholder UUIDs, missing `fileName`).

7. **Publish.** Run `domo app publish` from the project directory (or call `mcp__domo-publish__procode_publish` as fallback). On first publish the CLI writes an `id` field into `manifest.json` — this is expected and correct. See `## Manifest normalization after domo app publish` for what changes and what to do before the next publish. Report the design ID and view URL on success.

## Guardrails

- **Refuse if build spec from `procode-app-decide` is missing or does not name a deployment target.** Do not proceed with guesses about size or fullpage — the decision layer must run first.
- **Never edit `dist/` files.** `dist/` is Vite build output; always edit source files and rebuild. For React apps using `outDir: '.'`, `dist/` is not used — do not confuse the two modes.
- **Always use `datasetsMapping` (not `mapping`) in manifest.json.** The Go CLI (`domo app publish`) requires `datasetsMapping` with a `fields: []` array on each entry. Using `mapping` causes HTTP 500 on publish.
- **Do not run `domo login` interactively.** Auth is managed by `mcp__armos-control__authenticate_instance`. Stop and report if authentication is missing.
- **Stop after two failed publish attempts.** Do not loop on upload failures — surface the error.
- **Never use `YEAR()`, `MONTH()`, `DATEPART()`, `DATEDIFF()`, `CONVERT()`, or `CAST()` in pro-code SQL queries.** These functions are not supported by the `/data/v1/{alias}` endpoint. See `## SQL endpoint limitations` below.

## Success criteria

- All scaffolded files exist on disk and `index.html` includes the ryuu.js script tag before app scripts.
- Manifest passes `procode_manifest_validate` with zero critical issues.
- `domo publish` (or `procode_publish`) returns a design ID and view URL.
- No `dist/` files were edited directly.

## Inputs

- Build spec from `procode-app-decide` (required)
- Domo instance name (required for publish)
- Working directory path (defaults to `~/workspace/{app-name}`)

## Outputs

```
## Pro-Code App Build Report

**App:** [name]
**Instance:** [instance].domo.com
**Design ID:** [uuid]
**View URL:** https://[instance].domo.com/assetlibrary?designId=[uuid]

**Steps completed:**
- [x] Prerequisites verified
- [x] Files scaffolded
- [x] Data access wired
- [x] Manifest configured
- [x] Build passed (React) / N/A (vanilla)
- [x] Manifest validated (0 critical issues)
- [x] Published
```

## Failure modes and recovery

- **No build spec**: stop immediately, instruct the user to run `procode-app-decide` first.
- **Placeholder dataset UUIDs**: manifest validate will catch these; surface the specific alias and ask for the real UUID.
- **React build failure**: report the exact TypeScript/Vite compiler error; do not attempt silent workarounds.
- **Publish failure**: try once with `domo app publish`, once with `procode_publish` MCP tool, then stop and report.

---

## SQL endpoint limitations

The pro-code data endpoint (`/data/v1/{alias}?sql=...`) supports a subset of SQL. The following functions are **not supported** and will return empty results or an error with no indication of why:

| Function | Status | Workaround |
|----------|--------|------------|
| `YEAR()` | Not supported | `SUBSTRING(date_col, 1, 4)` for ISO dates; or fetch all dates and extract client-side |
| `MONTH()` | Not supported | `SUBSTRING(date_col, 6, 2)` for ISO dates; or extract client-side |
| `DATEPART()` | Not supported | Parse dates client-side |
| `DATEDIFF()` | Not supported | Calculate client-side |
| `CONVERT()` / `CAST()` | Not supported | Use client-side type conversion |
| `COUNT(DISTINCT ...)` | Supported | Works normally |
| `GROUP BY`, `ORDER BY`, `LIMIT` | Supported | Work normally |

**Broken SQL (silent empty result in app context):**

```sql
SELECT DISTINCT YEAR(order_date) AS year FROM table ORDER BY year
```

**Working SQL workaround (SUBSTRING for ISO date strings):**

```sql
SELECT DISTINCT SUBSTRING(order_date, 1, 4) AS year FROM table ORDER BY year
```

**Working client-side workaround (when full date rows are needed):**

```javascript
// Fetch all distinct dates (use LIMIT to cap large datasets)
const sql = `SELECT DISTINCT order_date FROM table WHERE order_date IS NOT NULL ORDER BY order_date DESC LIMIT 10000`;
const rows = await domo.get('/data/v1/orders?sql=' + encodeURIComponent(sql));
const years = [...new Set(rows.map(r => new Date(r.order_date).getFullYear()))].sort((a, b) => b - a);
```

Note: The standard Domo SQL API (`/api/query/v1/execute/{datasetId}`) does support `YEAR()` and the other functions listed above. The limitation is specific to the pro-code `/data/v1/{alias}` endpoint.

_Source: v1 `procode-app-builder/SKILL.md:170-194`; validated live on domo-alex-dengate.domo.com 2026-06-08._

---

## Manifest normalization after domo app publish

The Go CLI (`domo app publish`) rewrites `manifest.json` after every publish. Understanding this behaviour prevents broken re-publish cycles.

**What the CLI does on first publish:**
- Adds `"id": "<design-uuid>"` to the manifest root
- Preserves all other keys as-is

**What it does NOT do** (unlike the legacy Ryuu CLI):
- Does NOT rename `datasetsMapping` → `mapping`
- Does NOT set `fileName` to `"manifest.json"`

**Required manifest shape for the Go CLI (validated live):**

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "size": { "width": 2, "height": 1 },
  "datasetsMapping": [
    {
      "alias": "orders",
      "dataSetId": "28e8722b-bb4c-4453-89ff-b1dfff906457",
      "fields": []
    }
  ]
}
```

After first publish, the CLI adds `"id": "<uuid>"` — this is correct; do not remove it.

**What breaks:**
- Using `"mapping"` instead of `"datasetsMapping"` → HTTP 500 on publish (API rejects it)
- Omitting `"fields": []` on each dataset entry → HTTP 400 (API requires the `fields` array even if empty)

**Before each publish cycle**, verify:
1. `datasetsMapping` key is present (not `mapping`)
2. Each entry has `"fields": []`
3. `id` field is present after first publish (do not remove it)

_Source: v1 `procode-app-builder/SKILL.md:788-800` + `procode-app-fixer/SKILL.md:202-208`; validated live on domo-alex-dengate.domo.com 2026-06-08._

---

## React/Vite build constraints

Domo's CDN serves `.js` files with `Content-Type: application/octet-stream`. This means ES module scripts (`<script type="module">`) are rejected by the browser — they require a JavaScript MIME type. A default Vite build produces a blank-page deploy.

**The broken output (default Vite config):**

```html
<!-- Produced by default vite build — broken in Domo -->
<script type="module" crossorigin src="/assets/index-DfKp6xNp.js"></script>
```

This produces a blank page. No browser console error in the iframe; the app simply never loads.

**Required `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tell Vite this app loads from the current directory (Domo iframe context).
  // Without this, chunk paths resolve to absolute /assets/... which 403s in Domo's CDN.
  base: './',
  define: {
    // Shim process.env for code (or deps) that reference it at runtime.
    // Browsers don't have `process`; without this shim React and its dependencies
    // throw "Uncaught ReferenceError: process is not defined" in the iframe.
    'process.env': '{}',
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],       // IIFE avoids type="module" + MIME rejection
      name: 'App',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',        // deterministic name
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'index.css';
          return '[name][extname]';
        },
        // inlineDynamicImports is implicit with lib+iife (single-entry iife is already inlined)
      },
    },
    outDir: '.',              // output to project root, not dist/
    emptyOutDir: false,       // don't wipe manifest.json / thumbnail.png
  },
});
```

**Important: Vite rewrites `index.html` during lib builds.** After running `npm run build`, overwrite `index.html` with the canonical Domo shape. Vite injects a module script tag which must be removed:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My App</title>
    <link rel="stylesheet" href="./index.css">
  </head>
  <body>
    <script src="https://unpkg.com/ryuu.js"></script>
    <div id="root"></div>
    <script src="./index.js"></script>
  </body>
</html>
```

**Checklist before publishing a React/Vite app:**
- [ ] `index.js` and `index.css` are at project root (not in `dist/`)
- [ ] `index.html` does NOT contain `type="module"`, `defer`, or `crossorigin`
- [ ] ryuu.js `<script>` appears before the app script in `<body>`
- [ ] App script is in `<body>`, not `<head>`
- [ ] `manifest.json` is at project root (not in `dist/`)
- [ ] `vite.config.ts` includes `base: './'` and the `define` block

_Source: v1 `procode-app-builder/SKILL.md:651-688`; validated live on domo-alex-dengate.domo.com 2026-06-08._

---

### `process is not defined` — required Vite `define` shim

**Symptom:** App loads (HTML and bundle return 200), but the app is blank with `Uncaught ReferenceError: process is not defined` in the browser console.

**Root cause:** Browsers do not have a `process` global. React 16/17 and many npm dependencies reference `process.env.NODE_ENV` at runtime. In a standard app build, Vite replaces `process.env.NODE_ENV` with the literal string `"production"` during the build. However, in `build.lib` mode this replacement sometimes does not apply to all transitive dependencies — the literal `process.env.NODE_ENV` (or bare `process`) survives into the bundle.

In addition, some dependencies reference `process.emit` or `process.env` directly (outside of `NODE_ENV`) and are not fully tree-shaken by Rollup in IIFE mode.

**Fix:** Add the `define` block to `vite.config.ts`:

```typescript
define: {
  'process.env': '{}',
  'process.env.NODE_ENV': '"production"',
},
```

This causes Vite/Rollup to replace every occurrence of `process.env` with the object literal `{}` and every occurrence of `process.env.NODE_ENV` with the string `"production"` at build time. Any remaining `process.emit` references inside guarded code (`if (typeof process === 'object' && typeof process.emit === 'function')`) will safely short-circuit at runtime because `process.emit` will be `undefined`.

**Verification:** After rebuilding, confirm that `process.env.NODE_ENV` no longer appears as a literal identifier in `index.js`:

```bash
grep -c "process\.env\.NODE_ENV" index.js  # must be 0
```

---

### Asset path resolution in Domo iframes

**Symptom:** `index.html` loads (200) but the bundle (`index.js`) returns 403 in the browser console. The 403 appears when the iframe is open in a live Domo session.

**Root cause:** Without `base: './'`, Vite generates absolute paths (`/assets/index-*.js`) for chunk references. When the Domo CDN serves the iframe, the base URL is the version-specific asset CDN path (e.g. `https://{instance}/domoapps/{versionId}/`). An absolute `/assets/...` path resolves to the Domo root, not the app's asset directory — the CDN returns 403 because that path is not within the app's allowed scope.

With `base: './'`, all asset references are relative (`./index.js`, `./index.css`), which resolve correctly within the iframe context regardless of which CDN path Domo assigns to the version.

**`inlineDynamicImports: true`** (in `rollupOptions.output`) ensures all JS is bundled into a single `index.js` file. This eliminates any residual chunk paths entirely — there are no secondary JS files for the CDN to fail to serve. In `build.lib` mode with `formats: ['iife']`, dynamic imports are already inlined by default because IIFE is a single-file format.

**Safe defaults for every React/Vite Domo app:**
- `base: './'` — relative asset paths, always
- `build.lib.formats: ['iife']` — single self-contained bundle
- `build.outDir: '.'` — assets at project root, not `dist/`

_Validated live on domo-alex-dengate.domo.com 2026-06-08._
