---
name: app-studio-page-build
tier: t2
bucket: app-studio-work
input_contract: "Requires: page purpose, dataset ID(s), audience (exec/ops/embed), branding requirements (logo, color). Refuses when no dataset is provided for data-binding components, when the caller requests a Pro-Code Custom App (route to procode-app-build), or when required widget references are missing."
description: "Build an App Studio dataapp end-to-end: create the app, add embedded KPI/chart cards and rooster widgets, place them on the canvas (not just the appendix), and apply themes. Use this for any 'build an App Studio page' or 'build a dataapp on dataset X' request. NOT for Pro-Code Custom Apps — use procode-app-build for those."
composes:
  - app-studio-layout-builder
  - appstudio-filter-list
  - appstudio-list
  - appstudio-gallery
  - appstudio-action-button
status: draft
visibility: anyone
created_by: lane-R1
created_at: "2026-06-08T00:00:00Z"
---

# App Studio Page Build

> **App Studio dataapps vs Pro-Code Custom Apps — two different Domo products.** This skill builds **App Studio dataapps** (drag-drop dataapp containers with embedded cards, rooster widgets, layouts, themes — URLs like `/app-studio/{designId}/pages/{viewId}`). It does NOT build **Pro-Code Custom Apps** (HTML/JS/React bundle deploys — URLs like `/assetlibrary?designId={uuid}`). If the user wants a Pro-Code Custom App, route to `procode-app-build` instead. The two products use different CLI namespaces: App Studio uses `domo appstudio *` (all behind `--experimental`); Pro-Code uses `domo app *` + `domo app publish`. Confusing these two surfaces is the most common authoring mistake on this platform — see `## What this skill does NOT do` for routing details.

Deterministic build symphony for Domo App Studio dataapps. Assembles the correct combination of rooster components (widgets), embedded cards, and canvas layout into a publishable App Studio app with all cards rendered and filter wiring complete.

Dispatched from `dashboard-build` (T1). Composes four standalone T0 widget skills plus a card creation pipeline. Do not invoke directly unless the output type and input contract are already resolved.

## When to use

- "Build an App Studio dataapp from dataset X"
- "Create an App Studio page with a filter list and KPI cards"
- "I need a Domo dataapp with embedded charts and a rooster gallery"
- A build spec from `dashboard-build` (T1) has routed here with App Studio as the output type

## When NOT to use

- **Pro-Code Custom App** (HTML/JS/React bundle) → route to `procode-app-build`
- **Single KPI or chart card** → route to `card-kpi` (T1)
- **Layout-only refactor of an existing App Studio app without new data binding** → route to `app-studio-layout-builder` (T0, layout scaffold only)
- **v2 card page / dashboard** → route to `dashboard-v2-build`

## Data model

App Studio's data model separates card *ownership* from card *positioning*. Understanding this distinction prevents the most common build failure (cards added but invisible on canvas).

```
App (dataAppId / designId)
├── app-level: title, navOrientation, showNavigation, showTitle,
│              persistSettings, landingViewId, locked, enabled
├── theme (app-scoped): colors, fonts, cards[], buttons, navigation,
│                       chartColorPalette, components, tables, tabs.
│                       ONE theme per app — applies to all views.
├── navigations[]: sidebar/topbar items. entity=VIEW links viewId.
├── owners[], userAccess
└── views[] ← tab/page list
    └── view (viewId = pageId for all card/layout APIs)
        ├── title, viewOrder, visible, parentViewId
        └── layout (layoutId ≠ viewId — separate integer ID)
            ├── standard:  { width: 60, aspectRatio: 1.67, template: [...] }
            ├── compact:   { width: 12, aspectRatio: 1, template: [...] }
            ├── content[]: card pool — cards that "belong to" this view
            │   Each entry: { contentKey, cardId, cardUrn, type,
            │                 acceptFilters, hideTitle, hideFooter, hideBorder }
            │   Types: CARD, HEADER. PAGE_BREAK never appears here.
            └── template[]: canvas — where each contentKey is positioned
                Each entry: { type, contentKey, x, y, width, height,
                              virtual, virtualAppendix }
                Types: CARD, HEADER, SEPARATOR, PAGE_BREAK
                SEPARATOR/PAGE_BREAK: template-only (no content[] entry).
                virtualAppendix=true → in pool, NOT rendered on canvas.
```

**The "appendix" is not a separate section.** Cards newly added via any card creation or bulk-pages API land in `content[]` with `virtualAppendix: true` on their matching `template[]` entry. They are invisible until a layout PUT sets `virtualAppendix: false` and assigns real `{x, y, width, height}` coordinates.

**Theme scope**: App-level only. One theme object in `app.theme` applies across all views. No per-view override. The `appstudio_theme_apply` tool clears per-view style overrides before applying.

**Standard vs compact**: Two templates per view — standard (60-unit wide grid, desktop) and compact (12-unit wide grid, mobile). Both must contain all `contentKey` values present in `content[]`. Compact mirrors the standard layout intent at mobile dimensions. Required, not optional — desynced compact breaks mobile rendering silently (see gotcha PS-5).

For the full data model diagram, see `docs/rebuild/appstudio-deep-dive.md` §2.

## Substrate map

Each operation in this skill maps to exactly one substrate. The table below is the authoritative reference; do not improvise substrates.

| Operation | Substrate | Specific call |
|---|---|---|
| Create App Studio app | v1 MCP `domo-pages` | `appstudio_create` → returns `data_app_id` + first `view_page_id` |
| Get app body (views, theme, settings) | Go CLI | `domo appstudio get --experimental --id <designId> --json` |
| List apps | Go CLI | `domo appstudio list --experimental --json` |
| Update app metadata (full replace) | Go CLI | `domo appstudio update --experimental --id <designId> --file <body.json>` |
| Add a new view/page to existing app | v1 MCP `domo-pages` | `appstudio_page_add` |
| Get layout for a view | Go CLI | `domo appstudio view layout --experimental --view-id <viewId> --json` (requires Accept-Language + Referer — gotcha AU-1) |
| Set layout (writelock + PUT) | Raw API | `PUT /api/content/v4/pages/layouts/{layoutId}/writelock` → `PUT /api/content/v4/pages/layouts/{layoutId}` → `DELETE .../writelock`. Requires `Accept-Language: en` + `Referer` + `Authorization: Bearer` headers (gotcha AU-1). Use `appstudio_layout` MCP tool which wraps this correctly (gotcha AU-2). |
| Create embedded card (with pool registration) | v1 MCP `domo-pages` | `card_create_full` with `page_id = <viewId>` — the `?pageId=` param registers card in `content[]` automatically (Q2 verdict: Path A, no separate `appstudio_add_cards_to_page` needed). Card lands `virtualAppendix=true` until Step 7. |
| Add existing cards to page pool | v1 MCP `domo-pages` | `appstudio_add_cards_to_page` — use when cards already exist and need pool registration |
| Normalize card spec → AnalyzerCardUpdate payload | v2 MCP `domo-tools-v2` | `domo_card_payload_build` — normalizes `badge_*` aliases + role-based columns. NOT redundant with v1: different schemas. Translate output to v1 mapping-based input before calling `card_create_full`. |
| Validate beast mode formula | v2 MCP `domo-tools-v2` | `domo_beastmode_validate` |
| Create rooster widget (filter-list, list, gallery, action-button) | v1 MCP `domo-pages` | `rooster_card_create` |
| Bind rooster widget to dataset | v1 MCP `domo-pages` | `rooster_card_bind` |
| Configure page-level filters | v1 MCP `domo-pages` | `appstudio_filter_create` / `appstudio_filter_values` |
| Configure filter/interaction persistence | v1 MCP `domo-pages` | `appstudio_persist_settings` |
| Validate JSQL | v1 MCP `domo-pages` | `appstudio_jsql_parse` |
| List available themes | v1 MCP `domo-pages` | `appstudio_theme_list` — CLI broken (gotcha CG-1); always use MCP |
| Apply theme | v1 MCP `domo-pages` | `appstudio_theme_apply` — CLI `domo appstudio theme set` is unverified due to broken `theme list`; use MCP |
| Verify card renders | v1 MCP `domo-pages` | `card_render_check` — this is an MCP tool, not a CLI command. The CLI command "domo card render-check" does not exist (gotcha CG-3). |
| Reorder navigation | v1 MCP `domo-pages` | `appstudio_navigation_reorder` |
| Share app with users/groups | v1 MCP `domo-pages` | `appstudio_share` |

**CLI namespace rule**: All App Studio commands use `domo appstudio *`. The `domo app *` group manages Pro-Code Custom App designs (HTML bundles) — a completely different product (gotcha CG-4). Never mix the two.

## Steps

1. **Requirement clarification.**

Confirm before proceeding:

- Page purpose: reporting, data entry, workflow trigger, or mixed?
- Audience: exec (read-only, high-polish) / ops (interactive filters, forms) / embedded customer-facing (PDP filters, branding)?
- Dataset IDs: which datasets back the data-binding components? (Refusal trigger: no dataset provided for any filter-list, list, or gallery component.)
- Widget families needed: filter-list, list, gallery, action-button, embedded cards, structural regions (banner, header, tab)?
- Branding: primary color hex, logo file? (Note: logo upload has no CLI or MCP tool — flag as a manual post-build step.)
- Theme: named App Studio theme (e.g., "Clarion") or default?
- Layout: standard only, or does mobile (compact) matter to the audience?

Do not proceed to Step 2 until dataset IDs are confirmed for every data-binding component.

2. **Component selection.**

Select the widget set based on requirements. Map each user need to a substrate:

- **User-facing row-level filters** → `appstudio-filter-list` T0 (rooster FilterList widget, most failure-prone — follow the T0 spec exactly; DML must be JSON-encoded string, not object — gotcha PS-3)
- **Browsable entity list with thumbnails** → `appstudio-list` T0 (rooster List widget)
- **Image-grid browsing (catalog, portfolio)** → `appstudio-gallery` T0 (rooster Gallery widget)
- **Workflow trigger or row-level action** → `appstudio-action-button` T0 (rooster ActionButton widget)
- **KPI or chart card embedded in the page** → `card_create_full` (v1 MCP) with `domo_card_payload_build` (v2 MCP) for payload construction
- **Structural page regions** (banner, header, tab navigation, section dividers) → handled as SEPARATOR/HEADER types in the layout template (template-only items, no content[] entry — gotcha DM-3)

Record the selected component list and note which ones require dataset binding. This list drives Step 3's card-pool and template construction.

3. **Create the App Studio app shell.**

Call `appstudio_create` (v1 MCP `domo-pages`). The tool returns:
- `data_app_id` (the `designId` — used in all app-level API calls and the final URL)
- `view_page_id` (the first view's ID — used as `pageId` in all card/layout operations)

**Important**: do not pass `description: ""` — empty string description triggers a 400 validation error (gotcha PS-4). Omit the description field entirely when no description is provided.

Capture both IDs. Every subsequent step references these.

App URL shape (for handoff): `https://{instance}.domo.com/app-studio/{data_app_id}/pages/{view_page_id}`

4. **Build rooster widgets.**

For each selected rooster widget (filter-list, list, gallery, action-button):

1. Follow the corresponding T0 skill spec to create the rooster card:
   - Call `rooster_card_create` (v1 MCP `domo-pages`) — **not** the CLI command "domo rooster create" which does not exist (gotcha CG-2)
   - The DML body must be a JSON-encoded string, not a raw object (gotcha PS-3)
   - Include `subscriptions: []` in all rooster card POST bodies (gotcha PS-2); omitting it causes a 500
2. Bind the widget to its dataset via `rooster_card_bind` (v1 MCP `domo-pages`)
3. Call `appstudio_add_cards_to_page` with the rooster card ID and `view_page_id` to register it in the card pool — rooster cards are NOT automatically pool-registered by `rooster_card_create`

Build structural widgets (banner, header regions) first — they define the page frame before cards are positioned.

Create structural widgets in T0 order. Do not skip `rooster_card_bind` before attempting pool registration.

5. **Build embedded card payloads and create cards.**

For each KPI or chart card in the page spec:

1. **Payload construction**: call `domo_card_payload_build` (v2 MCP `domo-tools-v2`) with the structured card spec (chart type, columns with roles, beast modes). This tool normalizes `badge_*` aliases and role-based column specs into a well-formed AnalyzerCardUpdate payload.

2. **Schema validation**: if any beast mode formulas are present, call `domo_beastmode_validate` (v2 MCP `domo-tools-v2`) first to surface unresolved column references before creating the card.

3. **Translate payload**: the v2 `domo_card_payload_build` output uses a structured role-based schema. Translate it to the v1 mapping-based input format expected by `card_create_full`. These are different schemas — `domo_card_payload_build` is NOT redundant with `card_create_full` (Q1 verdict: v2 normalizes, v1 creates).

4. **Create card with pool registration**: call `card_create_full` (v1 MCP `domo-pages`) with `page_id = view_page_id`. The `?pageId=` query param auto-registers the card in the view's `content[]` (card pool). No separate `appstudio_add_cards_to_page` call is needed (Q2 verdict: Path A is sufficient).

5. Capture the returned `cardId` and `cardUrn` for each card. Record these for Step 7 (canvas placement).

After Step 5, all cards are in the card pool (`content[]`) but invisible on canvas (`virtualAppendix=true` on their template entry). Step 7 fixes this.

6. **Configure filters, forms, and persistence.**

Before placing cards on canvas, configure the filter wiring:

- **Page-level filters**: call `appstudio_filter_create` (v1 MCP `domo-pages`) for each column filter the page needs. Use `appstudio_filter_values` to inspect available values before creating.
- **Cross-filter mapping**: be explicit — do not leave filter connections at default (all cards). Map each filter to the specific cards it should control.
- **Persist settings**: if audience is ops or exec, call `appstudio_persist_settings` to configure which of filters/date/interactions/variables survive navigation. Do not skip for ops audiences — stateless filter behavior confuses users.
- **Forms**: if the page includes data-entry rows (FORM_MODAL pattern), configure via form MCP tools. No CLI equivalent.
- **JSQL validation**: if any computed filter logic uses JSQL, call `appstudio_jsql_parse` to validate before saving.

Document the filter → card mapping in the build context. The handoff report must include this mapping explicitly.

7. **Place cards on canvas — the writelock + virtualAppendix dance.**

This is the most failure-prone step. All 9 gotchas can bite here. Follow exactly.

**7a. Acquire layout state**

GET the current layout using `domo appstudio view layout --experimental --view-id <viewId> --json` (Go CLI) or the `appstudio_layout` MCP tool. The layout object contains:
- `standard.template[]` — current canvas state (60-unit wide grid)
- `compact.template[]` — mobile canvas state (12-unit wide grid)
- `content[]` — the card pool

**7b. Validate current state before modifying**

Before writing the layout:
- Remove orphan template items: any `{type: "CARD", cardId: null}` entries in `template[]` must be filtered out — they cause 400 on PUT (gotcha DM-4)
- Preserve SEPARATOR/PAGE_BREAK items: these are template-only structural items with no `content[]` entry. Keep them as-is with `virtual: true, virtualAppendix: true`. Never try to add them to `content[]` (gotcha DM-3)
- Identify all cards currently in `content[]` with `virtualAppendix: true` — these are the newly-added cards that need canvas placement

**7c. Compute positions**

For each card to place on canvas:
- Assign `{x, y, width, height}` coordinates on the 60-unit standard grid
- Preferred widths: 60 (full), 30 (half), 20 (third), 15 (quarter), 12 (fifth)
- Card height defaults: 30 standard / 6 compact; KPI strips: 6 standard / 6 compact; headers: 5 standard / 2 compact
- No item may overflow the right edge: `x + width ≤ 60`

**7d. Modify template entries**

For each card in `content[]` that needs canvas placement, update its matching `template[]` entry:
- Set `virtualAppendix: false`
- Set `virtual: false`
- Set `{x, y, width, height}` to the computed coordinates

**7e. Sync compact template (critical — gotcha PS-5)**

Every `contentKey` in `content[]` must appear in both `standard.template` and `compact.template`. After updating the standard template, sync the compact template:
- Each item: `x: 0`, `width: 12` (full compact width)
- Heights: CARD → 6, HEADER → 2, SEPARATOR → 1
- Stack items vertically (y of next = y + height of previous), same order as standard template

Skipping compact sync breaks mobile rendering silently — there is no error; the view simply shows blank on compact.

**7f. Write the layout**

Use the `appstudio_layout` MCP tool (v1 MCP `domo-pages`). Do not call the raw layout PUT endpoint directly — the `appstudio_layout` handler wraps the writelock acquire/release and injects the required `Accept-Language: en` and `Referer` headers automatically (gotchas AU-1, AU-2). If you bypass `appstudio_layout` and call the raw endpoint yourself, these headers must be present or the request will 4xx with no useful diagnostic.

The raw layout write sequence (for reference only — use MCP):
1. `PUT /api/content/v4/pages/layouts/{layoutId}/writelock` (acquire 60s exclusive lock)
2. `PUT /api/content/v4/pages/layouts/{layoutId}` with full layout body (headers: `Accept-Language: en`, `Referer: https://{instance}.domo.com`, `Authorization: Bearer {token}`)
3. `DELETE /api/content/v4/pages/layouts/{layoutId}/writelock` (release)

Never cache layout state across turns. The writelock lasts 60s; concurrent edits are silently lost (gotcha LC-1).

**7g. Verify canvas placement**

Re-GET the layout. Confirm:
- Every card from Step 5 has `virtualAppendix: false` in `template[]`
- Every card has valid `{x, y, width, height}` (no zero dimensions)
- Compact template has a matching entry for every card in `content[]`

If any card still has `virtualAppendix: true`, the layout PUT did not include that card's template entry — repeat Step 7d for the missing cards.

8. **Apply theme.**

1. Call `appstudio_theme_list` (v1 MCP `domo-pages`) to list available themes. **Do not use `domo appstudio theme list`** — the CLI command is broken in v0.13.0 (gotcha CG-1): the API returns `{saved, default}` object but the CLI expects a JSON array and crashes.

2. Match the requested theme name to a theme object from the list. If no theme was requested, skip and record "no theme applied" in the handoff report.

3. Call `appstudio_theme_apply` (v1 MCP `domo-pages`) with the theme object. The tool clears any per-view style overrides before applying — this is by design.

4. **Logo upload**: there is currently no MCP tool or CLI command for logo asset upload. If a logo was requested, flag this as a manual post-build step. The `iconDataFileId` field on the app body accepts a file ID from Domo's file upload API — record the requirement in the handoff report.

9. **Verify.**

Run the full verification battery before reporting success:

1. **Card pool**: call `domo page cards list --id <viewId>` (Go CLI) or `page_cards` (v1 MCP) — confirm all expected cards appear.
2. **Canvas placement**: re-GET layout, confirm every card has `virtualAppendix: false` and valid coordinates.
3. **Compact sync**: confirm compact template has one entry per content[] card.
4. **Card render check**: call `card_render_check` (v1 MCP `domo-pages`) for each embedded card — **not** the CLI command "domo card render-check" which does not exist (gotcha CG-3). Surface any render failures before declaring done.
5. **Filter wiring**: review the filter → card mapping; confirm no filter is left at default (all cards) unless intentional.
6. **App URL**: confirm `https://{instance}.domo.com/app-studio/{data_app_id}/pages/{view_page_id}` is accessible.

10. **Handoff.**

Deliver the handoff report:

```
## App Studio Build Report

**App:** [name]
**Instance:** [instance].domo.com
**Design ID (dataAppId):** [id]
**Landing View ID:** [viewId]
**App URL:** https://[instance].domo.com/app-studio/[designId]/pages/[viewId]

**Card inventory:**
| Card | Card ID | Card URN | Type | Dataset |
|------|---------|----------|------|---------|
| ...  |         |          |      |         |

**Widget inventory:**
| Widget | Card ID | Type | Dataset |
|--------|---------|------|---------|

**Filter wiring:**
| Filter | Column | Controls cards |
|--------|--------|----------------|

**Steps completed:**
- [x] Requirements confirmed
- [x] App shell created
- [x] Rooster widgets built + bound
- [x] Embedded cards created (pool-registered)
- [x] Filters + persistence configured
- [x] Canvas layout placed (virtualAppendix=false for all cards)
- [x] Compact template synced
- [x] Theme applied (or: skipped — [reason])
- [x] Verification passed (all cards render, filters functional)

**Manual follow-up (if any):**
- Logo upload: [if applicable, include iconDataFileId instructions]
- PDP filter setup: [if customer-facing embed]
```

## Guardrails

- **Refuse when no dataset is provided for data-binding components.** A filter-list, list, or gallery widget with no dataset binding will render empty and silently mislead users.
- **Refuse to call the layout PUT without acquiring the writelock first.** Raw layout writes without the writelock will conflict with concurrent Domo editor sessions. Use `appstudio_layout` MCP which handles the writelock automatically.
- **Refuse to finish the build with any card in `virtualAppendix=true`.** That means the card is in the pool but not on the canvas. Step 7 must complete to 100% before reporting done.
- **Refuse to skip compact template sync (gotcha PS-5).** Desynced compact template breaks mobile rendering silently — no error, just a blank view.
- **Refuse to send layout PUT without `Accept-Language: en` and `Referer` headers (gotcha AU-1).** The request will 4xx with no useful diagnostic. Use `appstudio_layout` MCP to avoid this entirely.
- **Refuse to use `domo app *` commands for App Studio work.** `domo app` manages Pro-Code Custom App designs (HTML bundles). For App Studio, use `domo appstudio *` exclusively (gotcha CG-4).
- **Never use the following CLI commands — they do not exist (gotcha CG-2, CG-3, CG-4):** "domo rooster create", "domo app create", "domo card render-check", "domo rooster preview", "domo app layout", "domo app asset upload". Use the MCP tools listed in the substrate map.
- **Refuse to attempt cross-instance work.** This skill targets one Domo instance per build. Cross-instance builds require separate authentication contexts; do not attempt to build cards on instance A and embed them in an app on instance B.

## Success criteria

- [ ] Every card listed in `content[]` (pool registered) on the target view
- [ ] Every card in `template[]` with `virtualAppendix: false` and valid non-zero `{x, y, width, height}`
- [ ] Compact template has one matching entry per `content[]` card, stacked in the same order
- [ ] App URL returns 200 in browser and renders the cards in the requested layout
- [ ] Theme applied (or explicitly skipped with reason recorded in handoff)
- [ ] All rooster widgets bound to their datasets and returning data
- [ ] Filter wiring verified: selecting a filter value updates all connected cards
- [ ] Handoff report delivered: design ID, view ID, card ID list, direct browser URL, filter map, and any pending manual steps

## Dependencies

- `dashboard-build` (T1) — typical dispatcher; resolves output type before routing here
- `appstudio-filter-list` (T0) — rooster FilterList widget; invoke for any user-facing filter component
- `appstudio-list` (T0) — rooster List widget with thumbnail + action per row
- `appstudio-gallery` (T0) — rooster Gallery image-grid widget
- `appstudio-action-button` (T0) — rooster ActionButton workflow trigger widget
- v1 MCP `domo-pages` — `appstudio_create`, `appstudio_layout`, `rooster_card_create`, `rooster_card_bind`, `appstudio_add_cards_to_page`, `appstudio_filter_create`, `appstudio_filter_values`, `appstudio_persist_settings`, `appstudio_theme_list`, `appstudio_theme_apply`, `card_create_full`, `card_render_check`
- v2 MCP `domo-tools-v2` — `domo_card_payload_build` (card payload normalization), `domo_beastmode_validate` (formula validation)
- Domo Go CLI — `domo appstudio get/list/update/view layout` (all `--experimental`)
- Raw API (via `appstudio_layout` MCP) — `/api/content/v4/pages/layouts/{id}` (writelock dance + required headers) and `/api/content/v1/dataapps/{designId}`

---

## App Studio data model in detail

### App (top level)

The app object (fetched via `domo appstudio get --experimental --id <designId> --json`) is the authoritative source for:
- `dataAppId` — the design ID, used in app-level API paths
- `title` — display name
- `navOrientation` — `SIDEBAR` or `TOPBAR`
- `showNavigation`, `showTitle` — visibility toggles
- `persistSettings` — object controlling which interactions survive page navigation: `{persistFilters, persistDate, persistInteractions, persistVariables}`
- `landingViewId` — which view loads first
- `locked` — exclusive edit protection (concurrent edit guard)
- `theme` — the single theme object for the entire app

### View (page)

Each entry in `app.views[]` is a view:
- `viewId` — this is the same ID used as `pageId` for all card and layout API calls
- `title` — tab/nav label
- `viewOrder` — sort order in navigation
- `visible` — whether the tab appears in the nav
- `parentViewId` — for nested view hierarchies

**viewId = pageId**: the view ID returned by `appstudio_create` and `appstudio_page_add` is the ID you pass as `page_id` to `card_create_full` and as `viewId` to layout operations. These are the same value.

### Layout (per-view)

The layout object (fetched via `domo appstudio view layout --experimental --view-id <viewId> --json`) contains:
- `layoutId` — an integer ID used in the raw layout write path (`PUT /api/content/v4/pages/layouts/{layoutId}`). **Not the same as viewId.**
- `standard` — the 60-unit wide desktop canvas
- `compact` — the 12-unit wide mobile canvas
- `content[]` — the card pool for this view
- The combined standard and compact template arrays

The `layoutId` is only needed for raw API calls. The `appstudio_layout` MCP tool accepts `viewId` and resolves `layoutId` internally.

### Card pool vs canvas: the core distinction

The card pool (`content[]`) answers: "which cards are associated with this view?"

The canvas (`standard.template[]` and `compact.template[]`) answers: "where is each card positioned on screen?"

Every card API call — `card_create_full?pageId=<viewId>`, `appstudio_add_cards_to_page`, or `PUT /api/content/v1/cards/bulk/pages` — affects the card pool only. None of them place the card on the canvas. The `virtualAppendix` flag bridges the two: `virtualAppendix: true` means "in pool, not on canvas." Step 7 of this skill is entirely about flipping that flag to `false` and assigning real coordinates.

### Theme scope

One theme applies to the entire app — there is no per-view theme override in the data model. The theme object contains sub-keys for `colors`, `fonts`, `cards[]`, `buttons`, `navigation`, `chartColorPalette`, `components`, `tables`, `tabs`. Applying a theme replaces the entire `app.theme` object.

Pro-code component cards (Custom App designs embedded in App Studio) render in iframes with their own CSS — the app theme does not propagate into them (gotcha DM-5).

---

## The writelock + virtualAppendix dance

The canvas-placement workflow involves three distinct operations that must happen in sequence within a single lock cycle.

### Why the writelock exists

The App Studio editor allows multiple users to edit the same app layout simultaneously. To prevent silent overwrites, the API uses a 60-second exclusive writelock. The lock must be acquired before any layout PUT, and released after. If you read the layout, hold it in context across a multi-turn conversation, and then write it, you will lose any changes made by other users (or by Domo's own editor) during that window (gotcha LC-1).

**Always read → modify → write in the same tool call sequence.** Never cache layout state across turns.

### Lock acquire

```
PUT /api/content/v4/pages/layouts/{layoutId}/writelock
Headers:
  Authorization: Bearer {token}
  Accept-Language: en
  Referer: https://{instance}.domo.com
Body: empty
Response: 200 OK (lock acquired)
Response: 409 Conflict (lock held by another session — wait 60s and retry once)
```

### Layout PUT body shape

```json
{
  "standard": {
    "width": 60,
    "aspectRatio": 1.67,
    "template": [
      {
        "type": "CARD",
        "contentKey": 2,
        "x": 0, "y": 0, "width": 30, "height": 30,
        "virtual": false,
        "virtualAppendix": false
      },
      {
        "type": "SEPARATOR",
        "contentKey": 0,
        "x": 0, "y": 30, "width": 60, "height": 3,
        "virtual": true,
        "virtualAppendix": true
      }
    ]
  },
  "compact": {
    "width": 12,
    "aspectRatio": 1,
    "template": [
      {
        "type": "CARD",
        "contentKey": 2,
        "x": 0, "y": 0, "width": 12, "height": 6,
        "virtual": false,
        "virtualAppendix": false
      },
      {
        "type": "SEPARATOR",
        "contentKey": 0,
        "x": 0, "y": 6, "width": 12, "height": 1,
        "virtual": true,
        "virtualAppendix": true
      }
    ]
  },
  "content": [
    {
      "contentKey": 2,
      "cardId": 12345,
      "cardUrn": "urn:...",
      "type": "CARD",
      "acceptFilters": true,
      "hideTitle": false,
      "hideFooter": false,
      "hideBorder": false
    }
  ]
}
```

Key rules for the PUT body:
- `content[]` must include every card in the pool — do not omit existing pool cards
- SEPARATOR/PAGE_BREAK items in `template[]` must NOT have entries in `content[]`
- Orphan template items `{type: "CARD", cardId: null}` must be removed before PUT
- Both `standard.template` and `compact.template` must be included in the same PUT

### Lock release

```
DELETE /api/content/v4/pages/layouts/{layoutId}/writelock
Headers: same as acquire
Response: 200 OK (lock released)
```

Release the lock even if the PUT failed — a held lock blocks all other users for up to 60s.

### Error recovery

- **409 on acquire**: another user has the lock. Wait 60 seconds and retry once. If still 409, surface the conflict and do not proceed.
- **400 on PUT**: usually orphan template items (gotcha DM-4) or missing required fields. Re-validate the template for null cardIds before retrying.
- **401 on PUT**: missing `Accept-Language: en` or `Referer` header (gotcha AU-1). Add both headers.
- **After any PUT failure**: always release the writelock before surfacing the error, or subsequent writes will be blocked.

---

## Compact template sync rules

### Why compact matters

The compact template (`width: 12`) drives the mobile view of every App Studio app. Domo does not auto-derive compact from standard at runtime — both must be explicitly set in the layout PUT body. A missing compact template or a compact template with fewer items than `content[]` causes a blank mobile view with no error.

### Sync algorithm

Given a finalized `standard.template`:

1. Take the items in the same order as `standard.template` (same `contentKey` order)
2. For each item, set: `x: 0`, `width: 12` (full compact width)
3. Assign heights by widget kind:
   - `CARD` → `height: 6`
   - `HEADER` → `height: 2`
   - `SEPARATOR` → `height: 1`
   - `PAGE_BREAK` → `height: 1`
4. Stack vertically: `y` of item N = sum of heights of items 0 through N-1
5. Preserve `virtual` and `virtualAppendix` flags matching the standard item

### The 60 → 12 ratio

The standard grid is 60 units wide; the compact grid is 12 units wide. The ratio is 5:1. When computing compact coordinates from standard: `compact_width = standard_width / 5`, but in practice all compact items use `width: 12` (full width) regardless of how wide they are in the standard template. Mobile layouts are always single-column.

### When compact is auto-derived (upstream context)

The `app-studio-layout-builder` T0 skill (payload emitter) states: "If you omit the compact array entirely, the system auto-derives it." This applies to the layout-builder skill's output payload. **When writing a layout PUT directly, both arrays are required.** Do not omit compact in a real PUT.

---

## CLI surface vs v1 MCP surface vs raw API

This table resolves the "why this substrate not that one" question for every operation.

| Operation | Substrate | Why NOT the alternative |
|---|---|---|
| App creation | v1 MCP `appstudio_create` | CLI `domo appstudio create` requires a full JSON body file on disk; MCP accepts structured params and returns `data_app_id` + `view_page_id` in one call |
| App GET | Go CLI `domo appstudio get` | Fastest way to dump the full app body including views[], theme, navigations[]; MCP equivalent is `appstudio_list` (list only, no full body) |
| Layout GET/SET | v1 MCP `appstudio_layout` | Raw API requires `Accept-Language + Referer` headers + manual writelock dance (gotchas AU-1/AU-2). MCP wraps all of this correctly. CLI `domo appstudio view layout update` acquires the writelock automatically but requires a full JSON body file on disk — harder to use dynamically. |
| Rooster card creation | v1 MCP `rooster_card_create` | No `domo rooster` command group exists in the Go CLI (gotcha CG-2). MCP is the only path. |
| Card creation with pool registration | v1 MCP `card_create_full?pageId=` | `domo card create` CLI does not support the `?pageId=` query parameter that triggers pool registration (Q2 verdict: MCP + pageId is Path A). |
| Theme list | v1 MCP `appstudio_theme_list` | CLI `domo appstudio theme list` crashes in v0.13.0 due to type mismatch (gotcha CG-1). MCP hits the same endpoint correctly. |
| Theme apply | v1 MCP `appstudio_theme_apply` | `domo appstudio theme set` CLI is unverifiable because `theme list` is broken; no known-good theme JSON to test with. MCP is verified path. |
| Page filters | v1 MCP `appstudio_filter_create` | No CLI equivalent for page-level filter creation on App Studio views. MCP only. |
| Persist settings | v1 MCP `appstudio_persist_settings` | No CLI equivalent. MCP only. |
| Card render check | v1 MCP `card_render_check` | The CLI command "domo card render-check" does not exist (gotcha CG-3). MCP only. |
| Card payload normalization | v2 MCP `domo_card_payload_build` | v1 `card_create_full` accepts mapping-based input; v2 normalizes role-based + badge_* aliases first. The two MCPs are not interchangeable — use v2 to build the spec, then translate to v1 input format. |

---

## Known gotchas

All 9 gotchas from `docs/rebuild/appstudio-deep-dive.md` §4, encoded here for inline reference.

### DM-1 — Card added to page but invisible on canvas

**Symptom**: card is "on the page" (appears in `domo page cards list`, in `content[]`) but does not show up in the live view.

**Root cause**: `PUT /api/content/v1/cards/bulk/pages`, `POST /api/content/v1/cards?pageId=`, and `appstudio_add_cards_to_page` all add the card to the card pool (`content[]`) with `virtualAppendix: true` on its matching template entry. The canvas (`standard.template[]`) is unaffected by pool operations.

**Fix**: Step 7 of this skill. Acquire the layout, find the card's template entry, set `virtualAppendix: false` and assign real `{x, y, width, height}` coordinates, sync compact, and PUT the layout.

### DM-2 — Page card list shows cards not visible on canvas

**Symptom**: `domo page cards list` returns a card, but it's not visible in the App Studio view.

**Root cause**: all cards in `content[]` appear in the page cards list regardless of their `virtualAppendix` state. The page cards list is a pool inventory, not a canvas inventory.

**Fix**: use layout GET to find which cards have `virtualAppendix: false` for the actual canvas inventory. The page cards list alone cannot tell you what's rendered.

### DM-3 — SEPARATOR/PAGE_BREAK in template causes layout PUT 400

**Symptom**: layout PUT fails with 400 after you add a SEPARATOR or PAGE_BREAK to `content[]`.

**Root cause**: SEPARATOR and PAGE_BREAK are template-only structural items. They have no `content[]` counterpart. The API validates this constraint.

**Fix**: never add SEPARATOR or PAGE_BREAK to `content[]`. Keep them in `template[]` only with `virtual: true, virtualAppendix: true`. Use contentKey values of 80+ for these items to avoid collisions with real card contentKeys.

### DM-4 — Orphan template items cause 400 on layout PUT

**Symptom**: layout PUT returns 400. Inspection reveals `{type: "CARD", cardId: null}` entries in `template[]`.

**Root cause**: when a card is deleted from Domo, the card pool entry is removed from `content[]` but the corresponding `template[]` entry remains as a ghost slot with `cardId: null`. The layout PUT API validates that all `CARD` type template entries have non-null `cardId` values.

**Fix**: before every layout PUT, filter out any `{type: "CARD", cardId: null}` entries from both `standard.template` and `compact.template`.

### DM-5 — Theme does not affect Pro-Code component appearance

**Symptom**: app theme is applied correctly, but Pro-Code cards (Custom App designs embedded in the App Studio view) retain their original CSS.

**Root cause**: Pro-Code cards render in iframes with their own CSS bundle. The App Studio theme is not injected into the iframe context.

**Fix**: to change Pro-Code card appearance, update and republish each Pro-Code design separately. Record this as a post-build manual step if the build includes Pro-Code cards.

### PS-1 — `PUT /cards/bulk/pages` returns 400 (field name)

**Symptom**: bulk card pool registration returns 400 with no clear field error.

**Root cause**: the field name is `destinationPageIds` (not `pageIds`). This is undocumented and was discovered empirically from radar recordings.

**Fix**: use `destinationPageIds: [viewId]` in the request body. The `appstudio_add_cards_to_page` MCP tool uses the correct field name internally.

### PS-2 — `rooster_card_create` returns 500 without subscriptions

**Symptom**: rooster card creation returns 500.

**Root cause**: the DML POST body must include `subscriptions: []` even for rooster cards. Omitting this field causes an internal server error.

**Fix**: include `subscriptions: []` in all rooster card POST bodies. The `rooster_card_create` MCP tool should handle this, but if calling the raw endpoint directly, always include it.

### PS-3 — `rooster_card_create` with object DML fails

**Symptom**: rooster card creation fails with a type/parse error.

**Root cause**: the API requires `metadata.dml` as a JSON-encoded string, not a raw object. Passing a JavaScript object as the `dml` value causes the API to reject the body.

**Fix**: `JSON.stringify(dmlObject)` before setting `metadata.dml`. The T0 widget skills (appstudio-filter-list etc.) handle this correctly — follow those specs exactly.

### PS-4 — `appstudio_create` fails with 400 on empty description

**Symptom**: app creation returns 400 when `description: ""` is passed.

**Root cause**: the App Studio create endpoint validates the `description` field and rejects empty strings.

**Fix**: omit the `description` field entirely when no description is provided. Do not pass `""`.

### PS-5 — Compact template out of sync — mobile renders blank

**Symptom**: the App Studio app renders correctly on desktop but shows a blank page on mobile (compact view).

**Root cause**: the compact template (`width: 12`) is missing entries for one or more cards in `content[]`. Every contentKey in `content[]` must appear in both `standard.template` and `compact.template`. There is no runtime error — the view simply renders blank.

**Fix**: always sync compact template after any standard template update. See `## Compact template sync rules` above. This is a required sub-step of every layout PUT.

### CG-1 — `domo appstudio theme list` crashes (CLI v0.13.0 bug)

**Symptom**: `domo appstudio theme list` exits with `json: cannot unmarshal object into Go value of type []map[string]interface{}`.

**Root cause**: the API returns `{"saved": null, "default": [...]}` (an object), but the CLI expects a JSON array. This is a CLI v0.13.0 bug — the endpoint itself works correctly.

**Fix**: use `appstudio_theme_list` (v1 MCP `domo-pages`) instead of the CLI. The MCP handles the response shape correctly. Do not attempt to work around the CLI crash.

### AU-1 — Layout read/write returns 401 with Bearer alone

**Symptom**: `GET` or `PUT` on `/api/content/v4/pages/*/layouts` returns 401 even with a valid Bearer token.

**Root cause**: this endpoint requires `Accept-Language: en` and `Referer: https://{instance}.domo.com` headers in addition to Bearer. The Bearer token from a Ryuu session is not sufficient for layout operations on some auth configurations.

**Fix**: add both headers to every layout request. The `appstudio_layout` MCP tool injects these headers automatically via the `layoutFetch()` wrapper — use the MCP tool to avoid this entirely.

### AU-2 — Do not bypass `layoutFetch()` for layout endpoints

**Symptom**: layout write returns unexpected errors when calling the endpoint directly with `domoJson()` or a generic HTTP client.

**Root cause**: `appstudio_layout` uses a specialized `layoutFetch()` wrapper (not the generic `domoJson()`) that ensures `Accept-Language` and `Referer` are always present.

**Fix**: route all layout operations through the `appstudio_layout` MCP tool. If you must use the raw API, use `layoutFetch()` or manually inject both required headers.

---

## What this skill does NOT do

- **Pro-Code Custom Apps** (HTML/JS/React bundle deploys, URLs like `/assetlibrary?designId=...`): route to `procode-app-build`. Pro-Code uses `domo app *` CLI + `domo app publish`, not `domo appstudio *`. These are completely different Domo products.
- **Single-card KPI or chart creation** without an App Studio container: route to `card-kpi` (T1).
- **Layout-only refactor of an existing App Studio app** (no new cards, no new data binding, just repositioning existing cards): route to `app-studio-layout-builder` (T0) — a layout scaffold tool that produces `standard` and `compact` template arrays from a grid description without creating any cards.
- **Domo v2 dashboard pages** (classic page layout with cards): route to `dashboard-v2-build`.
- **Cross-instance builds**: this skill targets one Domo instance per build. Multi-instance deploys are out of scope.
- **Logo upload**: no MCP tool or CLI command exists for App Studio logo asset upload. Record as a manual post-build step — the `iconDataFileId` field on the app body accepts a file ID from Domo's file upload API, but that upload path is not surfaced in this skill.
