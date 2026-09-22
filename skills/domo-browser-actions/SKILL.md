---
name: domo-browser-actions
tier: 1
description: "Browser automation patterns for Domo UI — navigation with wait strategies, screenshots, card interactions, network capture, and DOM inspection. Trigger with 'navigate to a Domo page', 'take a screenshot of the dashboard', 'interact with a card', 'capture network traffic', or any browser-based Domo operation."
maturity: alpha
audience: [delivery]
---

# Domo Browser Actions

Navigation patterns, wait strategies, screenshot procedures, card interactions, network capture, and DOM inspection for the Domo UI. This skill provides the building blocks for browser-based Domo automation. Requires an active login session (use the domo-login skill first).

## Triggers

- "navigate to a Domo page"
- "take a screenshot of the dashboard"
- "interact with a card"
- "capture network traffic from the Domo UI"
- "inspect the DOM on a Domo page"
- "resize a card in the UI"

---

## Navigation with Wait Strategies

Domo pages load asynchronously — cards, data, and interactive elements render at different times. Choosing the right wait strategy is critical.

### Wait Strategy Reference

| Strategy | Tool Parameter | Use When | Notes |
|----------|---------------|----------|-------|
| `load` | `wait_for: "load"` | General navigation | Waits for the `load` event. Default in `qa_navigate`. |
| `domcontentloaded` | `wait_for: "domcontentloaded"` | Screenshots (need DOM but not all data) | Faster than `load`, but cards may still be rendering. |
| `networkidle` | `wait_for: "networkidle"` | Login page only | Waits until no network requests for 500ms. **Do NOT use on Domo dashboards** — Domo streams data continuously and `networkidle` will hang. |
| Manual wait | Navigate, then `qa_action(action: "scroll", selector: "body", scroll_y: 0)` + timeout | After navigating to a Domo page | Cards render asynchronously (5-10 seconds is typical). |

### Recommended Navigation Pattern

```
1. qa_domo_login(instance, username, password)

2. qa_navigate(
     url: "https://mycompany.domo.com/page/12345",
     wait_for: "domcontentloaded",
     timeout: 60000
   )

3. [Wait 8-10 seconds for card rendering]
   — The qa_domo_app_navigate tool has a built-in wait_seconds parameter
   — For manual navigation, take a screenshot after a delay

4. qa_screenshot(name: "page-loaded", full_page: true)
```

**Critical rule:** Never use `waitUntil: 'networkidle'` when navigating to Domo dashboards. Domo pages stream card data continuously, so the network is never truly idle. Use `'domcontentloaded'` or `'load'` and then wait 8-10 seconds.

### Navigation URL Patterns

| Destination | URL Pattern | Notes |
|-------------|-------------|-------|
| Dashboard page | `/page/{pageId}` | Standard page view |
| Page edit mode | `/page/{pageId}/edit` | Requires page ownership |
| Card detail | `/page/kpis/details/{cardId}` | Full card view |
| ProCode app (direct) | `/embed/card/{cardId}` | Direct DOM access — bypasses Domo iframe wrapper. Use for interactive testing of ProCode / custom apps. |
| ProCode app (via tool) | `qa_domo_app_navigate(instance, app_id)` | Navigates directly into app context by design ID |
| Data center | `/datacenter` | Dataset management |
| App listing | `/datacenter/apps` | Custom apps |
| Admin settings | `/admin` | Requires admin role |
| Login | `/auth/index` | Canonical login entry point |

**ProCode app testing note:** When testing ProCode apps embedded on a Domo page, the iframe wrapper blocks clicks, scrolls, and DOM queries from the parent context. Use `/embed/card/{cardId}` or `qa_domo_app_navigate` for direct DOM access. See the **two-pass pattern** in `app-tester` for the full workflow.

---

## Screenshot Procedures

### Full Page Screenshot

Captures the entire scrollable page, including content below the viewport:

```
qa_screenshot(
  name: "full-dashboard",
  full_page: true
)
```

### Viewport Screenshot

Captures only what is visible in the browser viewport (1440x900 default):

```
qa_screenshot(
  name: "above-fold"
)
```

### Element Screenshot

Captures a specific element by CSS selector:

```
qa_screenshot(
  name: "kpi-card",
  selector: ".kpi_title"
)
```

### Screenshot After Wait

For Domo pages, always wait for cards to render before taking screenshots:

```
1. qa_navigate(url: "...", wait_for: "domcontentloaded")
2. [Wait 10 seconds — cards render asynchronously]
3. qa_screenshot(name: "dashboard-rendered", full_page: true)
```

The `qa_domo_page_screenshot` tool wraps this entire pattern into a single call.

---

## Card Interactions

### Gear Menu Pattern

The card gear menu (for resizing, editing, etc.) requires a hover-then-click sequence:

```
1. qa_action(action: "hover", selector: ".kpi_title")
   — Hover over the card title to reveal the gear menu
   — Wait 1-2 seconds for the menu to appear

2. qa_action(action: "click", selector: "i.icon-wrench-fill")
   — Click the wrench ICON, not the container div
   — Clicking div.badge_header_gear-menu opens the nav sidebar instead

3. [Menu is now open — click the desired option]
```

### Card Gear Menu Selectors

| Element | Selector | Notes |
|---------|----------|-------|
| Card title (hover target) | `.kpi_title` | Hover to reveal gear menu |
| Gear menu container | `div.badge_header_gear-menu` | Do NOT click this — it opens the nav sidebar |
| Wrench icon (click this) | `i.icon-wrench-fill.xs` | Click the `<i>` element, not the `<div>` |
| Size: small | `i.resize-badge-small` | At bottom of gear dropdown |
| Size: medium | `i.resize-badge-medium` | At bottom of gear dropdown |
| Size: large | `i.resize-badge-large` | At bottom of gear dropdown |
| Size: full | `i.resize-badge-full` | At bottom of gear dropdown |

### Card Resize via UI

```
1. qa_action(action: "hover", selector: ".kpi_title")
2. [Wait 1.5 seconds]
3. qa_action(action: "click", selector: "i.icon-wrench-fill")
4. [Wait 2 seconds for dropdown to appear]
5. qa_action(action: "click", selector: "i.resize-badge-large")
6. [Wait 8 seconds — Domo saves the size change asynchronously]
7. qa_screenshot(name: "after-resize")
```

**Gotcha:** Size icons at y=1035+ may be below the viewport (1080px). If the click does nothing, the element may need scrolling into view. Use `qa_action(action: "scroll", selector: "body", scroll_y: 500)` first.

---

## Network Capture

Capture API traffic to discover endpoints, debug failures, or understand what APIs a UI action triggers.

### Start/Stop Pattern

```
1. qa_capture_network(action: "start")

2. [Perform UI actions — click buttons, change filters, navigate]

3. qa_capture_network(action: "stop")
   — Returns all captured API requests and responses
   — Automatically filters out static assets (JS, CSS, images, fonts)
   — Groups by unique endpoint
```

### What Network Capture Returns

```json
{
  "success": true,
  "total_requests": 15,
  "total_responses": 15,
  "unique_endpoints": 8,
  "endpoints": [
    {
      "method": "GET",
      "url": "https://mycompany.domo.com/api/content/v1/pages/12345",
      "status": 200,
      "bodyPreview": "{\"pageId\":12345,\"title\":\"My Dashboard\"...}",
      "count": 1
    }
  ],
  "raw_requests": [...],
  "raw_responses": [...]
}
```

### Discovering Hidden APIs

Domo has undocumented endpoints that only surface during UI interactions. The network capture pattern is how they were discovered:

```
1. qa_domo_login(...)
2. qa_navigate(url: "https://mycompany.domo.com/page/12345")
3. qa_capture_network(action: "start")
4. [Perform the UI action you want to replicate programmatically]
5. qa_capture_network(action: "stop")
6. [Examine the captured endpoints to find the API call]
```

**Critical rule:** The capture includes ALL requests, not just `/api/` prefixed ones. Some Domo endpoints live at the root path (e.g., `POST /kpis/changekpisizes`). Never filter by URL prefix when doing API discovery.

---

## DOM Inspection

### Checking Element Existence

```
qa_assert(assertion: "exists", selector: ".sidebar-nav")
qa_assert(assertion: "not_exists", selector: ".error-message")
```

### Checking Element Content

```
qa_assert(assertion: "text_contains", selector: ".page-title", expected: "Dashboard")
qa_assert(assertion: "text_matches", selector: ".card-count", expected: "5 cards")
```

### Checking Element Visibility

```
qa_assert(assertion: "visible", selector: ".data-table")
qa_assert(assertion: "hidden", selector: ".loading-spinner")
```

### Counting Elements

```
qa_assert(assertion: "count", selector: ".card-widget", expected: "10")
```

### Checking Attributes

```
qa_assert(assertion: "attribute_equals", selector: ".filter-input", attribute: "value", expected: "Last 30 Days")
```

---

## Domo UI Selector Reference

### Page Elements

| Element | Selector | Notes |
|---------|----------|-------|
| Page title | `.page-title, h1` | May vary by page type |
| Page admin wrench | `i.icon-wrench.md` or `i.db-icon.icon-wrench.md` | Admin/settings, NOT edit mode |
| Enter edit mode | Navigate to `/page/{id}/edit` | Don't try to find an edit button |
| Card widgets | `.kpi_title` | Each card on the page |
| Filter bar | Filter icon (funnel) in the header | Page-level filters |

### Login Elements

| Element | Selector |
|---------|----------|
| Username input | `input[name="username"]` |
| Password input | `input[name="password"]` |
| Sign in button | `button.sign-in` |
| Sign in (fallback) | `button:has-text("Sign In")` |
| Sign in (fallback 2) | `button[type="submit"]` |

### Card Elements

| Element | Selector | Notes |
|---------|----------|-------|
| Card title | `.kpi_title` | Hover to reveal gear menu |
| Gear menu container | `div.badge_header_gear-menu` | Do NOT click |
| Gear icon | `i.icon-wrench-fill.xs` | Click this for the menu |
| Size: small | `i.resize-badge-small` | Bottom of gear dropdown |
| Size: medium | `i.resize-badge-medium` | Bottom of gear dropdown |
| Size: large | `i.resize-badge-large` | Bottom of gear dropdown |
| Size: full | `i.resize-badge-full` | Bottom of gear dropdown |

### Dropdown / Menu Elements

```
// Generic menu items
[class*="menu"] li, [class*="dropdown"] li, [role="menuitem"], [class*="MenuItem"]

// Filter by visibility (many hidden elements exist)
.filter(el => el.offsetParent !== null)
```

### Visibility Filtering

Domo pages have many hidden DOM elements. When inspecting or asserting, filter for visible elements:

```
qa_assert(assertion: "visible", selector: ".target-element")
```

For more complex visibility checks, use `qa_action` with JavaScript evaluation or the `qa_assert` tool's `visible`/`hidden` assertions.

---

## Error Recovery

### Timeout During Navigation

```
1. qa_screenshot(name: "timeout-state")
   — See what the browser shows
2. Check URL — is it still on /auth? (session expired)
3. If on /auth: re-login with qa_domo_login
4. If on another page: increase timeout and retry navigation
```

### Element Not Found

```
1. qa_screenshot(name: "element-not-found")
   — Visual confirmation of what is rendered
2. qa_assert(assertion: "exists", selector: "body")
   — Verify the page loaded at all
3. Try alternative selectors (text-based, role-based)
4. Check if the element loads asynchronously (wait longer)
```

### Click Does Nothing

```
1. qa_screenshot(name: "before-click-attempt")
2. Check if element is below viewport: qa_action(action: "scroll", ...)
3. Check if element is hidden behind an overlay
4. Try clicking the parent or child element instead
5. Use text-based selector: qa_action(action: "click", selector: 'text="Button Text"')
```

---

## Guardrails

- **Always login before navigating to Domo pages.** Use the domo-login skill first.
- **Never use `networkidle` on Domo dashboards.** It will hang indefinitely. Use `domcontentloaded` and a manual wait.
- **Click icons, not containers.** The Domo gear menu requires clicking `i.icon-wrench-fill`, not the surrounding `div`.
- **Wait after interactions.** Domo saves changes asynchronously. Wait 5-10 seconds after resize, filter, or navigation actions.
- **Take screenshots liberally.** They are the primary debugging tool for browser automation.
- **Close the session when done.** Call `qa_close_session` to free resources.

---

## MCP Server Required

- **mcp-qa-testing** — for all browser automation, navigation, screenshots, and DOM inspection

---

## Related Skills

- **Domo Login** (Build) — login must happen before any browser actions
- **App Tester** (Build) — uses browser actions for PDCA testing
- **Domo Navigator** (Build) — comprehensive reference for Domo API and UI patterns
