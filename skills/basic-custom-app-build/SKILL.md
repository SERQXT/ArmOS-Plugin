---
name: basic-custom-app-build
tier: 0
description: "Orchestrates a new Domo custom app build from scratch — sequences manifest, data access, storage, toolkit, feature skills, performance, and publish phases. Trigger with 'build domo app', 'custom app build', 'new domo app', 'app build playbook'."
maturity: beta
deprecated: true
deprecation_note: "Superseded by procode-app-build (T2) in the v2 rebuild. Use procode-app-decide (T1) + procode-app-build (T2) instead."
audience: [code]
---

# Domo Basic App Build Playbook

## When to use

- Use at project kickoff for a brand-new Domo custom app.
- Use when taking over an existing app and normalizing it to platform best practices.

## Progress checklist

Copy this checklist and update it as you work

```
Build Progress:
- [ ] Phase 0: Rules loaded
- [ ] Phase 1: Manifest & contracts
- [ ] Phase 2: App shell (domo.js)
- [ ] Phase 3: Data access
- [ ] Phase 4: App storage (if needed)
- [ ] Phase 5: Toolkit clients (if needed)
- [ ] Phase 6: Feature skills (AI / Code Engine / Workflow — as needed)
- [ ] Phase 7: Performance review
- [ ] Phase 8: Build & publish
- [ ] Phase 9: Verification
```

## Phase 0 — Load rules (always-on)

Apply before writing any code:

- `rules/core-custom-apps-rule.md`
- `rules/custom-app-gotchas.md`

## Phase 1 — Manifest & contracts

Use `manifest`.

Define all external resource mappings first — datasets, collections, workflows, Code Engine packages. Everything else depends on this.
Use alias-safe names only (`^[A-Za-z][A-Za-z0-9]*$`), no spaces or special characters.

In addition to creation of the manifest.json, check root folder for an existing thumbnail.png to copy into the public folder of the new app.

**Existing-app takeover?** Audit the current `manifest.json` against actual code usage before changing anything.

## Phase 2 — App shell

Use `domo-js`.

Set up the baseline: `ryuu.js` import, navigation via `domo.navigate()`, event listeners, environment info.

**Advanced users using DA CLI?** Ask the agent to also use `da-cli` for scaffolding and manifest instance workflows. Should not be used unless user explicitly asks agent to use it.

## Phase 3 — Data access (if domo datasets need to be queried)

Use `dataset-query` (primary) and `data-api` (routing overview).

Build queries with `@domoinc/query`. Use the Query API for all dataset reads — it respects page filters and does server-side aggregation.

Before writing UI/data-mapping logic, fetch the real schema for every dataset in `manifest.json datasetsMapping` and create an explicit field map (date field, primary metric(s), dimension fields). Do not rely on guessed names like `sales`, `category`, or `order date` unless confirmed in schema.

If required fields are missing for the requested visualization, fail fast with a clear mapping error instead of rendering zeros.

**Need raw SQL?** Use `sql-query`, but know that SQL ignores page filters.

## Phase 4 — App storage (if appdb , or any user data entry is needed)

Use `appdb` and `appdb-collection-create` when storage must be created.

Skip if the app only reads datasets. Use AppDB when you need to persist app-specific state, user preferences, or document-style data.

If required collections do not exist yet, run `appdb-collection-create` first to provision datastore+collection before wiring document CRUD.

## Phase 5 — Toolkit clients (if appdb, domo workflows, or domo sql query is needed)

Use `toolkit`.

Move to typed `@domoinc/toolkit` clients where they add value (structured responses, type safety). Not required for simple apps.

## Phase 6 — Feature skills (as needed)

Only load the skills your app actually requires (3 examples are listed here but you have access to many more skills):


| Feature needed                                 | Skill                                                       |
| ---------------------------------------------- | ----------------------------------------------------------- |
| AI text generation or text-to-SQL              | `ai-service-layer`                                          |
| Server-side functions (secrets, external APIs) | `code-engine` + `code-engine-create` + `code-engine-update` |
| Triggering automation workflows                | `workflow`                                                  |


**Decision guide:** If the user hasn't mentioned AI, Code Engine, or Workflows, skip this phase entirely. Don't add complexity the app doesn't need.

**Non-optional trigger for server functions:** If app functionality requires server-side behavior (secrets, external API calls, privileged transformations), create or update a Code Engine package first, then sync `manifest.json packagesMapping`, and only then wire runtime invocation in app code.

## Phase 7 — Performance review

Use `performance`.

Review all queries before finalizing. Check for full-dataset fetches, missing aggregations, and unnecessary columns.

## Phase 8 — Build & publish

Use `publish`.

`npm run build` → `cd dist` → `domo publish`. On first publish, copy the generated `id` back to your source manifest. If `domo publish` fails (auth, upload, etc.), fall back to `mcp__domo-publish__procode_publish` — it wraps the CLI with manifest validation and a direct-API fallback. Don't run `domo login` interactively (no TTY); use `authenticate_instance` if the target instance has no Ryuu session yet, and never edit files under `~/.config/configstore/ryuu/`.

## Phase 9 — Verification

After publishing, confirm:

- App loads without console errors in Domo
- All dataset aliases resolve (no 404s on data calls)
- AppDB collections are wired in the card UI (if used)
- Page filters propagate correctly (if app is embedded in a dashboard)
- Navigation uses `domo.navigate()`, not `<a href>`
- Thumbnail has been copied into public folder

## Build-time guardrails

- Client-side only: no SSR/server routes/server components.
- Use Vite `base: './'`.
- Prefer `HashRouter` unless rewrites are intentionally handled.
- Treat `domo.env.`* as convenience only; use verified identity for trust decisions.

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) — Riley Stahura's Domo AI skills collection.
