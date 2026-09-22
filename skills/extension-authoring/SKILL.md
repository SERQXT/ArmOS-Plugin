---
name: extension-authoring
tier: t1
routing_group: armos-self
status: draft
visibility: anyone
userInvocable: true
version: "1.0.0"
description: >-
  Build, edit, and rebuild a ArmOS extension from chat — its React UI AND its declared
  capabilities. Use whenever the user asks to CREATE a new extension ("build me an extension
  that…"), change how one of THEIR extensions looks or behaves, or wire it to data/skills/tools
  (e.g. "add a Domo dataset query", "make the header blue", "pull the customer's Gong calls").
  Resolves or scaffolds the extension, declares capabilities in the manifest, edits the React
  source against the SDK, rebuilds, and tells the user to refresh.
---

# extension-authoring

You build and shape ArmOS extensions by talking to the user — the same loop used to build
Meeting Tracker. You can **create** a new extension, edit its **manifest** (what it can do), and
edit its React **source** (how it looks), then rebuild. Use the `mcp__extension-authoring__*`
tools; never guess file paths or use the generic file tools (the extension lives outside your
workspace and is only reachable through these tools).

## Choosing what to do

- **"Build/make me a new extension…"** → it doesn't exist yet: `create_extension` (scaffolds a
  working starter + builds it), then wire it up (manifest + source below).
- **"Change how my [X] extension looks/behaves"** → edit the existing one: resolve it, read, edit
  `src/`, rebuild.
- **"Make my extension DO something"** (query a dataset, run a skill, create Asana tasks, use the
  customer's calls) → that's a **capability**: declare it in the manifest (`write_manifest`),
  then add the UI in `src/`. Call `list_capabilities` first to see the real in-process MCPs /
  connectors you can grant. It returns MCPs + connectors in full but skills as **names only** — to
  pick a skill for an action, call `list_capabilities({ query: "<keyword>" })` (e.g. `"gong"`,
  `"asana"`) to get the matching skills with descriptions. Don't expect the whole skill catalog at
  once — it's ~200 skills, so always narrow with a keyword.

## Workflow

1. **Resolve the extension.** Call `list_extensions` and match the user's wording to a
   `name`/`description` ("my Deal Notes extension" -> id `deal-notes`). If two plausibly
   match, ask which one. Never assume an id you haven't seen from `list_extensions`.
2. **Read before you edit.** `list_extension_sources(extId)` to see the files, then
   `read_extension_source(extId, path)` for the ones you'll change (usually `main.tsx`,
   sometimes `styles.css` or a component). Edit the CURRENT contents — don't rewrite from
   memory.
3. **Edit against the SDK contract.** The entry is `src/main.tsx` and MUST end with
   `mountExtension(App)`. Import everything extension-specific from `@armos/extension-ui`:
   - `mountExtension(App)` — boots the app in the sandbox.
   - `useExtensionData()` -> `{ kvGet, kvSet, queryDocs, createDoc, updateDoc, deleteDoc, setCollection, getDataConfig, queryDataset, listDomoInstances, listDatasets, listAccounts, runAction }`
     — the extension's datastore + Domo reads + action invocation (all async).
   - `useExtensionSession()` -> `{ customerSlug, projectSlug }` ONLY. It does NOT provide `kv`, `runAction`, or `loading` — never destructure those from it (that's the #1 "t is not a function" cause).

   **Running an action from the UI.** To invoke a declared `contributes.actions` entry, call
   `const result = await useExtensionData().runAction("<action-id>", input?, { onProgress })`. It runs the
   action as a scoped subagent and **RETURNS the action's output** — the parsed object for
   `output: "json"`, the text for `output: "text"`. Render `result` directly; do NOT expect the action to
   write into `kv`/state for you (it doesn't — its return value IS the data). `onProgress(chunk)` streams
   partial output; writes still surface the host confirmation modal automatically. This is the
   recommended way a view invokes an action; the underlying transport is `bridge.stream({ url:
   "/extensions/<extId>/actions/<id>", method: "post", data: { input } }, onEvent)` (what the recipes
   use), and `runAction` is a thin wrapper over it. Either works — but `runAction` is NOT on
   `useExtensionSession` (that hook is only `{ customerSlug, projectSlug }`), and there is no direct MCP access.

   **Writing/reading AppDB documents.** `createDoc(content)` / `queryDocs(filter)` / `updateDoc(id, patch)` /
   `deleteDoc(id)` read and write the extension's Domo **AppDB** document store. **Binding matters:** if
   the extension has no bound collection, the store SILENTLY auto-creates its own — so a write "succeeds"
   but lands in a phantom collection, not the one the user meant. To target a specific collection (e.g. one
   the user pastes), call `await useExtensionData().setCollection(linkOrId)` FIRST (accepts an AppDB link
   `…/appDb/<id>/…` or a bare id; the host validates it exists and persists the binding), then
   `createDoc`/`queryDocs` operate on that collection. `getDataConfig()` returns the current binding
   (`{ collectionId, instance }`). For a user-configurable collection, also declare
   `contributes.settings: { properties: { collectionId: { type: "string", scope: "install" } } }` in the
   manifest (the Meeting Tracker pattern).
   - `useExtensionSession()` -> `{ customerSlug, projectSlug }` — the active context.
   - `useTheme()` -> `'light' | 'dark'`.
   Style with Tailwind utility classes (v4); `dark:` variants work. React is available.
   You may add new files under `src/` (e.g. `components/Header.tsx`) and import them.

   **Reading Domo data.** To show data from a Domo dataset, use
   `const { rows } = await useExtensionData().queryDataset(datasetId, sql?, opts?)`. `sql`
   defaults to `SELECT * FROM table LIMIT 2000` (the dataset is aliased as `table`);
   pass your own read-only `SELECT`/`WITH` for specific columns or filters. To target a
   specific instance, pass `{ instance: slug }` (a slug from
   `useExtensionData().listDomoInstances()`, which returns the instances the user has a
   Ryuu session for as `{ slug, host }[]`) — otherwise the host resolves the instance.
   `rows` is an array of `{ column: value }` objects — render it directly. Access is
   governed by the signed-in user's own Domo permissions, and NOTHING is stored — the
   data is queried live each time. **Never fetch Domo any other way** — no `fetch('/data/v1/…')`, no
   `https://<instance>.domo.com/…`, no hardcoded tokens. The UI runs in a sandbox with an
   opaque origin and no token, so direct calls are blocked by CORS; `queryDataset` is the
   only path, and the host holds the token. If the user names a dataset by URL, extract the
   dataset GUID and pass it as `datasetId`.
4. **Write.** One `write_extension_source(extId, path, content)` per file, with the FULL
   new contents. `content` MUST be the **raw file text exactly as it should appear on disk**
   — plain TSX/TS/CSS. Do NOT `JSON.stringify` it, escape it, or wrap it (e.g. as
   `[{"text": "…"}]`); the server writes it byte-for-byte, so an escaped payload lands as a
   broken JSON literal instead of code. Do NOT bypass this tool by writing to disk another
   way — that just moves the same mistake. The server backs up the previous version
   automatically — don't ask permission to overwrite or manage backups yourself. After each
   write, **read the file back** with `read_extension_source` and confirm it's real source
   (starts with your `import`/code, not a `"` or `[{`); if it looks escaped, rewrite it raw.
5. **Rebuild.** Call `build_extension(extId)`. On success, tell the user the change is
   built and to **refresh** it — either the extension's view inside ArmOS, or the
   standalone preview at `/preview/<extId>` if they have it open. On failure, the error is
   the verbatim esbuild/Tailwind message: read it, fix the source, and rebuild. Don't claim
   success until `build_extension` returns ok.

## Creating a new extension

`create_extension({ id, name, description?, icon?, instance? })` scaffolds a working sandboxed-UI
extension (manifest + `src/main.tsx` demo + Tailwind), auto-enables it, and builds it. `id` is
kebab-case and unique. After it returns, wire the real behavior: `list_capabilities` → `write_manifest`
to declare what it needs → edit `src/` → `build_extension` → tell the user to refresh.

## Declaring capabilities (the manifest)

The manifest (`extension.json`) is what the extension can DO. Read it with `read_manifest`, write it
with `write_manifest` (the server VALIDATES it and rejects an invalid one — so you can't brick the
extension — and backs up the prior version). Send raw manifest JSON (same anti-escaping rule as
source). Call `list_capabilities` FIRST so you declare real, live names — MCPs and connectors come
back in full; for a skill's description narrow with `list_capabilities({ query: "<keyword>" })`.

**CRITICAL: every capability goes UNDER the `contributes` object** — `views`, `actions`, `skills`,
`tools`, `connections`, `data`, `settings`. Putting any of them at the top level is the most common
mistake: unknown top-level keys are silently stripped, so the extension loads with NO view and shows
up greyed-out/unclickable. Start from the scaffold's manifest (already has a valid `contributes`) and
ADD to it. A complete, correct example:

```json
{
  "manifestVersion": 1,
  "id": "account-pulse",
  "name": "Account Pulse",
  "version": "0.1.0",
  "icon": "HeartPulse",
  "contributes": {
    "views": [
      { "id": "main", "title": "Account Pulse", "icon": "HeartPulse",
        "placement": "sidebar-main-view", "runtime": "sandbox", "entry": "ui/index.html" }
    ],
    "skills": [
      { "ref": "account-360" }
    ],
    "actions": [
      { "id": "generate-brief", "title": "Generate Account Health Brief",
        "skill": { "ref": "account-360" }, "output": "text",
        "requires": { "inProcessMcps": ["compass-memory", "domo-read"] } },
      { "id": "send-email", "title": "Send via Outlook",
        "prompt": "Send the email in INPUT via the ms-365 mail tool.", "output": "text",
        "confirm": true, "requires": { "connections": ["ms-365"] } }
    ],
    "tools": [
      { "id": "ms365", "ref": "ms-365", "injection": "inline", "requires": { "connection": "ms-365" } }
    ],
    "connections": [
      { "id": "asana-oauth", "access": "write" },
      { "id": "ms-365", "access": "write" }
    ],
    "data": { "kv": { "scoped": true } }
  }
}
```

Field notes (don't invent field names — match these exactly):

- **views** — the sandbox UI surface(s). Each needs `id`, `title`, `placement`
  (`"sidebar-main-view"`), `runtime: "sandbox"`, and `entry: "ui/index.html"`. A scaffolded
  extension already has a valid one — keep it.
- **skills** — OPTIONAL for catalog skills. An action's `skill.ref` resolves against ArmOS's
  live catalog directly, so you do NOT need to also list a `{ ref }` here — naming it in the action
  is enough. (Listing it is harmless.) Only use `contributes.skills` for a **bespoke** skill bundled
  inside the package by `path` — but **authoring bespoke skills isn't supported yet** (the write
  tools are confined to `src/`, so a skill file can't be placed where the runner looks). So for now:
  **always reference an existing catalog skill by `ref`; never invent a bespoke `path` skill.** Use
  `list_capabilities({ query })` to find a real skill.
- **actions** — an agentic button. It runs EITHER a live ArmOS skill by ref OR an inline prompt as a scoped subagent: `{ id, title, skill: { ref }, output, requires }` **or** `{ id, title, prompt: "…", output, requires }` (exactly one of `skill.ref` / `prompt`). Use `skill.ref` (from `list_capabilities`) for real domain skills; use `prompt` for a simple one-off that doesn't warrant a SKILL.md — especially a **connector write**, e.g. `prompt: "Send the email in INPUT via the ms-365 mail tool"`. Grant reads via `requires.inProcessMcps` (`compass-memory` for memory/Gong, `project-files`, `domo-read`) — NOT a top-level `grants` field. **Pick `output` to match what it returns:** `"text"` for narrative/brief/summary (most PS skills, e.g. `account-360`) — raw prose comes back untouched; `"json"` ONLY for a structured object. Getting this wrong is the "action output was not valid JSON" error. Default is `json`, so narrative/prose actions MUST set `"text"` explicitly.
- **connections** — external systems. A WRITE needs `contributes.connections: [{ id, access: 'write' }]` (e.g. `asana-oauth`) and the user is prompted to confirm before the write runs; read-only stays `access: 'read'`. Use `connections`, not a `write: true` flag on the action. To actually get the connector's TOOLS into an action, ALSO declare `contributes.tools: [{ id, ref: '<connector>', injection: 'inline', requires: { connection: '<connector>' } }]` — **`injection: 'inline'` is required for a `ref`-based connector tool** (the default `'discovery'` expects a bundled `config` and silently skips a ref-only tool → the action runs with no tool and dies at maxTurns 1).
- **data** — `{ kv: { scoped: true } }` for the extension's own key-value store.

Only declare what the user's request needs; keep the rest of the manifest intact. After
`write_manifest`, `read_manifest` and confirm your capabilities are nested under `contributes`.


## Recipes (map the request → capabilities)

- **"Select a Domo instance → dataset → query N rows"** → reads need NO manifest change. Build an
  instance picker from `const list = await useExtensionData().listDomoInstances()` (returns
  `{ slug, host }[]` — the instances the user has a Ryuu session for; **never ask the user to type a
  slug or paste a token** — the host holds the token). Then build a **dataset picker** from
  `const ds = await useExtensionData().listDatasets({ instance: slug, query })` (returns
  `{ id, name, rows, columns, owner, updatedAt }[]`; `query` is an optional name filter) — **never ask
  the user to paste a dataset ID**; list them. Finally query the chosen dataset with
  `useExtensionData().queryDataset(datasetId, sql, { instance: slug })`. Omit `{ instance }` to let the
  host resolve it (customer workspace / sole session). (For a skill/action that reads Domo inside a
  subagent instead, grant `domo-read` on the action.)
- **"Use the customer's Gong calls / memory"** → an action with `requires.inProcessMcps: ['compass-memory']` whose skill calls `transcript_search` / `memory_recall`. Gong `transcript_search` needs the Salesforce **account_id** — resolve it in the UI with `useExtensionData().listAccounts(query)` (returns `{ slug, name, sfdcAccountId }[]`), let the user pick, and pass `{ customerSlug, account_id }` in the action's `input` so the skill has it up front. **Actions run headless (one-shot, no user turn)** — never design one to ask the user a follow-up; give it everything via `input`.
- **"Create Asana tasks / a project plan"** → an action whose `skill.ref` is a **live catalog
  skill** that performs the write, plus `requires.connections: ['asana-oauth']` and
  `contributes.connections: [{ id: 'asana-oauth', access: 'write' }]`; the host confirms the write
  before it runs. Find the skill with `list_capabilities({ query: 'asana' })` — if none fits, the
  write leg can't be wired yet (bespoke skills aren't authorable; don't invent a `path` skill).

## Safety / boundaries

- Edit UI code under `src/`, and change the manifest only via `write_manifest` (validated) — never
  hand-edit the generated `ui/` bundle, and don't write `extension.json` as a `src/` source file.
- Keep edits minimal and scoped to what the user asked; preserve the rest of the file.
- After a successful build, briefly report which files you changed.
- If `list_extensions` shows the target is a built-in (`trust: first-party`) and the write
  fails as not editable, tell the user built-ins can't be edited in this build.
