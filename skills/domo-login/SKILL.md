---
name: domo-login
tier: 1
description: "Reliable Domo login using the qa_domo_login MCP tool with Angular-compatible form handling. Trigger with 'log into Domo', 'authenticate with Domo', 'I need to access Domo', or before any browser-based Domo operation."
maturity: alpha
audience: [delivery]
---

# Domo Login

Reliable login to Domo instances using the `qa_domo_login` MCP tool. Handles Angular's single-page app login form quirks, password escaping, and post-login verification. This skill should be invoked before any browser-based Domo operation (screenshots, app testing, UI navigation).

## Triggers

- "log into Domo"
- "authenticate with Domo"
- "I need to access Domo"
- "connect to the Domo instance"
- Any skill that requires browser-based Domo access (app-tester, domo-browser-actions)

---

## The One-Step Login

Use the `qa_domo_login` MCP tool. It handles all Angular quirks internally:

```
qa_domo_login(
  instance: "mycompany",       // e.g., "mycompany" for mycompany.domo.com
  username: "user@email.com",
  password: "the-password",
  timeout: 30                  // seconds to wait for redirect (default: 30)
)
```

**Returns on success:**
```json
{
  "success": true,
  "instance": "mycompany",
  "base_url": "https://mycompany.domo.com",
  "current_url": "https://mycompany.domo.com/page/..."
}
```

**Returns on failure:**
```json
{
  "success": false,
  "error": "Login failed -- still on auth page after timeout",
  "current_url": "https://mycompany.domo.com/auth/index",
  "hint": "Check credentials. If MFA is enabled, this flow cannot handle it automatically."
}
```

---

## Angular Login Rules

Domo's login page is an Angular single-page application. This creates specific requirements:

### Why `page.type()` and NOT `page.fill()`

| Method | Angular Compatible? | Why |
|--------|-------------------|-----|
| `page.fill()` alone | **No** | Angular's change detection does not fire. The form model stays empty even though the input shows text. The Sign In button remains disabled. |
| `page.fill()` + `dispatchEvent('input')` + `dispatchEvent('change')` | **Yes** | Forces Angular to detect the model update. Works but is fragile. |
| `page.type()` with `{ delay: 30 }` | **Yes** | Simulates real keystrokes one at a time. Angular processes each keystroke. Most reliable method. |
| `page.evaluate()` to set `.value` directly | **Sometimes** | Bypasses Angular entirely. The form validation may not trigger, leaving the button disabled. |

The `qa_domo_login` tool uses `page.type()` with a 30ms delay between keystrokes. This is the most reliable approach.

### Login URL

Always navigate to `/auth/index`, not `/auth/login` or `/auth`. The `/auth/index` route is the canonical entry point for Domo's login flow.

### Login Selectors

| Element | Selector | Notes |
|---------|----------|-------|
| Username input | `input[name="username"]` | Always present on the login form |
| Password input | `input[name="password"]` | Appears after username is populated |
| Sign In button | `button.sign-in` | Primary selector |
| Sign In (fallback) | `button:has-text("Sign In")` | Text-based fallback |
| Sign In (fallback 2) | `button[type="submit"]` | Type-based fallback |

### Password Special Characters

Passwords containing `!` get mangled by zsh when passed through environment variables. The `qa_domo_login` tool automatically strips the backslash escaping:

```javascript
// Automatic cleanup inside the tool:
const cleanPassword = password.replace(/\\!/g, '!');
```

If passing passwords manually, ensure they are not double-escaped.

---

## Troubleshooting

### Login Times Out (Still on /auth)

| Possible Cause | Diagnosis | Fix |
|---------------|-----------|-----|
| Wrong credentials | Check the current_url — if still on `/auth/index`, credentials are likely wrong | Verify username and password |
| MFA enabled | The login page redirects to an MFA challenge instead of the dashboard | MFA cannot be automated via browser. Call `authenticate_instance` which handles OAuth (including MFA) via the user's own browser |
| Instance name wrong | The page shows a Domo 404 or generic error | Verify the instance name (the subdomain in `{instance}.domo.com`) |
| Network timeout | The page takes too long to load Angular assets | Increase timeout, or check network connectivity |
| Account locked | Too many failed login attempts | Wait 15-30 minutes, or contact Domo admin |

### Login Succeeds But Page Doesn't Load

After login, the browser is redirected to the Domo homepage. If subsequent navigation fails:

1. **Check the session:** Take a screenshot with `qa_screenshot` to see what page the browser is on
2. **Check the URL:** If the URL contains `/auth`, the login didn't actually succeed (session expired immediately)
3. **Wait for redirect:** Some Domo instances take 5-10 seconds to complete the post-login redirect. Use `qa_navigate` with a longer timeout

### Password Contains Special Characters

Beyond `!`, these characters can also cause issues in shell/env var contexts:

| Character | Issue | Workaround |
|-----------|-------|------------|
| `!` | zsh history expansion | Escape or use single quotes |
| `$` | Variable interpolation | Escape or use single quotes |
| `\` | Escape character | Double the backslash |
| `` ` `` | Command substitution | Escape or use single quotes |
| `"` | Quote termination | Escape with backslash |

When in doubt, pass the password directly as a tool parameter rather than through environment variables.

---

## What You Can Do After Login

Once logged in, the browser session is authenticated. You can:

| Action | Tool | Example |
|--------|------|---------|
| Navigate to any Domo page | `qa_navigate` | `qa_navigate(url: "https://mycompany.domo.com/page/12345")` |
| Navigate to a custom app | `qa_domo_app_navigate` | `qa_domo_app_navigate(instance: "mycompany", app_id: "67890")` |
| Take screenshots | `qa_screenshot` | `qa_screenshot(name: "dashboard", full_page: true)` |
| Interact with the Domo UI | `qa_action` | `qa_action(action: "click", selector: ".kpi_title")` |
| Capture network traffic | `qa_capture_network` | `qa_capture_network(action: "start")` |
| Assert DOM state | `qa_assert` | `qa_assert(assertion: "exists", selector: ".card-widget")` |
| Make API calls via session auth | Use `page.evaluate` with `credentials: 'include'` | Session auth works for all API endpoints |

**Session persistence:** The browser session persists across tool calls within the same MCP session. You do not need to re-login between navigation actions. The session lasts until `qa_close_session` is called or the MCP server restarts.

---

## Convenience Tool: Login + Screenshot in One Call

For quick visual checks, use the all-in-one tool:

```
qa_domo_page_screenshot(
  instance: "mycompany",
  username: "user@email.com",
  password: "the-password",
  page_url: "/page/12345",
  wait_seconds: 10,
  screenshot_name: "dashboard-check"
)
```

This handles login, navigation, render wait, and screenshot capture in a single tool call.

---

## Guardrails

- **Always use `qa_domo_login`, not manual Playwright scripting.** The tool handles all Angular quirks, password escaping, and retry logic.
- **Check the `success` field in the response.** Do not assume login succeeded. If `success` is false, stop and report the error.
- **Do not store credentials in files.** Pass credentials as tool parameters. The MCP server handles them in memory only.
- **Close the session when done.** Call `qa_close_session` after testing to free browser resources and clear the authenticated session.
- **MFA blocks browser automation.** If the Domo instance requires MFA, browser-based automation cannot proceed. Call `authenticate_instance` instead — it opens the user's real browser for OAuth (which handles MFA natively).

---

## MCP Server Required

- **mcp-qa-testing** — provides `qa_domo_login` and all browser automation tools

---

## Related Skills

- **Domo Browser Actions** (Build) — navigation and interaction patterns after login
- **App Tester** (Build) — uses login as the first step in app testing
- **Domo Navigator** (Build) — comprehensive Domo UI automation reference
