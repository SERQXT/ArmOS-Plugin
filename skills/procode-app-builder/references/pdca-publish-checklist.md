# Pro-Code App Publish Checklist (PDCA)

Formalized pre- and post-publish verification for Pro-Code app deployments.

## Pre-Publish (Step 7)

### 7a. Manifest Validation
- [ ] Run `procode_manifest_validate` with `app_dir` parameter
- [ ] No critical issues (stale ID, datasetsMapping/mapping conflict, invalid UUIDs)
- [ ] All warnings reviewed and addressed if applicable
- [ ] `fileName` references an existing file in the app directory
- [ ] Version bumped if this is not the first publish

### 7b. Dataset Reachability
- [ ] Every dataset UUID in `mapping[]` verified via `dataset_schema`
- [ ] Column names in app code match actual schema columns
- [ ] If `.schema/` files exist, they match current dataset schemas

### 7c. CLI Authentication
- [ ] `health_check` passes on domo-publish MCP server
- [ ] If failed: ran `domo login -i {instance}` via Bash (not manual)
- [ ] Re-verified health_check after login

### 7d. Gate Decision
- [ ] All 7a-7c checks pass → proceed to publish
- [ ] Any failure → fix and re-check before proceeding

## Post-Publish (Step 8)

### 8a. Deployment Confirmation
- [ ] `domo publish` completed without errors
- [ ] `manifest.json` has valid `id` and `proxyId` fields

### 8b. Version Verification
- [ ] `procode_design_list` shows the app with the expected version
- [ ] Version number matches what was in manifest before publish

### 8c. Visual Verification (if QA tools available)
- [ ] `qa_domo_login` successful
- [ ] `qa_screenshot` shows the app rendering correctly
- [ ] No layout issues, missing data, or broken UI elements

### 8d. Console Verification
- [ ] `qa_get_console_logs(level: "error")` returns no errors
- [ ] No `domo is not defined` errors
- [ ] No `Cannot read properties of undefined` errors
- [ ] No CORS or network errors

### 8e. Error Resolution (if issues found)
- [ ] Root cause identified from console logs
- [ ] Fix applied (inline or via procode-app-fixer)
- [ ] Re-published with version bump
- [ ] Re-verified (repeat 8a-8d)

## Common Pre-Publish Failures

| Check | Common Failure | Fix |
|-------|---------------|-----|
| Manifest validation | `datasetsMapping` instead of `mapping` | Rename key to `mapping` |
| Manifest validation | Stale `id` from template/wrong instance | Remove `id` and `proxyId` for fresh publish |
| Manifest validation | `fileName` points to non-existent file | Set to `index.html` (or `dist/index.html` for React) |
| Dataset reachability | UUID not found | Get correct UUID via `dataset_search` or `dataset_list` |
| Dataset reachability | Auth error | Wrong instance or expired credentials |
| CLI authentication | `domo login` needed | Run via Bash: `domo login -i {instance}` |

## Common Post-Publish Failures

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| App shows blank page | `fileName` wrong or build not run | Fix fileName, run `npm run build` for React |
| App loads, no data | `mapping` key wrong or alias mismatch | Check manifest uses `mapping` not `datasetsMapping` |
| `domo is not defined` | Missing ryuu.js CDN include in index.html | Add `<script src="https://unpkg.com/ryuu.js"></script>` before app.js — this MUST always be present |
| Console errors on data access | Dataset not mapped or wrong column names | Compare code against `.schema/` files |
| Charts empty | Data format mismatch | Log raw data, compare against chart expectations |
