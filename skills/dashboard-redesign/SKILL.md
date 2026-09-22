---
name: dashboard-redesign
tier: t2
bucket: dashboard-work
description: "Full redesign workflow for an existing Domo dashboard page. Audits the current state card-by-card, enumerates ghost slots from prior deletions, presents a cleanup plan, requires explicit confirmation before any deletion, then rebuilds the cleaned page via dashboard-v2-build or app-studio-page-build."
status: draft
visibility: anyone
created_by: lane-A1
created_at: "2026-06-07T00:00:00Z"
input_contract: "Requires page identifier + redesign intent. Refuses when the page does not exist, when the user has not confirmed which cards to keep, or when ghost slots cannot be enumerated."
---

# dashboard-redesign

Full redesign symphony for an existing Domo page. Audits the current state, surfaces ghost slots from prior card deletions, presents a card-by-card cleanup plan for user approval, then rebuilds via the appropriate T2 sub-symphony.

## Steps

1. **Audit existing page.** Resolve the page name to a page ID via `page_list` if not already known. Pull all cards: `page_cards(page_id)` → list of card IDs; `card_bulk_definitions(card_ids)` → full card definitions (chart type, column mappings, filters, beast modes, title). For each card, record: card ID, title, chart type, dataset(s), grid position (x/y/w/h on v2 pages), and any rendering errors. Detect page type (v1 vs v2). **Enumerate ghost slots:** on v1 pages, pull the raw layout and identify positions with no corresponding card ID — record each ghost slot by x/y coordinate. Do not modify the page during this step. Audit only.

2. **Classify cards and present cleanup plan.** Classify every card as one of three categories: KEEP (clear business question, appropriate chart type, valid data, context present), REBUILD (right business question but wrong chart type, missing comparison context, bad aggregation, or anti-pattern design — specify the replacement), or DELETE (broken card with no data, redundant duplicate metric, no identifiable question, or irreparable anti-pattern). Ghost slots are always DELETE. Present the full classification table to the user in this format, then **stop and wait for explicit confirmation before proceeding**. Do not interpret silence as confirmation.

3. **Execute cleanup with confirmed permissions.** Only proceed after the user has confirmed the plan from Step 2. If the user modified the plan, re-present the updated plan and wait for a second confirmation. Handle ghost slots by page type: for v2 pages, delete REBUILD and DELETE cards via `card_delete`, then call `layout_set` to compact remaining KEEP cards (this removes ghost slots programmatically); for v1 pages, do NOT attempt to remove ghost slots via the API (the v1 positioning API does not support removal) — instead create a fresh v2 page and migrate only the KEEP cards. Execute in this order: (a) create beast modes referenced by KEEP cards on the target page if migrating; (b) delete REBUILD and DELETE cards; (c) confirm remaining cards match the approved KEEP list via `page_cards`.

4. **Rebuild via sub-symphony.** Dispatch to `dashboard-v2-build` for v2 card pages, or `app-studio-page-build` for App Studio output, passing: dataset IDs, audience tier, card count (KEEP + REBUILD replacements), and the existing or new page ID. Pass the KEEP card list as a constraint so the sub-symphony does not recreate cards already on the page.

5. **Verify and report.** After the sub-symphony completes: (a) call `page_cards` to confirm the final card count matches KEEP + REBUILD-replacement count; (b) call `card_render_check` on each rebuilt card to confirm no render errors; (c) on v2 pages, call `layout_get` and verify no zero-width/zero-height entries remain (ghost slot indicator); (d) produce the summary report listing cards kept, rebuilt, deleted, ghost slots cleared, and the final card ID table.

## Guardrails

- **Refuse to delete cards or slots without explicit user confirmation per-item or via an explicit `--allow-bulk-delete` flag.** Step 2 always stops for approval — never auto-delete.
- **Refuse to proceed if the page does not exist.** Call `page_list` to resolve the page name; stop and report if the page is not found.
- **Refuse to process a page when ghost slots cannot be enumerated.** On v1 pages without layout data, stop and inform the user that ghost slot positions cannot be safely determined.
- **Never compact v1 ghost slots in place.** v1 pages have no programmatic positioning API — attempting to remove ghost slots via the layout API on a v1 page corrupts the layout. Always migrate to a fresh v2 page instead.
- **Do not carry REBUILD cards to the new page.** A REBUILD card must be deleted and replaced, not copied — copying a broken card with a new chart type is not a rebuild.

## Success criteria

- Every card on the original page is classified as KEEP, REBUILD, or DELETE before any mutation occurs.
- Ghost slots are enumerated and listed in the cleanup plan presented to the user.
- User has provided explicit confirmation of the cleanup plan before Step 3 begins.
- All DELETE and REBUILD cards are removed from the page (confirmed via `page_cards` after deletion).
- Ghost slots are cleared: zero zero-width/zero-height entries in `layout_get` output on v2 pages, or a fresh page with no ghost positions for v1 migrations.
- All REBUILD replacements and new cards pass `card_render_check` with no errors.
- Final card count matches KEEP + REBUILD-replacement count from the approved plan.

## Dependencies

- **`dashboard-v2-build`** — T2 sub-symphony for the rebuild phase on v2 card pages.
- **`app-studio-page-build`** — T2 sub-symphony for the rebuild phase when output type is App Studio.
- **MCP tools:** `page_list`, `page_cards`, `card_bulk_definitions`, `card_metadata`, `card_delete`, `card_render_check`, `layout_get`, `layout_convert`, `layout_set`, `beast_mode_create`.
