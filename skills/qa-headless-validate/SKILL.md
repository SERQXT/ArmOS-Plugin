---
name: qa-headless-validate
tier: 1
description: "MCP-free browser validation of Domo cards/apps. Authenticate a headless Playwright session using the local ryuu CLI login (refresh token -> access token -> SID), then screenshot a page, read the app-iframe DOM, and probe data endpoints in-frame. Trigger with 'screenshot the card', 'validate the app live', 'do A', 'check if values are showing', or any browser validation when mcp-qa-testing is NOT connected."
maturity: beta
audience: [delivery, code]
---

# QA Headless Validate (no MCP required)

Validate a deployed Domo card or custom app in a real (headless) browser **without**
the `mcp-qa-testing` server. Use this when `qa_domo_login` / `qa_screenshot` are
unavailable (standalone CLI edition, cron/headless runs) but you still need to:

- screenshot a Domo page/card to confirm it renders,
- read what the embedded custom app actually shows (KPI text, "Loading…", errors),
- probe the app's data endpoints from **inside** the authenticated app iframe.

If `mcp-qa-testing` IS connected, prefer **domo-login** + **app-tester** instead —
they are more robust. This skill is the fallback.

## Triggers

- "screenshot the card / page"
- "validate the app live", "do A", "is it showing values?"
- "check the deployment visually" when no QA MCP server is present

---

## How auth works (the key insight)

The ryuu login file at `~/.config/configstore/ryuu/<instance>.domo.com.json` stores
only a **`refreshToken`** (a JWT). Its `devToken` field is a boolean flag, **not** a
token. To drive an authenticated browser you must exchange the refresh token, exactly
like `ryuu-client` does internally:

1. `POST https://<instance>/api/oauth2/token`
   body (form-urlencoded): `client_id=domo:internal:devstudio`, `grant_type=refresh_token`, `refresh_token=<rt>`
   → `{ access_token }`
2. `GET https://<instance>/api/oauth2/sid` with header `Authorization: Bearer <access_token>`
   → `{ sid }`
3. In the browser, authenticate every Domo request with header
   **`X-Domo-Authentication: <sid>`** and cookie **`DA-SID=<sid>`**.

### Critical scoping rule

Inject `X-Domo-Authentication` **only on the main `https://<instance>/**` domain.**
Do **not** add it to the app-proxy subdomain (`*.domoapps.prodN.domo.com`) or to
third-party asset hosts (`cdndomo.com`, `fonts.gstatic.com`, `chameleon.io`):

- On the app proxy it breaks the iframe's own embed auth.
- On cross-origin hosts a custom header forces a CORS preflight those hosts reject,
  so fonts/scripts fail.

The app iframe authenticates itself via its embed session — leave its requests alone.

### What does NOT work

- `Authorization: Bearer <refreshToken>` or `Bearer <devToken>` → 401 (refresh token
  is not an access token).
- `X-DOMO-Developer-Token: <token>` (e.g. env `DOMO_<INST>_DEVELOPER_TOKEN`)
  authenticates data/REST API calls (200) but does **not** render the SPA — the web
  app needs the SID session. Use the developer token only for out-of-band `curl`
  diagnostics against `/api/query/v1/...`.

---

## Prerequisites

- Logged in via ryuu for the target instance (`domo login -i <instance>.domo.com -t <token>`),
  so the refresh token file exists.
- Playwright installed (globally is fine): `npm ls -g playwright`. If a run errors with
  a missing browser, run `npx playwright install chromium` (or `node <globalRoot>/playwright/cli.js install chromium`).
- Run node with the global modules resolvable: `export NODE_PATH="$(npm root -g)"`.

---

## Usage

The reusable script is `scripts/qa-shot.js`. It takes the instance, a page path (or
full URL), and an output PNG path:

```bash
export NODE_PATH="$(npm root -g)"
node .claude/skills/qa-headless-validate/scripts/qa-shot.js \
  wings-travel \
  /page/431190219/kpis/details/238173886 \
  /tmp/card_shot.png
```

It prints the final URL, the logged-in user (from the app-iframe URL), and the
app-iframe `innerText` (so you can assert on KPI values or spot "Loading…"), then
saves the screenshot. Read the PNG with the Read tool to view it.

**Waits:** the app iframe loads asynchronously; the script waits ~22s. Large data
apps may need more — bump `WAIT_MS` via the 4th arg if the app shows "Loading…".

---

## Diagnosing "renders but no data"

If the screenshot shows the app shell but blank KPIs / stuck "Loading…", the data
fetch is the problem, not auth. Probe the endpoint **inside the app iframe** (same
origin as the proxy, so `credentials:'include'` works). The script accepts a
`--probe "<SQL>"` flag that runs the SQL through the app proxy and reports
status/time/size/first bytes:

```bash
node .../qa-shot.js wings-travel /page/.../details/... /tmp/x.png --probe "SELECT COUNT(*) AS c FROM table"
```

### Pro-code SQL endpoint gotcha (important)

- **Use `POST /sql/v1/{alias}`** with the raw SQL as the request body
  (`Content-Type: text/plain`). Returns `{ columns:[...], rows:[[...]], metadata }`
  (array-of-arrays) fast.
- **Do NOT use `GET /data/v1/{alias}?sql=...`** — that is the *data API*, not a SQL
  interface. It **ignores** the `sql` param and streams the entire dataset, so the
  request returns `200` headers but the body never completes and `resp.json()` hangs
  forever → the app is stuck on placeholders. (This exact bug blanked the Wings
  Carbon Optimizer card.)
- Both `/sql/v1` and `/data/v1` accept only a **SQL subset** — no
  `YEAR()`/`MONTH()`/`CAST()`/`DATEDIFF()`. Use plain string/date comparisons.
- For permissive diagnostic SQL (supports `YEAR()` etc.) hit
  `POST /api/query/v1/execute/{datasetId}` out-of-band with the developer token.

---

## Guardrails

- **Never print, log, or commit the SID, access token, or refresh token.** The script
  keeps them in memory only. Redact when echoing anything.
- Do not write credentials to files; read the refresh token from the ryuu configstore
  at runtime.
- Kill stray browsers if a run times out: `pkill -f chromium; pkill -f qa-shot`.
- This flow cannot pass MFA on its own, but the ryuu refresh token already represents
  an authenticated session, so MFA is not re-challenged.
- Headless Chromium will log benign CORS/CSP errors for third-party assets
  (fonts, chameleon.io, pendo) — ignore them; they don't affect the Domo app.

---

## Related skills

- **domo-login** / **app-tester** — the MCP-based path; prefer when `mcp-qa-testing` is up.
- **app-studio-pro-code** / **procode-app-build** — building the pro-code apps you validate here.
