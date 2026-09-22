---
name: dashboard-verify
tier: 1
description: "PDCA verification loop for dashboard builds. Render-checks every card, diagnoses failures (double aggregation, wrong columns, bad filters), fixes and retries. Optionally runs visual screenshot verification. Use after dashboard-build has created all cards. Trigger with 'verify the dashboard', 'check the cards render', or 'run PDCA checks'."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by dashboard-v2-build (T2) Guardrails and Step 8, which inline the render-check and fix loop."
audience: [delivery]
---

# Dashboard Verify — PDCA Render Check Loop

Verifies that every card on a dashboard renders correctly with data. Diagnoses and fixes common rendering failures. Optionally runs visual screenshot verification for v2 pages.

## Triggers

- "verify the dashboard"
- "check the cards render"
- "run PDCA checks"
- "some cards aren't rendering"

---

## Step 1: Render Check Every Card

**Tool:** `card_render_check`

Call `card_render_check` on every card ID on the page. Record pass/fail.

---

## Step 2: Diagnose Failures

For each failed card, check these root causes in order:

1. **Double aggregation** — Beast mode has SUM/AVG/COUNT AND card column also has aggregation set. This is the #1 cause. Fix: set card column aggregation to null.
2. **Wrong column names** — Case-sensitive mismatch vs dataset schema. Fix: use exact names from schema.
3. **Wrong filter values** — Abbreviated or guessed values. Fix: use exact strings from `SELECT DISTINCT`.
4. **Invalid beast mode** — Formula references non-existent columns. Fix: correct column references.
5. **Empty date range** — Date filter outside actual data boundaries. Fix: adjust to MIN/MAX from discovery.
6. **Filter combination produces zero rows** — Test with `dataset_query` before applying.

---

## Step 3: Fix and Retry (Max 2 Retries)

For each failed card:
1. Delete with `card_delete`
2. Fix the spec based on diagnosis
3. Preview with `card_preview` — only proceed if preview succeeds
4. Recreate with `card_create_full`
5. Re-run `card_render_check`
6. If still failing after 2 retries, mark as permanently failed

---

## Step 4: Visual Verification (Optional)

**Tools:** `qa_domo_page_screenshot`, `layout_set`

Only for v2_page or app_studio output types. Requires browser login credentials.

**If screenshot tools are unavailable:** Skip and note: "Visual verification skipped — screenshot tools require browser login credentials. Verify layout manually in Domo." This is NOT a failure.

If available:
1. Screenshot the page
2. Evaluate against blueprint: card visibility, layout balance, sizing, spacing, readability, visual hierarchy
3. Score: PASS / MINOR_ISSUE / MAJOR_ISSUE
4. Fix MAJOR_ISSUE with `layout_set`, re-screenshot (max 2 iterations)

**App Studio / ProCode cards:** If the page contains embedded ProCode or App Studio apps, use the **two-pass pattern** from `app-tester` for interactive verification. Pass 1 (page screenshot) confirms the app renders within the page layout. Pass 2 (direct URL via `/embed/card/{cardId}` or `qa_domo_app_navigate`) is required for any interactive checks — clicks, filters, and DOM queries cannot reach through the iframe from the parent page context.

---

## Step 5: Final Report

```
## PDCA Verification Results

| Card Title | Card ID | Render | Fix Applied | Retries | Status |
|-----------|---------|--------|-------------|---------|--------|
| [Title] | [ID] | Pass | — | 0 | Verified |
| [Title] | [ID] | Fail→Pass | Removed double aggregation | 1 | Fixed |
| [Title] | [ID] | Fail→Fail | Filter "CY" → "Current Year" — still no data | 2 | FAILED |

Visual Verification: [PASS / SKIPPED / issues noted]
```

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: verification results — screenshots captured, data accuracy checks, interactive element tests, pass/fail status, issues found.

## MCP Servers Required

- **domo-pages** — card render checks, deletion, creation, layout
- **domo-datasets** — dataset queries for diagnosis
- **mcp-qa-testing** — screenshot capture (optional)
