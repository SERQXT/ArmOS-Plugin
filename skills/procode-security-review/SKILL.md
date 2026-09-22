---
name: procode-security-review
description: "Security review gate for Domo ProCode custom apps. Runs 70 checks across OWASP Top 10 (2021), OWASP LLM Top 10 (2025), OWASP Agentic Top 10 (2026), OWASP MCP Top 10 (2025), plus Domo-specific checks for SDK safety, manifest integrity, secrets exposure, CSRF, and sandbox compliance. Produces a structured pass/fail report with evidence, severity, and remediation. Use before deploying any ProCode app to a customer Domo instance. Triggers: 'security review', 'security audit', 'procode security check', 'run security review on the app', 'audit the app for security', 'OWASP check'."
maturity: beta
audience: [code]
---

# ProCode Security Review

Security audit gate for Domo ProCode custom apps (vanilla HTML/JS and React/Vite). This skill systematically reviews app source code for vulnerabilities before the app is released to a customer's Domo instance.

Adapted from the Domo internal security team's review checklists (115 backend + 37 frontend checks) and tailored for the ProCode app context: browser-side code running inside Domo's sandboxed iframe, using the Domo SDK (`ryuu.js`) for data access, optionally calling Domo AI APIs, and potentially using AppDB, Code Engine, and Workflows.

## Triggers

- "security review"
- "security audit"
- "procode security check"
- "run security review on the app"
- "audit the app for security"
- "OWASP check on the app"
- Automatically invoked as `stage-sec` in the 500 Apps pipeline

## When to Use

- **Before pushing a ProCode app to a customer Domo instance** -- this is the primary gate
- **Before deploying** in the procode-app-builder flow (Step 7f pre-deploy gate)
- **After significant iteration** on a deployed app (new features, AI integration, data wiring)
- **On demand** for any existing ProCode app codebase

## Inputs

- **App source directory** -- `code/` in 500 Apps pipeline, or the local workspace directory for standalone use
- **`manifest.json`** -- dataset mappings, collections, packages
- **`package.json`** (if React app) -- dependency list
- **Any `.env` / config files** in the app directory
- **Build output** (`index.html`, `assets/`, `dist/`) if available

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Active exploit path, data breach risk | Blocks deploy. Fix immediately. |
| HIGH | Significant vulnerability, likely exploitable | Blocks deploy. Fix before release. |
| MEDIUM | Defense-in-depth gap, not immediately exploitable | Fix before next release. Does not block. |
| LOW | Best practice violation, minimal risk | Log and batch. Does not block. |

**Deploy gate:** Any CRITICAL or HIGH finding blocks deployment to the customer instance. The app stays on the internal instance until all blocking findings are resolved.

---

## Audit Methodology

### Step 1 -- Reconnaissance

Before running checks, read these files if present:

- `manifest.json` -- dataset mappings, app name, size config, collections, packages
- `package.json` / `package-lock.json` -- dependencies, scripts
- `index.html` -- entry point, script includes, CDN resources
- `.env`, `.env.example`, `.env.local` -- environment variables
- `app.js` / `src/App.tsx` / `src/main.tsx` -- main application logic
- `vite.config.ts` / `vite.config.js` -- build configuration
- Any file with "auth", "token", "api", "fetch", "config", "secret" in the name

Note the following for context:
- Template type (vanilla HTML/JS or React/Vite)
- Whether Domo AI API is used (`domo.post('/api/ai/v1/text/generation', ...)`)
- Whether AppDB is used (collections in manifest, `domo.post('/domo/datastores/...')`)
- Whether Code Engine is used (packages in manifest)
- Whether external APIs are called (any `fetch()` outside `domo.get()`/`domo.post()`)
- Whether PII is handled
- Whether user input is accepted (forms, search, filters with custom input)

### Step 2 -- Systematic Checks

Run every check below in order. For each check:
1. Search the codebase for relevant patterns using Grep and file reading
2. Read suspicious files to verify
3. Determine: PASS, FAIL, REVIEW, or N/A
4. For FAIL: record exact file path, line number, and code snippet as evidence

### Step 3 -- Report

Output the full structured report to `artifacts/SECURITY-REVIEW.md` (500 Apps pipeline) or the current directory (standalone).

### Step 4 -- Auto-Fix

After the report, attempt to fix all CRITICAL and HIGH findings:
1. Apply the fix directly in the source code
2. Re-run the specific check to verify the fix resolved the finding
3. Update the report with the fix status
4. If a fix cannot be applied automatically (requires architectural change or human decision), flag it in the report with `MANUAL FIX REQUIRED`

---

## The 70 Checks

### CATEGORY 1: INJECTION & DOM SECURITY

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| DOM-001 | dangerouslySetInnerHTML Without Sanitization | Grep: `dangerouslySetInnerHTML`. If found, verify DOMPurify or equivalent sanitizes input before injection. Any `dangerouslySetInnerHTML={{ __html: userContent }}` without `DOMPurify.sanitize()` is a FAIL. | Critical |
| DOM-002 | eval() / Function() / document.write() | Grep: `eval(`, `new Function(`, `document.write(`, `setTimeout("`, `setInterval("`. Verify none of these receive user-controlled data. | Critical |
| DOM-003 | innerHTML / outerHTML with User Data | Grep: `\.innerHTML\s*=`, `\.outerHTML\s*=`. Verify these never receive unsanitized user input. React JSX auto-escapes -- flag only raw DOM manipulation. | High |
| DOM-004 | Template Literal to HTML | Template literals with user data assigned to innerHTML or used in DOM APIs without sanitization. | High |
| DOM-005 | postMessage Without Origin Check | Grep: `addEventListener.*message`. Verify `event.origin` is checked before processing. Domo apps in iframes receive postMessage from the parent -- origin must be validated. | High |
| DOM-006 | javascript: URL Scheme in Links | Grep: `href=`, `src=`, `window.location`, `window.open`. Verify user-controlled data cannot inject `javascript:` scheme into link/src attributes. `<a href={userInput}>` in React is NOT auto-escaped for URL schemes -- `javascript:alert(1)` executes on click. Block via URL validation or allowlist (`https:` only). | Critical |
| DOM-007 | SVG Injection | If the app renders user-supplied SVG (inline or via upload): verify `<script>`, `<foreignObject>`, `onload=`, and event handler attributes are stripped before insertion. SVG is a full XML document that can contain executable JavaScript. Sanitize with DOMPurify configured for SVG. | High |
| DOM-008 | iframe srcdoc Injection | Grep: `srcdoc=`, `srcdoc`. If an iframe's `srcdoc` attribute is built from user input, the content executes as a full HTML document with script capability. Must sanitize before injection. | High |

### CATEGORY 2: SECRETS & SENSITIVE DATA EXPOSURE

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| SEC-001 | API Keys / Tokens Hardcoded in Source | Grep: `api_key`, `apiKey`, `API_KEY`, `secret`, `token`, `Bearer ` as string literals (not env var references). Check all `.js`, `.ts`, `.jsx`, `.tsx`, `.html` files. | Critical |
| SEC-002 | Domo Developer Token in Code | Grep: `X-DOMO-Developer-Token`, `domo.com/oauth`, developer token patterns. ProCode apps authenticate via the iframe -- tokens in code are never needed and always a leak. | Critical |
| SEC-003 | Secrets in .env Files (Committed) | `.env` files with real secrets committed to the repo. Check if `.env` is in `.gitignore`. Check `VITE_` prefixed vars for secrets that ship to the browser bundle. | Critical |
| SEC-004 | Sensitive Data in localStorage / sessionStorage | Grep: `localStorage.setItem`, `sessionStorage.setItem`. Verify auth tokens, PII, and API keys are not stored client-side. Domo handles auth -- apps should not manage their own tokens. | High |
| SEC-005 | Sensitive Data in URL Parameters | User IDs, tokens, or PII passed as URL query params (`?token=`, `?userId=`). These leak in Referer headers and server logs. | High |
| SEC-006 | Credentials in Console Logs | Grep: `console.log.*token`, `console.log.*password`, `console.log.*secret`, `console.log.*key`. Sensitive data logged to browser console is visible to any user with DevTools. | High |
| SEC-007 | Secrets in Git History | Check if `.env`, `.pem`, `credentials.json`, or files containing secrets were ever committed to git (even if now in `.gitignore`). Run `git log --all --diff-filter=A -- '*.env' '.env*' '*.pem' 'credentials.json'` if git is available. A rotated-but-not-revoked leaked key is still exploitable. | High |
| SEC-008 | Weak Random Sources for Security | Grep: `Math.random()`. If used for security-sensitive purposes (generating tokens, session IDs, nonces, OTP codes), flag as FAIL. Must use `crypto.getRandomValues()` (browser) or `crypto.randomBytes()` (Node.js/Code Engine). `Math.random()` is predictable and not cryptographically secure. | High |

### CATEGORY 3: DOMO SDK & PLATFORM SAFETY

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| DOMO-001 | Manifest Mapping Integrity | Verify `manifest.json` uses `mapping` (not `datasetsMapping`), `collections` (not `collectionsMapping`), `packages` (not `packagesMapping`). Wrong keys cause silent data binding failures. | High |
| DOMO-002 | Direct fetch() Instead of domo.get()/domo.post() | Grep: `fetch(` calls that bypass the Domo SDK. All data access should go through `domo.get()`/`domo.post()` which handles auth and CORS. Direct `fetch()` to external APIs may leak data or fail silently. | High |
| DOMO-003 | Unmapped Dataset Access | Grep: `domo.get('/data/v1/` and verify each alias is mapped in `manifest.json`. Unmapped aliases fail silently, potentially causing the app to show stale/empty data without error. | Medium |
| DOMO-004 | SQL Injection via domo.get() | Grep: `domo.get('/data/v1/` with string concatenation or template literals embedding user input in SQL queries. Use parameterized patterns or input sanitization. | Critical |
| DOMO-005 | AppDB Document Injection | If AppDB is used: verify user input written to AppDB collections is validated/sanitized. Grep: `domo.post('/domo/datastores/` with unsanitized user input in the document body. | High |
| DOMO-006 | Native Modals (confirm/alert/prompt) | Grep: `confirm(`, `alert(`, `prompt(` function calls. These are blocked by Domo's iframe sandbox and fail silently -- the app appears to work but confirmation dialogs never show, potentially allowing unconfirmed destructive actions. | Medium |
| DOMO-007 | ryuu.js SDK Missing or Wrong Source | Verify `index.html` includes `<script src="https://unpkg.com/ryuu.js"></script>`. Flag if missing, using `cdn.domo.com/domo.js` (403 risk), or loaded after app scripts (undefined `domo` global). | High |

### CATEGORY 4: AUTHENTICATION & SESSION

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| AUTH-001 | Custom Auth Bypassing Domo | Grep: `login`, `authenticate`, `jwt`, `session`, `cookie`. ProCode apps inherit Domo's auth -- custom auth layers are unnecessary and potentially insecure. Flag any custom auth implementation. | High |
| AUTH-002 | User Identity Exposure | Grep: `domo.env.userId`, `domo.env.userName`. Verify user identity from the SDK is not exposed to other users, logged insecurely, or sent to external services. | Medium |
| AUTH-003 | Role/Permission Bypass | If the app implements role-based views: verify role checks happen on every data access path, not just UI hiding. Client-side-only role checks are bypassable via DevTools. | High |
| AUTH-004 | Token Expiration and Refresh Handling | If the app manages any tokens (custom auth, API tokens, refresh tokens): verify tokens have expiration handling, expired tokens force re-auth (not silently ignored), and refresh logic does not extend sessions indefinitely. Grep: `token`, `expire`, `refresh`, `setInterval` near auth code. | Medium |
| AUTH-005 | Persistent Session / Remember-Me Security | If the app stores an indefinitely-valid token in localStorage for "remember me" or persistent login: flag as HIGH. Persistent tokens must use secure, httpOnly, SameSite cookies with appropriate max-age -- not unbounded localStorage tokens accessible to any XSS. | High |

### CATEGORY 4B: CSRF & REQUEST FORGERY

If the app only uses `domo.get()`/`domo.post()` for all requests (no direct `fetch()` with credentials), mark all as N/A -- the Domo SDK handles CSRF protection internally. These checks apply when the app makes direct cross-origin requests with `credentials: 'include'` or sets cookies.

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| CSRF-001 | CSRF Token on State-Changing Requests | State-changing requests (POST/PUT/PATCH/DELETE) via direct `fetch()` include a CSRF token in header or body. Grep: `credentials: 'include'`, `withCredentials: true` on state-changing calls without `X-CSRF-Token` or equivalent. If SameSite cookies provide equivalent protection, note as mitigated. | High |
| CSRF-002 | SameSite Cookie Attribute | If the app sets cookies (directly or via a Code Engine backend): verify auth cookies use `SameSite=Strict` or `SameSite=Lax`. Grep: `document.cookie`, `Set-Cookie`, cookie-setting code. | High |
| CSRF-003 | Credentials on Cross-Origin Fetch | Grep: `credentials: 'include'`, `withCredentials: true`. If present on cross-origin requests, verify the target server has specific origin CORS (not wildcard `*`). `credentials: include` with CORS `*` is a browser-enforced error, but misconfiguration attempts indicate confused auth design. | Medium |

### CATEGORY 5: INPUT VALIDATION

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| INPUT-001 | Form Input Validation | Forms validate inputs for type, length, and format before submission or processing. | Medium |
| INPUT-002 | File Upload Validation | If file uploads exist: validate file type (MIME, not just extension), size limits, no executable uploads. Grep: `<input type="file"`. | High |
| INPUT-003 | URL Parameter Sanitization | URL parameters / hash values used in DOM operations are sanitized before use. Grep: `useParams`, `useSearchParams`, `location.search`, `location.hash` flowing into JSX or DOM APIs. | High |
| INPUT-004 | Search/Filter Input Sanitization | If user search or filter input is used in SQL queries via `domo.get()`, verify it is sanitized against injection. Grep: search input flowing into `domo.get('/data/v1/...?sql=')`. | Critical |

### CATEGORY 6: CONTENT SECURITY POLICY & SUBRESOURCE INTEGRITY

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| CSP-001 | CSP Meta Tag Presence | Check `index.html` for `<meta http-equiv="Content-Security-Policy">`. If absent, note the Domo iframe provides some CSP -- but app-level CSP adds defense in depth. | Medium |
| CSP-002 | Subresource Integrity on CDN Scripts | External scripts loaded via CDN (`Chart.js`, `Tailwind`, `ryuu.js`) should have `integrity` and `crossorigin` attributes. Grep: `<script src="http`. CDN scripts without SRI are supply chain risk. | Medium |
| CSP-003 | Inline Script Usage | Grep: `<script>` tags with inline JavaScript (not `src=`). Inline scripts break CSP and are harder to audit. Prefer external script files. | Low |

### CATEGORY 7: DEPENDENCY & SUPPLY CHAIN

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| DEP-001 | Known CVEs in Dependencies | Review `package.json` for packages with known vulnerabilities. Flag outdated major versions of security-sensitive packages (e.g., `axios < 1.6`, `lodash < 4.17.21`, React < 18). | High |
| DEP-002 | Unpinned Major Versions | `package.json` dependencies using `*` for version ranges on security-sensitive packages. | Medium |
| DEP-003 | Suspicious or Typosquatted Packages | Package names that closely resemble popular packages but are slightly different (e.g., `crossenv` vs `cross-env`). | High |
| DEP-004 | Abandoned Dependencies | Dependencies with no updates in 2+ years, no active maintainer, or deprecated status. | Medium |

### CATEGORY 8: CORS & NETWORK

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| NET-001 | Cross-Origin Requests Without Domo SDK | `fetch()` or `XMLHttpRequest` calls to external domains without going through `domo.get()`/`domo.post()`. These bypass Domo's auth proxy and may leak data. | High |
| NET-002 | Mixed Content (HTTP on HTTPS) | Resources loaded over HTTP on an HTTPS page. Grep: `http://` in JS/HTML files (not `https://`). | High |
| NET-003 | Open Redirect via User Input | Redirects using user-controlled URLs without validation. Grep: `window.location =`, `window.open(`, navigation with user-controlled values. | High |
| NET-004 | CORS Wildcard on Custom Endpoints | If the app includes a Code Engine backend: check for `Access-Control-Allow-Origin: *` on endpoints that handle authenticated data. | High |

### CATEGORY 9: FRAMEWORK-SPECIFIC (React / Vite / Domo)

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| FW-001 | BrowserRouter Instead of HashRouter | If React Router is used in a Domo app: `BrowserRouter` requires server-side routing not available in Domo. Must use `HashRouter`. Grep: `BrowserRouter`, `createBrowserRouter`. | High |
| FW-002 | Vite base Path Misconfiguration | If Vite-based: `vite.config.ts` must have `base: './'` for Domo deployment. Absent causes broken asset paths. | Medium |
| FW-003 | type="module" on Script Tags | Grep: `type="module"` in `index.html`. Domo CDN serves JS as `application/octet-stream`, breaking ESM imports. Must use IIFE format. | High |
| FW-004 | SSR/Server Components in Domo App | Grep: `getServerSideProps`, `getStaticProps`, `'use server'`, Next.js App Router patterns. Domo apps are client-side only. | High |
| FW-005 | React Error Boundary Missing | If React app: verify an ErrorBoundary wraps the root component. Without it, any render error shows a blank white page with no feedback. | Medium |

### CATEGORY 10: AI / LLM SAFETY

If no AI/LLM integration detected (no `domo.post('/api/ai/v1/text/generation')`, no direct LLM API calls), mark all as N/A.

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| AI-001 | Prompt Injection via User Input | User input concatenated directly into prompts sent to Domo AI API without isolation or sanitization. Grep: template literals or string concatenation building prompt bodies with user-provided values. | Critical |
| AI-002 | LLM Output Rendered as Unsanitized HTML | Model response piped to `dangerouslySetInnerHTML`, `innerHTML`, or Markdown-to-HTML without sanitization. Direct XSS vector via LLM response manipulation. | Critical |
| AI-003 | System Prompt / API Keys in Client Bundle | System prompts, model parameters, or API keys hardcoded in JS that ships to the browser. Extractable via DevTools. | Critical |
| AI-004 | AI Response Caching Without Isolation | AI-generated content cached in AppDB or localStorage without per-user namespacing. Cross-user data leakage risk. | High |
| AI-005 | Unbounded AI API Calls | No rate limiting or cost cap on Domo AI API calls. User actions can trigger unlimited AI requests. | Medium |
| AI-006 | AI Output Used for Navigation/Actions Without Validation | AI-generated output used to construct URLs, trigger actions, or make decisions without human review or validation against an allowlist. | High |
| AI-007 | PII Sent in AI Prompts Without Redaction | User PII (names, emails, SSNs, addresses, phone numbers) included in prompts sent to Domo AI API without redaction or minimization. Grep: prompt-building code that incorporates user data fields. Only fields strictly necessary for the AI task should be included. Sensitive fields must be redacted or anonymized before prompt construction. | High |

### CATEGORY 11: OWASP BACKEND SUBSET (Code Engine / Server-Side)

If no Code Engine functions or server-side code detected, mark all as N/A.

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| BE-001 | SQL Injection in Code Engine | String concatenation or template literals in SQL queries within Code Engine functions. Must use parameterized queries. | Critical |
| BE-002 | Command Injection | Grep: `exec(`, `eval(`, `child_process`, `shell: true` in Code Engine code. Verify user input cannot reach these. | Critical |
| BE-003 | SSRF via User-Controlled URL | Code Engine functions that fetch URLs provided by user input without allowlist validation. | High |
| BE-004 | Missing Input Validation | Code Engine endpoints that process request body/params without type, length, or format validation. | High |
| BE-005 | Sensitive Data in Code Engine Logs | Code Engine function logs containing tokens, PII, or secrets. | High |
| BE-006 | Missing Rate Limiting | Code Engine endpoints with no rate limiting on resource-intensive operations. | Medium |
| BE-007 | Hardcoded Secrets in Code Engine | API keys, database credentials, or tokens hardcoded in Code Engine function source instead of environment variables. | Critical |
| BE-008 | Insecure Deserialization | `JSON.parse()` on untrusted input used to construct objects with methods, or `eval()`-style parsing of serialized data. | High |

### CATEGORY 12: DATA PRIVACY (if PII detected)

If no PII handling detected, mark all as N/A with note.

| ID | Check | What to Look For | Severity |
|----|-------|-----------------|---------|
| PII-001 | PII Displayed Without Masking | Full SSN, credit card numbers, or other PII displayed in the UI without masking (e.g., showing `***-**-1234` instead of full value). | High |
| PII-002 | PII in Client-Side Storage | PII stored in localStorage, sessionStorage, or cookies. | High |
| PII-003 | PII Sent to External Services | PII included in calls to external APIs, analytics, or error tracking services. | High |
| PII-004 | PII in Console Logs | PII logged via `console.log()` or similar. | Medium |

---

## Output Format

Produce the following Markdown report. Save to `artifacts/SECURITY-REVIEW.md` (500 Apps pipeline) or the working directory (standalone).

```markdown
# ProCode Security Review: [App Name from manifest.json]

**Date**: [Today's date]
**Auditor**: ProCode Security Review (automated)
**App Type**: [Vanilla HTML/JS | React/Vite]
**Instance**: [Internal / Customer]
**Frameworks**: OWASP Top 10 (2021) . OWASP LLM Top 10 (2025) . OWASP Agentic Top 10 (2026) . Domo ProCode Security

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Checks | 70 |
| PASS | X |
| FAIL | X |
| REVIEW NEEDED | X |
| N/A | X |
| **Overall Risk Level** | Critical / High / Medium / Low |

### Deploy Gate Verdict

**[BLOCK DEPLOY / PROCEED WITH CAVEATS / CLEAR TO DEPLOY]**

[One sentence explaining the verdict]

---

## Critical & High Findings (Must Fix Before Deploy)

[List each CRITICAL and HIGH finding with ID, check name, file:line, and one-line summary. If none: "No blocking findings -- clear to deploy."]

---

## Security Checklist

[Full checklist tables organized by category, same format as the check tables above but with Status, Location, and Finding columns filled in]

---

## Detailed Findings

[For every FAIL and REVIEW: full finding block with Description, Code Evidence, Attack Scenario, Remediation code, and whether auto-fix was applied]

---

## Auto-Fix Summary

| ID | Finding | Fix Applied | Verified |
|----|---------|-------------|----------|
[List each auto-fixed finding with before/after and verification status]

---

## Coverage Summary

| Category | Total | Passed | Failed | Review | N/A |
|----------|-------|--------|--------|--------|-----|
| Injection & DOM | 8 | | | | |
| Secrets & Data Exposure | 8 | | | | |
| Domo SDK & Platform | 7 | | | | |
| Auth & Session | 5 | | | | |
| CSRF & Request Forgery | 3 | | | | |
| Input Validation | 4 | | | | |
| CSP & SRI | 3 | | | | |
| Dependencies | 4 | | | | |
| CORS & Network | 4 | | | | |
| Framework-Specific | 5 | | | | |
| AI / LLM Safety | 7 | | | | |
| Backend (Code Engine) | 8 | | | | |
| Data Privacy | 4 | | | | |
| **TOTAL** | **70** | | | | |

---

## Remediation Timeline

| Severity | Count | Action | Timeline |
|----------|-------|--------|----------|
| CRITICAL | X | Must fix -- blocks deploy | Immediate |
| HIGH | X | Must fix -- blocks deploy | Before release |
| MEDIUM | X | Should fix | Next iteration |
| LOW | X | Consider fixing | Backlog |
| REVIEW | X | Manual validation required | Before next audit |
```

---

## Failure Modes to Avoid

1. **Do not skip checks.** Every row must be filled in -- PASS, FAIL, REVIEW, or N/A.
2. **React JSX auto-escapes -- do not false-positive.** `<div>{userInput}</div>` in React JSX is safe. Only flag raw DOM manipulation.
3. **Do not mark PASS without evidence.** State what you read that confirms the control.
4. **Do not mark FAIL without a code snippet.** Evidence is mandatory.
5. **Domo-specific checks are critical.** SDK misuse, manifest errors, and sandbox violations are the most common real-world ProCode app failures.
6. **N/A categories still require a note.** If AI checks are N/A, state "No AI integration detected." If Code Engine checks are N/A, state "No Code Engine functions detected."
7. **Auto-fix must be verified.** After applying a fix, re-run the check. Do not assume the fix worked.

---

## 500 Apps Pipeline Integration

When invoked as `stage-sec` in the 500 Apps pipeline:

1. Read `code/` directory and `manifest.json` as the app source
2. Read `artifacts/MVP2-NOTES.md` or `artifacts/MVP-V1-NOTES.md` for build context
3. Run all 70 checks
4. Write report to `artifacts/SECURITY-REVIEW.md`
5. Auto-fix CRITICAL and HIGH findings in `code/`
6. If any CRITICAL or HIGH findings remain after auto-fix, the pipeline pauses (`paused_checkpoint`) for human review
7. Emit checkpoint: `@500apps-pipeline checkpoint=stage-sec status=complete`

## Standalone Use (ProCode App Builder)

When invoked from the `procode-app-builder` skill as Step 7f (pre-deploy gate):

1. Use the current app workspace directory as the source
2. Run all 70 checks
3. Write report to the workspace directory as `SECURITY-REVIEW.md`
4. Auto-fix CRITICAL and HIGH findings
5. Present the summary to the user with the deploy gate verdict
6. If CLEAR TO DEPLOY or PROCEED WITH CAVEATS, the procode-app-builder proceeds to deploy (Step 8)
7. If BLOCK DEPLOY (CRITICAL/HIGH findings remain), the deploy is blocked until findings are resolved

---

## Related Skills

- **ProCode App Builder** (Build) -- the primary build skill that invokes this review as Step 7f (pre-deploy gate)
- **App Tester** (Build) -- functional QA; security review covers vulnerability audit
- **ProCode App Fixer** (Build) -- for structural fixes that the security review identifies but cannot auto-fix
- **Dashboard Builder** (Build) -- if security issues are found in dashboard-embedded apps
