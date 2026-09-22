# Stage DEMO — Capture Final Demo

**Stage code:** `stage-demo`  
**Checkpoint:** `@500apps-pipeline checkpoint=stage-demo status=complete`

## Purpose

Takes the **final production code** from a consultant (uploaded zip, ArmOS workspace, or S3 path), **anonymizes** all customer-specific references, **generates sample data** matching the app's dataset/AppDB needs, and **captures** a clean demo version to `domo-ps-repo.domo.com`. The result is a reusable reference app that any PS consultant can demo, fork, or study — without exposing customer identity or requiring their data.

This is distinct from deploying the app (which already happened during the pipeline). "Capture" means: take the finished, deployed app and create an anonymized, self-contained demo copy for the internal library.

This step can be triggered:
- **Automatically** at the end of a pipeline run (after Stage O delivery) when `auto_demo_publish: true`
- **From ArmOS desktop** via the "Capture Final Demo" button in the project bar (Deploy tab -> Steps)
- **Manually** when a consultant uploads final code via ArmOS ("here's the finished app, capture it as a demo")
- **On demand** via the cloud worker script (`scripts/publish-internal-demo.mjs`)

## Triggers

- "capture demo"
- "capture final demo"
- "capture final demo to psrepo"
- "publish demo"
- "publish final demo"
- Pipeline reaching post-delivery with `auto_demo_publish: true` in the brief
- Consultant upload via ArmOS UI "Capture Final Demo" action
- **ArmOS UI:** "Capture Final Demo" button in PipelineProjectBar (Deploy tab -> Steps section)

## How to invoke

### From ArmOS desktop (in a 500apps project)

The agent reads `code/` from the current project workspace and follows this step file using MCP tools directly. No scripts or CLI commands needed.

**Option A — UI button (recommended):** Click **"Capture Final Demo"** in the project bar's Deploy tab. Provide the customer name and industry in the modal. The agent runs the full flow: dry-run summary first, then executes on approval.

**Option B — Tell the agent directly:** In the chat, say:

> Capture final demo. Customer is "Cox Automotive", industry is automotive, use case is "marketing-catalog".

### From the cloud pipeline worker

The worker runs this step automatically after Stage O when `auto_demo_publish: true` is set in the pipeline brief. The worker can either follow this step file directly (agent mode) or use the automation script:

```bash
node armos_cloud/scripts/publish-internal-demo.mjs \
  --source /path/to/code \
  --customer "Cox Automotive" \
  --industry automotive \
  --use-case "marketing-catalog" \
  --apply
```

The script (`armos_cloud/scripts/publish-internal-demo.mjs`) is for **cloud worker and CLI use only** — not for ArmOS desktop. The ArmOS agent uses MCP tools directly.

### When a consultant provides external code

If a consultant has final code built outside the pipeline (their own IDE, external team, etc.):

1. Open the project in ArmOS, click the **Finder** or **VS Code** button to open the workspace folder
2. Drop the final app files into `code/` (if `code/` already has content, rename it to `code-prev-{date}/` first)
3. Back in ArmOS, click **"Capture Final Demo"** or say "capture final demo" in chat

The agent reads whatever is in `code/` at that point and runs the full capture flow.

## Inputs

**The `code/` folder is the single source of truth.** Everything this step reads and processes comes from `code/` and its subdirectories. No other project directories (`spec/`, `artifacts/`, `objective/`, `delivery/`) are read for the anonymization or build — only for optional catalog enrichment metadata.

| Source | What to read | Required? |
|--------|-------------|-----------|
| `code/` | Final app source code and all subdirectories (HTML, JS/TS, CSS, manifest.json, data/, components/, assets) | **Yes** |
| `code/manifest.json` | Dataset mappings, collection mappings, app name, app ID | **Yes** (must exist inside `code/`) |
| `artifacts/deploy-result.json` | Page ID, design ID, card ID, instance — from the pipeline's MVP1/MVP2 deploy. **This is how you find the existing page on domo-ps-repo.** Do not search by name. | **Yes** (for pipeline runs; may not exist for external code uploads) |
| `code-demo/_DEMO_META.json` | Prior capture's `demoDesignId` — if a previous capture exists, use this design ID to update in place | Auto-detected if present |
| `spec/BUILD-SPEC.md` | What the app does (for catalog description only — not processed) | Optional |
| `objective/NORTHSTAR.md` | Outcome category (for catalog tagging only) | Optional |
| `artifacts/MVP2-HANDOFF.md` | Feature list and persona coverage (enriches catalog entry) | Optional |
| Pipeline brief | `account_key`, customer name, industry, engagement type | **Yes** (CLI args or brief) |

### When a consultant uploads final code

If the consultant uploads or provides final code (zip, folder, or via ArmOS UI) and a `code/` directory already exists in the project workspace:

1. **Rename** the existing `code/` to `code-prev-{timestamp}/` (e.g. `code-prev-20260520/`) as a backup
2. **Store** the uploaded final code into the fresh `code/` directory
3. Log the backup path so the consultant knows where the prior version is

This way the `code/` folder always contains the latest final code, and nothing is lost.

## Execution

### Phase 1: Analyze the App

**Scope for anonymization: `code/` and its subdirectories only.** Do not read files outside `code/` for anonymization purposes. But DO read `artifacts/deploy-result.json` for deployment metadata and `delivery/DELIVERY-SUMMARY.md` for context card content.

**Do NOT anonymize these files — they are internal and must keep the customer name:**
- `delivery/MEMORY-SIGNOFF.md` — engagement wrap-up written to the memory/knowledge graph. Must keep the customer name so future recall works ("what did we build for Cox Automotive?").
- `delivery/EXEC-BUILD-PACK.md` — internal executive summary for PS leadership. Must keep the customer name so leadership knows which account this was for.
- `delivery/CONTEXT-APP-DELIVERY.md` — the engagement context app delivery doc. Internal, tied to the original engagement.
- `artifacts/` — all artifacts are internal pipeline records, not part of the demo.

Anonymization applies **only** to the `code/` folder contents and the demo package (`code-demo/`).

1. **Read `artifacts/deploy-result.json`** — extract the existing deployment info:
   - `mvp_app.design_id` — the app's design ID on domo-ps-repo
   - `page_url` — the existing page URL (extract page ID from the URL)
   - `mvp_app.card_id` — the card ID on that page
   - `instance` — the Domo instance (should be domo-ps-repo)
   
   This is the source of truth for where the app lives on domo-ps-repo. **Use these IDs to update the existing page and design — do not create new pages or search by name.**

   If `deploy-result.json` doesn't exist (e.g. external code upload, no prior pipeline deploy), then create a new page and design.

2. **Check for prior capture metadata** — if `code-demo/_DEMO_META.json` exists, read `demoDesignId`. If present, this overrides the manifest ID for the demo design (it was assigned by domo-ps-repo on the first capture).

3. **Read `code/manifest.json`** — extract:
   - `datasetsMapping[]` — all dataset IDs and field aliases the app expects
   - `collectionsMapping[]` — all AppDB collections the app uses
   - `name` — current app name
   - `id` — current app ID

4. **Walk `code/` recursively** — read all files and subdirectories. Identify:
   - Customer name mentions (in comments, UI text, variable names, config)
   - Customer-specific dataset IDs, collection IDs, user IDs
   - Instance-specific URLs or references
   - Hardcoded data that contains customer information

5. **Optionally read spec/handoff docs** (outside `code/`) for catalog metadata only:
   - What the app does (1-sentence summary)
   - Domain/industry category
   - Key features for catalog tagging
   - Personas served

### Phase 2: Anonymize

Apply anonymization in this order (most specific to most general):

1. **Customer name → generic label**
   - Replace all instances of the customer company name with a domain-appropriate generic:
     - e.g., "Cox Automotive" → "Acme Motors" (same industry, clearly fake)
   - Applies to: HTML text, JS strings, comments, CSS class names that embed the customer name, file names
   - **Preserve structure** — don't break variable references or DOM IDs that use the name

2. **Dataset IDs → placeholder**
   - Original dataset IDs in `manifest.json` → new IDs created on domo-ps-repo (Phase 3)
   - Any hardcoded dataset IDs in JS → remove or replace with manifest alias references

3. **Collection IDs → placeholder**
   - Original collection IDs → new IDs from domo-ps-repo (Phase 3)

4. **User IDs / names → generic**
   - `INITIATIVE_ADMIN_IDS = [12345]` → `INITIATIVE_ADMIN_IDS = []`
   - Any hardcoded display names → "Demo User", "Sample Owner"

5. **Instance references → domo-ps-repo**
   - Any hardcoded instance URLs → remove (SDK handles routing)

6. **Sensitive config → defaults**
   - API keys, tokens, secrets → remove entirely (should never be in ProCode, but check)
   - Feature flags tied to the customer → reset to defaults

**Anonymization rules:**
- The app must still **function** after anonymization (UI renders, navigation works, forms submit)
- Anonymization is **cosmetic + identity** — it doesn't change app logic or architecture
- When in doubt, genericize rather than remove (preserve the demo value)
- Keep a `_DEMO_CHANGES.md` log of all substitutions made (for traceability)

### Phase 3: Generate Sample Data

For each entry in `manifest.json.datasetsMapping[]`:

1. **Analyze the field aliases** — what columns does the app expect?
2. **Generate a representative sample dataset** on `domo-ps-repo.domo.com`:
   - 20-50 rows of realistic demo data matching the column schema
   - Use the domain context (from NORTHSTAR/BUILD-SPEC) to make data believable
   - Include variety: different values in categorical columns, realistic date ranges, plausible numeric distributions
   - No real customer data — all synthetic

3. **Create the dataset** via `domo-datasets` MCP tools (or Domo API):
   - Name: `500Apps Demo | {use-case} | {field-description}`
   - Description: "Sample data for the {app-name} demo app. Not real customer data."
   - Upload the generated rows

4. **Record the new dataset ID** — update `manifest.json` with the domo-ps-repo dataset ID

For each entry in `manifest.json.collectionsMapping[]`:

1. **Create the AppDB collection** on domo-ps-repo (if not exists)
2. **Seed with 3-5 sample documents** that demonstrate the app's functionality
   - Use the app's document schema (inferred from the JS code's read/write patterns)
   - Include enough data to make the demo look populated but not overwhelming

### Phase 4: Prepare Demo Package

1. **Update `manifest.json`**:
   - **Keep the existing `id`** — the app was already deployed to domo-ps-repo during the pipeline (MVP1/MVP2). Keeping the same ID means publish **updates the existing design** with a new version, rather than creating a duplicate. This gives you version history and rollback.
   - **Bump `version`** — increment the patch version (e.g. `0.1.4` → `0.1.5`) so Domo records this as a new version of the same design
   - If `--design-id` is passed, use that instead (override for cases where the manifest ID doesn't match the domo-ps-repo design)
   - If the manifest has no `id` at all (first-ever capture, no prior deploy), Domo creates a new design on publish
   - Update `datasetsMapping[].dataSetId` with the new domo-ps-repo dataset IDs
   - Update `collectionsMapping[].id` with the new domo-ps-repo collection IDs
   - Update `name` to: `500apps-demo-{use-case-slug}`

2. **Add demo metadata file** (`_DEMO_META.json`) to the package:
   ```json
   {
     "originalAccount": "(anonymized)",
     "industry": "automotive",
     "useCaseCategory": "marketing-operations",
     "features": ["crud-catalog", "channel-management", "bulk-import", "utm-generation"],
     "personas": ["strategy-architect", "campaign-executor", "ops-manager"],
     "domoFeatures": ["appdb", "datasets", "procode"],
     "publishedDate": "2026-05-20",
     "publishedBy": "500apps-pipeline",
     "sourceEngagement": "(pipeline-run-id)"
   }
   ```

3. **Generate a README** for the demo (`_DEMO_README.md`):
   - What the app does (1 paragraph)
   - How to navigate it
   - What sample data is included
   - How to fork it for a new customer (what to change)

4. **Generate the demo context card** from the canonical template:

   **IMPORTANT — this is NOT the engagement context app.** The engagement context app is from the pipeline build (step 05) with customer-specific discovery content. That app is NOT updated here — it moves to the appendix on the dashboard page. The demo context card is a completely separate, simple ProCode HTML card built from a template. Do not read `delivery/CONTEXT-APP-DELIVERY.md` for this — that's about the engagement context app, not this card.

   **Everything in this step lives on a dashboard page — ProCode cards on a Domo page. No App Studio. No App Studio import. No App Studio workflow. Just ProCode designs published and placed as cards on a dashboard page.**

   The template is at `template/demo-context-card/` in the 500apps-pipeline skill directory. Read the `README.md` there for full slot reference.

   **Steps:**
   1. Copy `template/demo-context-card/` → `code-demo/demo-context/` (index.html + manifest.json)
   2. **Read `delivery/DELIVERY-SUMMARY.md` first** — this is the richest source for slot values. It has the app name, what it does, key capabilities, data connections, success criteria, and out-of-scope items — all written after the full build is complete. Pull from it rather than re-analyzing the code from scratch:
      - `use_case_title` — from the delivery summary's app name / title (anonymize the customer name)
      - `industry` — from `--industry` or pipeline brief
      - `value_prop` — distill from the delivery summary's "What This App Does" section. Take the one-line value sentence if it exists, or write one from the summary paragraph. This is the elevator pitch.
      - `challenge` — distill from the delivery summary's problem context. What did the team struggle with before? Often stated or implied in "What This App Does."
      - `result` — distill from the delivery summary's "Key Capabilities Delivered" and "Success Criteria." Frame as what the team can now do.
      - `capabilities` — count directly from the delivery summary's "Data Connections" table and "Key Capabilities" list:
        - Count AppDB collections from the data connections table
        - Count Datasets from the data connections table
        - Count Domo AI integrations if mentioned
        - Count Code Engine functions, Magic ETL dataflows, Workflows if mentioned
        - Format as `{ name, count, detail }` objects. Do NOT include "ProCode App" (implicit).
      - `how_it_works` — one sentence summarizing the delivery summary's approach. How does the app deliver the result?

      If `delivery/DELIVERY-SUMMARY.md` doesn't exist (e.g. external code upload), fall back to reading `NORTHSTAR.md`, `BUILD-SPEC.md`, and inferring from the code and manifest.

   3. Replace the placeholder JSON inside the existing `<script id="slot-data">` element in `index.html` with the real values (the element is already in the template — just update its contents)
   4. Update `manifest.json` — set `name` to `500apps-demo-context-{use-case}`, set `id` from prior `demoContextDesignId` if available

   **Do NOT redesign the layout.** The template handles the visual structure (Domo Blue header, Open Sans, orange accents, capability pills) — just fill in the slots. All language must be business-friendly and exec-ready. Read `template/demo-context-card/README.md` for the full slot reference.

### Phase 5: Publish and deploy to domo-ps-repo

**PUBLISH METHOD — NON-NEGOTIABLE:**
- **ArmOS desktop / local:** Use the `domo` CLI. Always. `domo login` then `domo publish -d <directory>`. The CLI handles ALL authentication — no tokens, no secrets, no env vars. NEVER create or request developer tokens. NEVER use `procode_publish` MCP tool from ArmOS desktop.
- **Cloud worker (EC2 only):** Use `procode_publish` MCP tool — the CLI is not available in the cloud worker environment.

**How to tell which environment you're in:** If you can run shell commands (e.g. `ls`, `node`, `domo`), you're on ArmOS desktop — use the CLI. If you cannot run shell commands, you're on the cloud worker — use the MCP tool.

1. **Authenticate** (the CLI handles this — no tokens needed):
   ```bash
   domo login
   ```
   Select the `domo-ps-repo` instance when prompted. That's it. No tokens, no secrets, no env vars.

2. **Publish the main app design:**
   ```bash
   cd code-demo/
   domo publish -d .
   ```
   This publishes the anonymized app. If the manifest has an existing ID, it updates the design in place with a version bump.

3. **Publish the demo context card:**
   ```bash
   cd code-demo/demo-context/
   domo publish -d .
   ```
   Same approach — CLI publish. If a prior demo context design exists (check `_DEMO_META.json` for `demoContextDesignId`), update it with a version bump. Otherwise create new. Save the design ID to `_DEMO_META.json` as `demoContextDesignId`.

4. **Deploy both cards to the existing dashboard page:**
   - **Use the page ID from `deploy-result.json`** — extract it from `page_url` (e.g. `https://domo-ps-repo.domo.com/page/12345` → page ID `12345`). Do NOT search by name or create a new page.
   - The page already exists from the MVP1/MVP2 deploy. Publishing the updated design (version bump) automatically updates the card on the page — the card references the design, so a new version flows through.
   - If the card needs to be re-created (rare), use `app_card_create` MCP tool with the existing page ID and the new design ID.
   - Place the demo context card on the same dashboard page as the app card.
   - **Only create a new page if `deploy-result.json` doesn't exist** (external code upload with no prior pipeline deploy). In that case, use `page_create(title: "500Apps | {Customer} | {Use Case}")` and place both cards.

5. **Reorder the page layout — context card, then app, then appendix:**

   The page from the pipeline has multiple cards (engagement context app, MVP1, MVP2, section headers). After capture, the demo page should lead with the demo context summary and the final app. Everything from the pipeline build moves to an appendix.

   - Use `page_cards(page_id)` to list all cards on the page
   - Identify the final demo app card (matches the design ID just published)
   - Create (or find existing) the demo context card on this page from the design published in step 4
   - Use `layout_get(page_id)` to read the current layout
   - Reorder with `layout_set(page_id)`:
     - **Row 1 (top):** Demo context card (the one-slide summary) — `{x:0, y:0, w:60, h:16}` (compact, one viewport section)
     - **Row 2:** The final demo app card — `{x:0, y:17, w:60, h:36}` (full width, prominent)
     - **Row 3:** Section header "Appendix — Pipeline Build History" — `{x:0, y:54, w:60, h:5}`
     - **Below that:** All other cards (engagement context app, earlier MVP versions, other section headers) stacked in order, starting at `y:60`
   - The engagement context app from the pipeline is **not updated** during capture — it contains engagement-specific content (customer story, survey answers, discovery notes). It moves to the appendix for reference.
   - Old MVP cards stay in the appendix as history.

6. **Verify the deployed app works** — the agent does this:
   - Confirm the demo context card renders at the top of the page
   - Confirm the app card renders below it (use `app-tester` or browser tools to screenshot and check)
   - Confirm sample data loads (the dataset created in Phase 3 is wired via the manifest)
   - Confirm AppDB works: create a test document in the collection, verify it appears, then delete it
   - If verification fails, report the error but still emit checkpoint (the demo package at `code-demo/` is valid; the deploy can be retried)

7. **Mark the page as delivered — append `|DELIVERED` to the page name:**
   - Use `page_update(page_id, { title: "{current_title}|DELIVERED" })` to rename the page
   - The resulting name looks like: `500Apps | Cox Automotive | Marketing Attribution Catalog|DELIVERED`
   - This signals to anyone browsing domo-ps-repo that this page has a finalized, captured demo — not just a pipeline work-in-progress
   - If the page name already ends with `|DELIVERED`, do not append it again
   - Pages without `|DELIVERED` are still in pipeline build / iteration

8. **Register in asset catalog** (optional but recommended):
   - Call `asset_register` via compass-asset-catalog MCP
   - Tags: industry, use-case category, Domo features used, personas

9. **Save domo-ps-repo IDs** for future captures:
   - Write to `code-demo/_DEMO_META.json`:
     - `demoDesignId` — the app design ID on domo-ps-repo
     - `demoContextDesignId` — the context card design ID on domo-ps-repo
   - On subsequent captures, Phase 1 reads these and updates both designs in place.

10. **Emit checkpoint** — do not wait for human verification:

```
@500apps-pipeline checkpoint=stage-demo status=complete
```

### Phase 6: Naming Convention (domo-ps-repo)

Pages and designs on domo-ps-repo follow this naming:

**During pipeline build (before capture):**
```
500Apps | {Customer} | {Use Case}
```

**After capture (delivered):**
```
500Apps | {Customer} | {Use Case}|DELIVERED
```

Examples:
- `500Apps | Cox Automotive | Marketing Attribution Catalog|DELIVERED`
- `500Apps | Acme Health | Pipeline Tracker|DELIVERED`
- `500Apps | GlobalTech | Incident Triage` (not yet delivered — still in pipeline)

The `|DELIVERED` suffix is how you tell at a glance which pages on domo-ps-repo have a finalized demo vs. which are still work-in-progress. **The page ID from `deploy-result.json` is the source of truth for locating the page, not the name.**

The design description on domo-ps-repo should include:
- One-sentence summary
- Industry/domain
- Key Domo features used
- "Anonymized from production engagement. Fork for new customers."

## Outputs

| Artifact | Path / Location | Description |
|----------|----------------|-------------|
| Anonymized source | `code-demo/` | Full app source ready for domo-ps-repo |
| Demo context card | `code-demo/demo-context.html` | One-slide summary: problem, outcome, solution, how to fork |
| Demo metadata | `code-demo/_DEMO_META.json` | Catalog entry + `demoDesignId` + `demoContextDesignId` for future captures |
| Demo README | `code-demo/_DEMO_README.md` | Human-readable guide for the demo |
| Change log | `code-demo/_DEMO_CHANGES.md` | All anonymization substitutions |
| App design | domo-ps-repo.domo.com design library | Version bump on the existing app design |
| Context card design | domo-ps-repo.domo.com design library | The one-slide summary card design |
| Demo page | domo-ps-repo.domo.com | Context card (top) → app (below) → appendix (pipeline history) |
| Sample datasets | domo-ps-repo.domo.com | Created datasets with synthetic data |
| AppDB collections | domo-ps-repo.domo.com | Seeded collections for the demo |
| Asset catalog entry | compass-asset-catalog | Searchable reference for future engagements |

## Error Handling

- **Dataset creation fails:** Log the error, continue with other datasets, mark the app as "partial demo" in metadata
- **Publish fails:** Save the anonymized package locally (`code-demo/`), report the error, don't emit checkpoint
- **Anonymization is uncertain:** When a string might or might not be customer-specific, log it in `_DEMO_CHANGES.md` as "REVIEW NEEDED" — a human checks before publish
- **App doesn't function after anonymization:** Roll back to pre-anonymization state, flag for manual review

## When NOT to Use This Step

- The app contains proprietary business logic that even anonymized reveals competitive intelligence
- The customer explicitly opted out of internal repo publishing (check SOW terms)
- The app is a thin wrapper around a single dataset view (no reusable patterns — skip)

## Checkpoint

Only emit after successful publish to domo-ps-repo and verification:

```
@500apps-pipeline checkpoint=stage-demo status=complete
```

If publish fails, do NOT emit checkpoint. The pipeline records the anonymized package locally for retry.
