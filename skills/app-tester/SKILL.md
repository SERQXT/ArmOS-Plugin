---
name: app-tester
tier: 1
description: "PDCA testing for deployed Domo apps — screenshot verification, console log analysis, DOM assertions, and automated test scenarios. Trigger with 'test the app', 'check if the app is working', 'verify the deployment', 'run QA on the app', or any request to test a deployed Domo application."
maturity: beta
tools:
  - qa_navigate
  - qa_action
  - qa_screenshot
  - qa_assert
  - qa_get_console_logs
  - qa_run_scenario
  - qa_generate_report
  - qa_domo_login
  - qa_capture_network
  - qa_domo_app_navigate
  - qa_domo_page_screenshot
  - qa_appstudio_import
  - qa_close_session
audience: [delivery]
---

# App Tester

PDCA (Plan-Do-Check-Act) testing for deployed Domo applications. Uses the mcp-qa-testing MCP server's Playwright-based tools to take screenshots, inspect console logs, assert DOM state, and run automated test scenarios against live Domo apps.

## Triggers

- "test the app"
- "check if the app is working"
- "verify the deployment"
- "run QA on the app"
- "screenshot the dashboard"
- "is the app rendering correctly?"
- "the app looks broken, can you check?"

---

## MCP Tools Reference

| Tool | Description | When to Use |
|------|-------------|-------------|
| `qa_navigate` | Navigate browser to a URL | Navigate to the app URL |
| `qa_action` | Perform UI actions (click, type, hover, scroll) | Interact with app elements |
| `qa_screenshot` | Capture screenshot (full page or element) | Visual verification |
| `qa_assert` | Check DOM conditions (exists, visible, text, count) | Automated assertions |
| `qa_get_console_logs` | Get browser console output | Catch silent JS errors |
| `qa_run_scenario` | Run a full test scenario via sub-agent | End-to-end test automation |
| `qa_generate_report` | Compile results into markdown report | Test documentation |
| `qa_domo_login` | Log into Domo instance | Required before testing authenticated apps |
| `qa_capture_network` | Start/stop network traffic capture | Debug API failures |
| `qa_domo_app_navigate` | Navigate to a deployed Domo app by ID | Access apps in Domo context |
| `qa_domo_page_screenshot` | Login + navigate + screenshot in one call | Quick visual check |
| `qa_close_session` | Close the browser session | Cleanup after testing |

---

## Common Failure Patterns

These are the most frequent issues found when testing deployed Domo apps. Check for these first.

| Pattern | Symptom | Root Cause | Diagnosis Tool | Fix |
|---------|---------|------------|----------------|-----|
| **Blank screen** | App renders empty white page | JS bundle failed to load, or fatal error on init | `qa_get_console_logs` (look for errors) | Check build output, verify `manifest.json` paths, check for missing dependencies |
| **Missing data** | App loads but shows "No data" or empty tables | Dataset not mapped, wrong dataset ID, or permissions | `qa_capture_network` (look for 404/403 on data endpoints) | Verify `manifest.json` dataset mappings, check dataset sharing/permissions |
| **CORS errors** | Console shows "Access-Control-Allow-Origin" errors | App making direct API calls instead of using Domo proxy | `qa_get_console_logs` (filter for "CORS") | Replace direct `fetch()` with `domo.get()`/`domo.post()` — Domo proxies these automatically |
| **Style breakage** | App renders but layout is broken, overlapping elements | CSS conflicts with Domo's iframe container, or missing CSS file | `qa_screenshot` (visual inspection) | Check CSS specificity, use scoped styles, verify CSS bundle loads |
| **Infinite loading** | Spinner never stops, "Loading..." persists | API call hanging, promise never resolving, timeout too short | `qa_capture_network` + `qa_get_console_logs` | Check for unresolved promises, add error handling, increase timeouts |
| **Auth failure** | App shows login prompt or "Unauthorized" | Session expired, dev token invalid, or app not properly deployed | `qa_capture_network` (look for 401/403) | Re-authenticate, verify app is published, check token validity |
| **Iframe context issues** | App works standalone but breaks in Domo | Domo wraps custom apps in iframes; some APIs behave differently | `qa_domo_app_navigate` + `qa_screenshot` | Use the **two-pass pattern** below: Pass 1 for context verification, Pass 2 via direct URL for interactive testing |

---

## Iframe Interactive Testing — Two-Pass Pattern

ProCode apps in Domo are wrapped in an iframe. The parent page context (Domo chrome) blocks most interactive testing — clicks, scrolls, and DOM queries fail silently or hit the wrong elements.

**Use the two-pass pattern for any app that requires interaction testing:**

### Pass 1: Context Verification (Domo Page)

Purpose: Verify the app renders correctly WITHIN Domo — iframe sizing, card dimensions, page layout, visibility.

```
qa_domo_login(instance, username, password)
qa_navigate(url: "https://{instance}.domo.com/page/{pageId}")
qa_screenshot(name: "context-check", full_page: true)
```

**What to check:**
- Is the app visible? (iframe height communicated correctly)
- How much of the app is visible without scrolling?
- Does the card size show the full app or clip it?
- Any Domo-level errors (broken card, "App not found")?

**Do NOT try to click, filter, or interact with elements through the page view.**

### Pass 2: Interactive Testing (Direct App URL)

Purpose: Full DOM access for clicks, filters, drawer opens, scroll, assertions.

**How to get the direct URL:**
- Pattern: `https://{instance}.domo.com/embed/card/{cardId}`
- Or: inspect the iframe `src` attribute from Pass 1's screenshot/DOM
- Or: use `qa_domo_app_navigate(instance, app_id)` which navigates directly into the app context

```
qa_navigate(url: "https://{instance}.domo.com/embed/card/{cardId}")
  — OR —
qa_domo_app_navigate(instance: "{instance}", app_id: "{designId}")

qa_screenshot(name: "direct-baseline", full_page: true)
qa_action(action: "click", selector: ".table-row:first-child")
qa_screenshot(name: "after-row-click")
qa_action(action: "click", selector: ".filter-dropdown")
qa_screenshot(name: "after-filter")
... all interactive scenarios ...
```

**What to check:**
- Row clicks open drawers
- Filters update table and KPIs
- Empty states render when filters zero out
- Tab switching works
- Scroll reveals all rows
- Console errors after interactions

### When to Use Which Pass

| Test Goal | Pass | Why |
|-----------|------|-----|
| "Does the app show up on the page?" | Pass 1 | Need Domo page context |
| "Is the card sized correctly?" | Pass 1 | Card size is a page-level property |
| "Do row clicks open a drawer?" | Pass 2 | Need direct DOM access |
| "Do filters work?" | Pass 2 | Need to interact with dropdowns |
| "Does empty state render?" | Pass 2 | Need to force filter combos |
| "Are there console errors?" | Pass 2 | Cleaner signal without Domo's own logs |
| "Does the app look right in context?" | Both | Pass 1 for context, Pass 2 for detail |

### Common Mistake

**Wrong:** Taking a screenshot via Pass 1 and marking interactive tests as "code verified" because you couldn't click through the iframe.

**Right:** Switch to Pass 2 for ALL interactive scenarios. "Code verified" is not a valid test result when you have direct URL access.

---

## PDCA Testing Workflow

### Plan Phase

Define what to test:

1. **Identify the app** — Get the app URL, card ID, or page ID
2. **Define success criteria:**
   - Does the app load without console errors?
   - Are all expected UI elements present?
   - Does data display correctly?
   - Do interactions (clicks, filters) work?
3. **Determine test type:**
   - Quick check (screenshot + console logs)
   - Functional test (navigate + interact + assert)
   - Full scenario (end-to-end user flow)

### Do Phase — Quick Check

The fastest path to verify an app is working:

```
1. qa_domo_login(instance, username, password)
2. qa_domo_app_navigate(instance, app_id)
3. qa_screenshot(name: "app-initial-load", full_page: true)
4. qa_get_console_logs(level: "error")
```

**Decision tree:**
- Zero console errors + screenshot shows expected UI = PASS
- Console errors present = investigate errors
- Screenshot shows blank/broken = investigate further

### Do Phase — Functional Test

For deeper testing with assertions:

```
1. qa_domo_login(instance, username, password)
2. qa_domo_app_navigate(instance, app_id)
3. qa_screenshot(name: "before-interaction")

4. qa_assert(assertion: "exists", selector: ".sidebar")
5. qa_assert(assertion: "visible", selector: ".data-table")
6. qa_assert(assertion: "text_contains", selector: ".header-title", expected: "Dashboard")
7. qa_assert(assertion: "count", selector: ".card-widget", expected: "5")

8. qa_action(action: "click", selector: ".filter-dropdown")
9. qa_action(action: "click", selector: "text=Last 30 Days")
10. qa_screenshot(name: "after-filter")

11. qa_assert(assertion: "text_contains", selector: ".status-indicator", expected: "Filtered")
12. qa_get_console_logs(level: "error")
```

### Do Phase — Full Scenario

For end-to-end testing with the autonomous sub-agent:

```
qa_run_scenario(
  scenario: "Navigate to the app. Verify the sidebar loads with at least 3 items.
             Click the first sidebar item. Verify the main content area updates.
             Check the data table has at least 1 row. Take screenshots before and
             after interactions. Check for any console errors.",
  base_url: "https://mycompany.domo.com",
  max_steps: 20
)
```

The sub-agent autonomously executes the scenario, taking screenshots and making assertions along the way.

### Check Phase

Analyze results:

1. **Review screenshots** — Visual comparison of expected vs actual
2. **Check console logs** — Any errors or warnings?
3. **Review assertions** — Which passed, which failed?
4. **Check network traffic** — Any failed API calls?

### Act Phase

Based on findings:

| Finding | Action |
|---------|--------|
| All checks pass | App is working. Generate report. |
| Console errors but UI looks ok | Fix the JS errors (they may cause intermittent failures). Create new version. |
| Missing elements | Check component rendering logic. Verify data availability. |
| Network errors (404/403) | Fix API endpoints or permissions. Redeploy. |
| Style issues | Fix CSS. Verify responsive behavior. Redeploy. |

After fixes, **re-run the same test** to verify the fix worked:

```
1. [Deploy fix]
2. qa_navigate(url: "app-url")   — force reload
3. qa_screenshot(name: "after-fix")
4. qa_get_console_logs(level: "error")
5. [Compare with previous results]
```

---

## Check/Act Automation Workflow

For automated fix-verify cycles:

```
Loop (max 3 iterations):
  1. Screenshot + console logs + assertions
  2. If all pass → DONE (generate report)
  3. If failures found:
     a. Diagnose root cause from logs/screenshots
     b. Apply fix (code change, config change, redeploy)
     c. Wait for deployment
     d. Re-run checks
  4. If still failing after 3 iterations → report as unresolved
```

---

## Generating Test Reports

After testing, compile results:

```
qa_generate_report(
  test_name: "App Deployment Verification",
  steps: ["Logged in to Domo", "Navigated to app", "Took screenshot", "Checked console"],
  assertions_passed: ["Sidebar exists", "Data table visible", "No console errors"],
  assertions_failed: ["Header title mismatch: expected 'Dashboard v2', got 'Dashboard'"],
  screenshots: ["/qa-output/screenshots/app-initial-load.png"],
  summary: "App loads and renders correctly. Minor title mismatch — expected v2 title but still shows v1. All other checks pass."
)
```

---

## Guardrails

- **Always login first.** Domo apps require authentication. Call `qa_domo_login` before navigating to any Domo app.
- **Wait for render.** Domo apps load asynchronously. Use `wait_seconds` parameter or `qa_navigate` with `wait_for: "networkidle"` to ensure the app is fully loaded before assertions.
- **Check console logs every time.** Silent JS errors are the most common missed issues. They may not affect the visual output but indicate bugs that will surface later.
- **Take screenshots before and after interactions.** This creates a visual record for comparison and debugging.
- **Close the session when done.** Call `qa_close_session` to free browser resources.
- **Use the two-pass pattern for deployed apps.** Pass 1 on the Domo page for context verification (sizing, visibility), Pass 2 on the direct app URL (`/embed/card/{cardId}` or `qa_domo_app_navigate`) for all interactive testing. Never mark interactive tests as "code verified" when a direct URL is available.

---

## MCP Server Required

- **mcp-qa-testing** — for all browser automation, screenshots, assertions, and test scenarios

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: test scenarios executed, console errors found, DOM assertions, data binding verification, overall app health assessment.

## Related Skills

- **ProCode App Builder** (Build) — builds the apps that this skill tests
- **Code Engine Builder** (Build) — tests Code Engine function deployments
- **Domo Login** (Build) — reliable Domo login patterns used by this skill
- **Domo Browser Actions** (Build) — navigation and interaction patterns for Domo UI
