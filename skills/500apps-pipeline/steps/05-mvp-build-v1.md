# Stage G1 — MVP ProCode build v1

**Maps to pipeline stage:** G1 — **functional first** (may be clunky). This stage produces **two sibling deliverables** — see **`modules/engagement-context-app-template.md`** and **canonical ProCode path** **`template/engagement-context-app/`**. The **MVP1 app** does **not** contain the engagement context UI.

## Inputs

- Approved `spec/BUILD-SPEC.md` (F) — **must** list **engagement context app** (template) + **MVP1 app** separately; layout (**stacked page** vs **App Studio Tab 1 / Tab 2**).
- `objective/NORTHSTAR.md` — MVP1 must **not contradict** agreed outcomes.
- `code/data/seeds.js` — seed data generated in stage E. The app **must** load and display this data on first paint.
- Optional: `spec/PROCESS-FLOW.md`, `artifacts/ENGAGEMENT-CONTEXT-COPY.md`.
- Target: **internal** instance **`domo-ps-repo.domo.com`** (or as specified in pipeline brief).

## Outputs

1. **Engagement context app** — deployed from org pre-built template (parameterize copy + branding only).
2. **MVP1 app** — deployed functional app per **`BUILD-SPEC.md`**.
3. `artifacts/MVP-V1-NOTES.md` — URLs/IDs for **both** apps; wiring; **built** vs **mock-teaser** inventory.
4. `artifacts/deploy-result.json` — definitive structured deploy data for ArmOS.

## Instructions

**Global output rules (see SKILL.md):**
- **No emojis** anywhere — use icon libraries (Lucide, Heroicons, Material Icons, inline SVG).
- **No stage codes** in human-visible text — use plain descriptions.

**File layout:** Write all app source under `code/` — structure: `code/index.html`, `code/app.js`, `code/components/`, `code/styles/`, `code/data/`, `code/services/`.

### Brand kit + visual design — read BEFORE writing code

Before writing ANY code, read these in order:

1. **`spec/BRAND-KIT.md`** (from stage F) — customer logo, color tokens, typography, CTA patterns, voice/microcopy, restraint rules. Generate `code/styles/tokens.js` from this. For the engagement context template, use the Domo design playbook palette instead (`modules/domo-design-playbook.md`).

2. **`modules/visual-design-standard.md`** — viewport-first design rules, CTA strength, dual-persona design, happy-path optimization, visual personality from BUILD-SPEC (Executive Scannable / Operational Dense / Analytical Storytelling / Bold Brand-Forward), component patterns, anti-patterns.

3. **`modules/domo-design-playbook.md`** — structural patterns (shadow system, border-radius scale, animation keyframes, easing curves, component architecture). Apply these to ALL apps regardless of brand. The playbook's full Domo palette applies only to the engagement context template.

4. **BUILD-SPEC viewport blueprints and 5-to-9 lift table** — know what "9/10" looks like for each surface before coding. Build to these targets.

The app must look like a **polished SaaS product** that belongs in Domo but was clearly designed for this customer — not a generic prototype.

---

### Skills to follow (MANDATORY — do not reinvent)

These skills are loaded in your context. **Read and follow them** — do not invent alternative approaches.

| Skill | What it covers | When to use |
|-------|---------------|-------------|
| **`procode-app-builder`** | SDK import (ryuu.js), manifest format, `React.createElement` pattern, publish flow, `procode_deploy_to_page` for placing apps on pages | Building and deploying both apps |
| **`dashboard-builder`** | Page creation, v2 layout with 60-unit grid (`layout_convert` + `layout_set`), card placement, stale artifact cleanup | Creating the page and positioning both app cards with proper layout |
| **`card-builder`** | Data wiring, chart types, beast modes, `card_create_full`, `card_preview` | If creating any data visualization cards alongside the apps |
| **`app-tester`** | Post-deploy verification, console log analysis, DOM assertions | Verifying the deployed app works |

**Key patterns from these skills:**

1. **App → Page wiring:** Use `procode_deploy_to_page` from `domo-publish` — it handles page creation (or reuse via `page_id`), app context creation, and card placement in one call. Do NOT manually create pages then manually wire cards.

2. **Dashboard layout (60-unit grid):** Follow `dashboard-builder` Step 7 — create a fresh page via `page_create`, place cards, then `layout_convert` → build COMPLETE layout payload → `layout_set` with all positions in one call. On Domo's 60-unit grid, **each full-row card (one card per horizontal row) must use `width: 60`**. Using `width: 40` for a lone card yields ~67% width and often breaks editability. **ProCode / app embed cards** need **`height` >= 28-56** (not chart-sized `h:20`). **Section headers:** **`width: 60`** and **`height` >= 5**. Follow **`dashboard-builder` Step 7** exactly.

3. **Run isolation (CRITICAL — do NOT collapse siblings):** `{account}` is the unique pipeline-run identifier (e.g. `Acme__Co__AbCd1234` or split siblings `Acme__Co__AbCd1234_2`, `_3`). **Each run MUST produce its own fresh page and fresh designs — NEVER reuse a page, card, or design from a different `{account}`**, even if the customer name is the same.
   - When searching for stale artifacts, scope the search to THIS run only: `procode_design_list(searchTerm: "500Apps|{account}|")` (trailing pipe forces exact-prefix match). Do the same with `page_list` — only pages whose title contains `|{account}|` belong to this run.
   - If you see a page/design whose title matches the customer but has a DIFFERENT `{account}` segment, it belongs to another run — DO NOT deploy to it, DO NOT clone it, DO NOT overwrite it.
   - The only reuse that is acceptable is within THIS exact `{account}` — e.g. a prior checkpoint of this same run already created a page for you.
   - After publishing, verify with `page_cards` — delete duplicates you created in THIS run. Track every ID in `deploy-result.json`.

4. **Data wiring to apps:** Follow `procode-app-builder` manifest patterns — `mapping` for datasets, `collections` with `id` fields for AppDB. Use `procode_generate_mock` for local preview if needed.

---

### Seed data — app MUST show data on first load

The `code/data/seeds.js` file from stage E provides `window.SEED_DATA`. The app **must** use this as its default data source — load via `<script>` tag before any components. Initial display must work from embedded seeds alone without depending on AppDB or dataset reads succeeding. AppDB is optional for mutable state (user actions like approve/reject).

### ProCode build rules (from `procode-app-builder`)

- **Domo SDK:** `<script src="https://unpkg.com/ryuu.js"></script>` — load BEFORE any app script.
- **`React.createElement` everywhere** — zero JSX. No `type="text/babel"`.
- **manifest.json:** Use `mapping` (not `datasetsMapping`), `collections` (not `collectionsMapping`), `fileName: "index.html"`.
- **Sandbox:** No `alert()`, `confirm()`, `prompt()` — blocked in Domo iframe.
- **Components:** IIFEs assigning to `window.*`; `app.js` reads from `window.*` — no import/export.

---

### Build order

1. **Engagement context app (first — MUST be a fresh clone, never reused):**
   - Clone template design `577df218-2be1-43bf-9b51-56abe8c679e1` on domo-squads **as a new design**. This produces a brand-new `design_id` UUID for THIS run.
   - **Do not deploy a previously-cloned context app to this page.** If you see a design_id in another run's `deploy-result.json` or `artifacts/MVP-V1-NOTES.md`, do NOT copy it into this run. Context apps are one-per-run so each customer's engagement story (copy, branding, survey answers) is isolated.
   - Inject copy from `spec/ENGAGEMENT-CONTEXT-COPY.md`. See `modules/engagement-context-app-template.md`.
   - Record the fresh UUID in `deploy-result.json` under `context_app.design_id`. The pipeline healer monitors for `context_app.design_id` values that appear across multiple accounts and will requeue this stage if it detects reuse.
2. **MVP1 app (second):** Follow `procode-app-builder` for all surfaces. Implement `mock-teaser` as clearly non-production.
3. **Wire the pair to a page and apply dashboard layout (MANDATORY — do these exact steps):**
   a. Create a FRESH page (do NOT pick an existing one): `page_create(title: "500Apps | {customer} | {app name} | {account}")`. The `{account}` suffix guarantees a unique page title even when the customer and app name repeat across sibling runs. Before calling `page_create`, run `page_list` filtered by the exact title; if a match exists AND its title contains this `{account}` (i.e. it was created in a prior checkpoint of THIS run), reuse it; otherwise create new.
   b. Place engagement context app card: `app_card_create(design_id: ..., page_id: ..., title: "Discovery Overview", fullpage: true)`
   c. Place MVP app card: `app_card_create(design_id: ..., page_id: ..., title: "{app name}", fullpage: true)`
   d. **Convert to dashboard layout:** `layout_convert(page_id: ...)` — this enables the grid system
   e. **Set positions (full-width rows, per `dashboard-builder`):** Both app cards **`width: 60`**. Headers **`width: 60, height: 5`**. Example: Context card `{x:0, y:5, w:60, h:28}`, MVP card `{x:0, y:38, w:60, h:36}`.
   f. **Verify layout:** `layout_get(page_id: ...)` — each full-row app card is **`width: 60`**; headers **`w:60, h>=5`**
   
   If `layout_convert` or `layout_set` fail, note the error in deploy-result.json but continue — the app still works.
4. **Share the page with the default group (MANDATORY):**
   - First, discover the default group: `group_list()` → find the group with `default: true` or name containing "Everyone" / "Default" (on `domo-ps-repo` this is group `1324037627`).
   - Then share: `page_share(page_id: <id>, group_id: "<discovered_id>")`.
   - This makes the discovery demo page visible to all internal users without manual sharing.
5. Record **version ids** for both apps for G2.

---

## Deploy verification (MANDATORY before checkpoint)

### Step 1: Deploy
Follow the `procode-app-builder` skill's Step 8a for the publish method.

**On ArmOS desktop (MUST use CLI):** Run `domo publish` from the app directory. If the CLI targets the wrong instance, run `domo logout -i {instance}.domo.com` then `domo login -i {instance}.domo.com` first. Do not use the `procode_publish` MCP tool on desktop.

**On the cloud worker (MUST use MCP — no CLI available):** Sync to S3 first, then use the MCP tool:
1. `aws s3 sync "{localDir}/code/" "s3://{bucket}/500apps/projects/{account}/code/" --region us-east-2`
2. `procode_publish(appDir: "s3://{bucket}/500apps/projects/{account}/code")` — the tool downloads from S3 automatically

**After publish (both environments):** Follow step 3 above for page creation and dashboard layout using `procode_deploy_to_page`.

### Step 2: Verify
1. `page_get` — returns 200 (not 404/401).
2. `page_cards` — exactly the expected cards, no duplicates.
3. `layout_get` — full-row app cards **`width: 60`**, headers **full width** or hidden.

### Step 3: QA the deployed app
Run the **`app-tester`** skill against the deployed page. Specifically:
1. Navigate to the page URL and verify both cards render (context app + MVP).
2. Check the MVP app shows seed data on first load — not blank or empty.
3. Check for console errors (`domo is not defined`, syntax errors, 404s on scripts).
4. Click through the primary surfaces — verify navigation, drawers/modals open, data displays.
If `app-tester` MCP tools are not available, do a manual trace: read the app code, verify the boot order, confirm seeds load before components.

### Step 4: Write `artifacts/deploy-result.json` (MANDATORY — exact structure below)

ArmOS reads this file to link to the deployed app. Use this EXACT JSON structure — do not rename fields, do not use arrays instead of objects, do not invent alternative formats.

```json
{
  "instance": "domo-ps-repo.domo.com",
  "page_url": "https://domo-ps-repo.domo.com/page/12345",
  "mvp_app": {
    "design_id": "uuid",
    "page_url": "https://domo-ps-repo.domo.com/page/12345",
    "card_id": "12345",
    "name": "500Apps|{customer}|{app name}|{account}",
    "version": "1.0.0"
  },
  "context_app": {
    "design_id": "uuid-or-null",
    "name": "500Apps|{customer}|Context|{account}",
    "version": "1.0.0"
  },
  "deployed_at": "ISO timestamp",
  "deploy_method": "domo publish CLI or procode_publish MCP"
}
```

**Required fields that ArmOS reads:**
- `page_url` (top level) — the Domo page URL with both apps
- `mvp_app.page_url` — same page URL (duplicated for backward compat)
- `mvp_app.design_id` — the MVP app's design UUID
- `instance` — the Domo instance name

Do NOT use `apps: [...]` array format. Use `mvp_app` and `context_app` as separate objects.

## Pre-checkpoint verification

| # | Check | If it fails |
|---|-------|-------------|
| 1 | Code in S3 (`code/index.html` exists) | Code wasn't synced |
| 2 | ryuu.js in index.html | "domo is not defined" in Domo |
| 3 | manifest.json uses `mapping` not `datasetsMapping` | App won't load data |
| 4 | `page_get` returns 200 | Deploy failed |
| 5 | deploy-result.json has `page_url` | ArmOS can't link |
| 6 | Instance matches pipeline brief | Wrong Domo instance |
| 7 | No emojis in code/ | Skill violation |
| 8 | Seed data renders on first paint | App appears broken |
| 9 | Dashboard layout per `dashboard-builder` (full-row `w:60`, headers `w:60` & `h>=5`) | Narrow/broken layout |
| 10 | No stale assets (no duplicate cards/pages) | Cluttered instance |
| 11 | Page shared with default group (`group_list` → find default → `page_share`) | Discovery demo not visible to the team |
| 12 | `context_app.design_id` is a fresh clone UUID (not copied from another run's deploy-result.json) | Context app reused — healer will flag and requeue |
| 13 | `mvp_app.design_id` does NOT appear in any sibling run's `deploy-result.json` (check `500apps/projects/{sibling_account}/artifacts/deploy-result.json` for any other account_key that shares the same customer slug prefix) | Cross-run design reuse — healer will flag and requeue |
| 14 | `page_url` / `page_id` does NOT match any sibling run's `page_url` / `page_id`. Each run MUST land on its own unique page. | Cross-run page collision — healer will flag and requeue |
| 15 | Page title contains the full `{account}` suffix (e.g. title matches `*\| {account}` at the end) | Title is ambiguous across siblings — rename the page |
| 16 | Brand kit applied — tokens in `code/styles/tokens.js` match `spec/BRAND-KIT.md` colors, CTA pattern correct, font correct | Generic/default styling instead of customer brand |
| 17 | Viewport blueprint met — for each built surface, hero metric and primary CTA visible at 1440x900 without scroll (per BUILD-SPEC) | User must scroll to find primary action |
| 18 | Happy-path walkthrough — trace the timed happy-path from BUILD-SPEC through the deployed app; document click count and friction | Primary workflow not achievable or takes too many steps |
| 19 | 5-to-9 progress note — in `artifacts/MVP-V1-NOTES.md`, note per surface where the build lands relative to BUILD-SPEC lift targets (MVP1 may be 6-7; document explicitly) | No assessment of build quality vs targets |

## Context-only regeneration mode (narrow resume)

If the resume reason in your checkpoint state starts with **`[CONTEXT_REGEN_ONLY]`**, you are in a **surgical context-app regeneration** — the MVP app is already deployed, the page exists, discovery artifacts are correct. Your job is to replace ONLY the engagement-context card on the existing page with a freshly cloned design.

**What you MUST NOT do in this mode:**

- Do NOT run stages B–F. Discovery, surface plan, sample data, build spec — all already exist in `artifacts/` and `spec/`.
- Do NOT rebuild or republish the MVP app. It is live on Domo already.
- Do NOT create a new page. Use the existing page (read `metadata.internal_app_url` on the pipeline row, or `page_url` in `artifacts/deploy-result.json`).
- Do NOT rewrite discovery artifacts (`DISCOVERY-HANDOFF.md`, `NORTHSTAR.md`, etc.).

**What you MUST do, in order:**

0. **Reconcile with the live page (repoint / repair scenarios):** The authoritative page is `metadata.internal_app_url` on the pipeline row. Extract its `page_id` (tail integer). Call `page_cards(page_id: <that id>)`.

   Reconcile when ANY of the following is true (this covers both operator-driven repoints via `queue-context-regen.mjs --target-page` AND cases where the MVP was published by a previous run but deploy-result.json was never written back):

   - `artifacts/deploy-result.json` `page_url` does NOT match `metadata.internal_app_url`, OR
   - `deploy-result.json.mvp_app` is missing / null, OR
   - `deploy-result.json.mvp_app.design_id` is null / missing, OR
   - `deploy-result.json.mvp_app.card_id` is null / missing.

   Reconciliation steps:
   - The live MVP card on the page is authoritative. Find the non-context card on the page (title matches the app, or whichever is NOT the existing Discovery Overview / Context card).
   - Overwrite `deploy-result.json` so `page_url`, `page_id`, and `mvp_app.page_url` all point to the live page. Set `mvp_app.design_id`, `mvp_app.card_id`, `mvp_app.name` from the live card.
   - Leave `context_app` in place for now — the next steps will replace it anyway.
   - Sync `deploy-result.json` to S3 before continuing.

1. **Read current state:**
   - `artifacts/deploy-result.json` — note `mvp_app.design_id`, `mvp_app.card_id`, `page_url` (preserve these after any Step 0 repoint).
   - `spec/ENGAGEMENT-CONTEXT-COPY.md` — if missing, generate it now from `artifacts/DISCOVERY-HANDOFF.md` + brief (this is the source copy for the context card).
   - Extract `page_id` from `page_url` (tail integer).

2. **Build context app from template** — Download the template source with `procode_source_download(designId: "577df218-2be1-43bf-9b51-56abe8c679e1", outputDir: "s3://{bucket}/500apps/projects/{account_key}/code-context/")`. Remove the `id` field from the downloaded manifest.json so the next publish creates a fresh design.

3. **Inject copy** — follow `modules/engagement-context-app-template.md`. Write updated files to `code-context/` (not `code/`, which holds the MVP). Sync to S3: `aws s3 sync "{localDir}/code-context/" "s3://{bucket}/500apps/projects/{account_key}/code-context/"`.

4. **Publish the fresh design** — on ArmOS desktop, run `domo publish` from `code-context/`. On the cloud worker, use `procode_publish(appDir: "s3://{bucket}/500apps/projects/{account_key}/code-context")`.

5. **Swap the card on the existing page:**
   a. `page_cards(page_id: <page_id>)` — find the current context card (title contains "Discovery Overview" / "Context" OR `design_id` matches the old context design_id in deploy-result.json).
   b. `card_delete(card_id: <old context card_id>)`.
   c. `app_card_create(design_id: "<fresh design_id>", page_id: <page_id>, title: "Discovery Overview", fullpage: true)` — record the returned `card_id`.
   d. `layout_get(page_id: <page_id>)` → overwrite the entry for the old context card with the new card_id (same x/y/w/h). `layout_set` with the updated payload. Keep MVP card entry untouched.
   e. `layout_get` to verify.

6. **Rewrite `artifacts/deploy-result.json`** — change ONLY `context_app.design_id`, `context_app.card_id`, `context_app.name`, `deployed_at`. Leave `mvp_app`, `page_url`, `instance` exactly as they were. Sync to S3.

7. **Update handoff URLs** — in `artifacts/DISCOVERY-HANDOFF.md`, if a URL/ID table mentions the old context design, replace with the fresh one. Sync to S3.

8. **Verify uniqueness** — the new `context_app.design_id` must not appear in any other account's `deploy-result.json`. (The healer will flag this automatically on its next tick, but double-check.)

9. **Skip the "Build order" steps 1-5 above** (MVP clone, MVP publish, page create, share) — they were already done in the original run.

10. **Skip pre-checkpoint checks 1-8 and 10-11** — only checks **9** (layout sanity) and **12** (fresh context UUID) apply here.

**Checkpoint for this mode** — emit both (so ArmOS shows the run as having resumed and completed):

```
@500apps-pipeline checkpoint=stage-g1 status=complete
@500apps-pipeline checkpoint=stage-h status=paused_checkpoint
```

Then stop. Do NOT proceed to G2 or beyond — the run is a surgical patch, not a full build.

---

## Page-reassign mode (narrow resume — fix cross-run page collisions)

If the resume reason in your checkpoint state starts with **`[PAGE_REASSIGN]`**, you are moving an already-deployed pair of cards (MVP + context) off a shared page onto a brand-new dedicated page. This mode exists to clean up runs that landed on another run's page because of the pre-fix "reuse existing pages" bug.

**What you MUST NOT do in this mode:**

- Do NOT run stages B–F. All discovery artifacts already exist.
- Do NOT rebuild, reclone, or republish the MVP app. Its design is already live — we're just re-cardding it onto a new page.
- Do NOT rewrite discovery artifacts.

**What you MUST do, in order:**

1. **Read current state:**
   - `artifacts/deploy-result.json` — note `mvp_app.design_id`, `mvp_app.card_id`, `page_url`, `page_id`, `context_app.design_id` (if any), `context_app.card_id` (if any).
   - These `card_id` values are on the OLD shared page and will be deleted at the end of this flow.

2. **Create a FRESH page:**
   - `page_create(title: "500Apps | {customer} | {app name} | {account}")` — the `{account}` suffix MUST be the full account_key (e.g. `Castle_Biosciences__Inc__3`). Record the returned `page_id`.

3. **Re-card the MVP onto the new page:**
   - `app_card_create(design_id: "<existing mvp_app.design_id>", page_id: <new page_id>, title: "{app name}", fullpage: true)` → record new `card_id`.

4. **Build a fresh context design** (context apps are per-run):
   - Download template: `procode_source_download(designId: "577df218-2be1-43bf-9b51-56abe8c679e1", outputDir: "s3://{bucket}/500apps/projects/{account}/code-context/")`. Remove the `id` field from the downloaded manifest.json.
   - Inject copy per the "Context-only regeneration mode" rules (read `spec/ENGAGEMENT-CONTEXT-COPY.md`, generate from `artifacts/DISCOVERY-HANDOFF.md` if missing). Write to `code-context/`, then publish: `domo publish` from `code-context/` (desktop) or `procode_publish` MCP (cloud worker).

5. **Add context card to the new page:**
   - `app_card_create(design_id: "<fresh context design_id>", page_id: <new page_id>, title: "Discovery Overview", fullpage: true)` → record `card_id`.

6. **Apply dashboard layout** (same rules as Build order step 3d-f): `layout_convert` → `layout_set` with context `{x:0, y:5, w:60, h:28}` and MVP `{x:0, y:38, w:60, h:36}` → `layout_get` to verify `w:60`.

7. **Share with the default group:** `group_list()` → default group → `page_share(page_id: <new>, group_id: <default>)`.

8. **Delete the OLD cards from the shared page** — THIS IS WHAT ACTUALLY FIXES THE COLLISION:
   - `card_delete(card_id: <old mvp_app.card_id>)`.
   - If `context_app.card_id` exists AND it is exclusive to this run (not reused by the page-owning run — verify by checking sibling `deploy-result.json` values), `card_delete(card_id: <old context_app.card_id>)`. If uncertain, leave the context card and just delete the MVP card.

9. **Rewrite `artifacts/deploy-result.json`:** set `page_id`, `page_url`, `mvp_app.page_url`, `mvp_app.card_id`, `context_app.design_id`, `context_app.card_id`, `deployed_at` to the NEW values. `mvp_app.design_id` is unchanged. Add `_reassigned_from: <old page_url>` for audit. Sync to S3.

10. **Update handoff** — in `artifacts/DISCOVERY-HANDOFF.md`, replace any old page URL/IDs with the new ones. Sync to S3.

11. **Skip pre-checkpoint checks 1-8 and 10** — only checks **9** (layout), **11** (page_share), **12** (fresh context UUID), **13** (no cross-run MVP design reuse — still passes because we reused only WITHIN this run), **14** (no cross-run page collision — this is the whole point), and **15** (title contains `{account}`) apply.

**Checkpoint for this mode** — emit both:

```
@500apps-pipeline checkpoint=stage-g1 status=complete
@500apps-pipeline checkpoint=stage-h status=paused_checkpoint
```

Then stop. Do NOT proceed to G2 or beyond.

---

## Checkpoint

Only emit after ALL checks pass:

```
@500apps-pipeline checkpoint=stage-g1 status=complete
```
