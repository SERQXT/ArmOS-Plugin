# Stage INGEST — Load Final Code from Consultant

**Stage code:** `stage-ingest`  
**Checkpoint:** `@500apps-pipeline checkpoint=stage-ingest status=complete`

## Purpose

Accepts the **final production code** from a consultant (zip upload, local path, or ArmOS workspace export), safely backs up the existing pipeline-built code, installs the new code as the canonical version, and updates all downstream artifacts to reflect what was actually built. This is the hand-back step when work happened outside the pipeline.

This step is **optional** — it only runs when a consultant built or refined code outside of the pipeline and needs to bring it back into the project workspace as the source of truth.

## Triggers

- "Load final code from [path] to [project_key]"
- "Here's the finished app for [account]"
- "Consultant uploaded final code"
- "Ingest final build for [project]"
- "Update the pipeline with the real code from [path]"
- "The final code is deployed on [instance].domo.com"
- "Download the production app from [customer instance]"
- "My code is live on [instance], pull it into the pipeline"
- ArmOS UI: consultant clicks "Get Final Deployed Code" on a pipeline run

## Inputs

The final code can come from **any** of these sources:

| Source | How to handle |
|--------|---------------|
| **Zip file / local path** | Extract, locate `manifest.json`, proceed |
| **Customer Domo instance URL** | Log into the instance, download the app design, extract code |
| **ArmOS workspace** | Code already at `{project_path}/code/` — just needs artifact update |
| **S3 path** | Direct reference to code in the workspace bucket |

Additionally required:
- **Project key** — The `{account_slug}__{subSuffix}` identifying the pipeline run
- **S3 project path** — `s3://{bucket}/500apps/projects/{project_key}/` (existing workspace)

### Source Detection

Ask (or detect from context): **"Where is the final code?"**

- If consultant provides a **file path or attachment** → zip/local path flow
- If consultant provides a **Domo instance URL** (e.g., `https://customer.domo.com/page/...` or mentions "it's deployed on their instance") → customer instance download flow
- If consultant says "it's already in ArmOS" or "already in the workspace" → skip to Phase 4 (analyze + update artifacts)

## Execution

### Phase 0: Acquire Code (source-dependent)

#### Path A: Zip File / Local Directory
1. Extract the zip to a temp directory
2. Proceed to Phase 1 (Validate)

#### Path B: Customer Domo Instance
When the consultant says "the code is deployed on [instance]" or provides a URL:

1. **Identify the instance** — extract the instance hostname (e.g., `customer.domo.com`)
2. **Authenticate** — use `domo login` (local/ArmOS desktop — no tokens needed, the CLI handles auth) or the MCP gateway (cloud worker)
3. **Find the app design** — use one of:
   - `domo ls` to list designs and find the app by name
   - If the consultant provided a page URL, extract the card/app ID from it
   - If they provided the design ID directly, use that
4. **Download the app source** — `domo download --id {designId}` (downloads to a local directory)
5. The downloaded directory contains the app files (index.html, app.js, manifest.json, etc.)
6. Proceed to Phase 1 (Validate) using the downloaded directory

**Note:** The `domo download` command pulls the latest published version of the app design. This is the production code running on the customer's instance.

#### Path C: Already in ArmOS / Workspace
1. Code is already at `{project_path}/code/` in S3
2. Skip to Phase 4 (Analyze) — no upload needed, just update artifacts

---

### Phase 1: Validate the Package

1. **Extract the zip** (if zip) to a temp directory
2. **Locate the code directory** — look for `manifest.json` as the anchor:
   - If `manifest.json` is at the root of the zip → that's the code directory
   - If there's a `code/` subdirectory with `manifest.json` → use that
   - If the zip contains a named folder (e.g., "Seer Group 500 Apps/code/") → find and use it
3. **Validate minimum viable app:**
   - `manifest.json` exists and is valid JSON
   - At least one of: `index.html`, `app.js`, or `app.ts` exists
   - If validation fails → stop, report what's missing, do NOT proceed

4. **Read `manifest.json`** and extract:
   - App name, version, ID
   - `datasetsMapping[]` — dataset IDs and field aliases
   - `collectionsMapping[]` — AppDB collection IDs and names
   - `fullpage` flag, `size` config

5. **Identify all code files** — everything in the code directory (HTML, JS, CSS, images, data/, styles/, components/, services/, etc.)

### Phase 2: Backup Existing Code

1. **Check what's currently in S3** at `{project_path}/code/`
2. **If code exists** → copy entire `code/` tree to `code.bak-pre-final/`:
   ```
   s3 cp {project}/code/ {project}/code.bak-pre-final/ --recursive
   ```
3. **If `code.bak-pre-final/` already exists** (from a prior ingest) → use timestamped name:
   ```
   code.bak-{YYYY-MM-DD-HHmm}/
   ```
4. **Log the backup** — note what was backed up and where

### Phase 3: Upload New Code

1. **Upload all code files** to `{project_path}/code/` in S3:
   - Preserve directory structure (styles/, data/, components/, etc.)
   - Exclude macOS artifacts (`__MACOSX/`, `.DS_Store`, `._*` files)
   - Exclude non-code files that belong elsewhere (if the zip contains the full project structure with artifacts/delivery/spec folders, only upload the code portion)

2. **Verify upload** — list `{project_path}/code/` after upload, confirm file count matches source

### Phase 4: Analyze the Final Code

Read the code to understand what was actually built. Extract:

1. **From `manifest.json`:**
   - Dataset mappings (IDs, aliases, fields)
   - Collection mappings (IDs, names)
   - App identity (name, version, ID)

2. **From the source code (app.js / index.html):**
   - What the app does (main purpose)
   - Key features / tabs / surfaces
   - Domo platform features used (AppDB, Domo AI, datasets, Code Engine)
   - External dependencies (CDN scripts, fonts, libraries)
   - Role/persona system (if any)
   - Collection IDs hardcoded in JS (common pattern for AppDB)

3. **Compare to existing artifacts:**
   - Read current `artifacts/MVP2-HANDOFF.md` — does it match what the code does?
   - Read current `artifacts/deploy-result.json` — do the IDs match the manifest?
   - Read current `delivery/DELIVERY-SUMMARY.md` — does it describe the right features?
   - Read current `artifacts/SECURITY-REVIEW.md` — was it run against a materially different version?

### Phase 5: Update Artifacts

Update **only the artifacts that are now stale** given the new code. Do not rewrite artifacts that are still accurate.

#### Always update:

1. **`artifacts/deploy-result.json`** — Canonical record of what's deployed:
   ```json
   {
     "appId": "(from manifest.id)",
     "appName": "(from manifest.name)",
     "version": "(from manifest.version)",
     "instance": "domo-ps-repo.domo.com",
     "datasetsMapping": [...],
     "collectionsUsed": [...],
     "publishedDate": "(today)",
     "publishedBy": "consultant-final-upload",
     "codeVersion": "final-consultant-v{version}"
   }
   ```

#### Update if stale:

2. **`artifacts/MVP2-HANDOFF.md`** — If the code has new features, datasets, or capabilities not reflected in the existing handoff doc:
   - Add a "What Changed in Final Code" section at the top
   - Update the "Domo Platform Features" table with actual dataset/collection IDs from manifest
   - Update the architecture summary if code structure changed materially
   - Update demo script if tabs/surfaces changed
   - Keep existing content that's still accurate (don't rewrite from scratch)

3. **`delivery/DELIVERY-SUMMARY.md`** — If key capabilities or data connections changed:
   - Update the features list to match what the code actually does
   - Update the data connections table with actual dataset IDs
   - Keep the narrative structure but correct any descriptions that no longer match

#### Update if materially different code:

4. **`artifacts/SECURITY-REVIEW.md`** — If the code changed significantly (>30% size change, new external dependencies, new API patterns, new data access patterns):
   - Flag that a re-review is recommended
   - Note what changed that may introduce new risk
   - Do NOT auto-generate a new security review in this step — that's Stage SEC's job

#### Do NOT update:

- `artifacts/INTAKE-FIELDS.md` — survey intake doesn't change
- `artifacts/DISCOVERY-HANDOFF.md` / `DISCOVERY-EMAIL.md` — discovery artifacts are historical
- `objective/NORTHSTAR.md` — outcomes don't change because code changed
- `spec/BUILD-SPEC.md` — spec reflects what was planned; the code is what was delivered
- `delivery/USER-GUIDE.md` — only update if the UI navigation fundamentally changed (new tabs, removed features)

### Phase 6: Report

Output a summary:

```
## Ingest Complete: {project_key}

**Code version:** {version} from manifest
**Files uploaded:** {count} files to code/
**Backup location:** code.bak-pre-final/

### Artifacts Updated:
- deploy-result.json — updated with final manifest data
- MVP2-HANDOFF.md — [updated / unchanged]
- DELIVERY-SUMMARY.md — [updated / unchanged]

### Security Review:
- [Still valid / Recommend re-review (code changed materially)]

### Optional Next Steps:
- Run Stage DEMO to anonymize and publish to domo-ps-repo as reference
- Run Stage SEC if security re-review needed
- Deploy to customer instance (see deploy-result.json for config)
```

## Outputs

| Artifact | Path | Description |
|----------|------|-------------|
| Backed-up code | `code.bak-pre-final/` (or timestamped) | Previous code preserved |
| Final code | `code/` | Consultant's production-ready code |
| Deploy result | `artifacts/deploy-result.json` | Updated with final manifest data |
| MVP2 Handoff | `artifacts/MVP2-HANDOFF.md` | Updated if stale |
| Delivery Summary | `delivery/DELIVERY-SUMMARY.md` | Updated if stale |

## Error Handling

- **Zip has no manifest.json:** Stop. Report "No manifest.json found — cannot identify this as a Domo ProCode app. Expected manifest.json at root or in a code/ subdirectory."
- **S3 backup fails:** Stop. Do not upload new code if backup fails — we'd lose the ability to rollback.
- **Upload partially fails:** Report which files failed. Do not update artifacts until all code is uploaded.
- **Existing artifacts not found:** Generate from scratch using the same format as the pipeline would (see steps/11-mvp2-handoff.md and steps/07-delivery-doc.md for templates).

## Checkpoint

```
@500apps-pipeline checkpoint=stage-ingest status=complete
```
