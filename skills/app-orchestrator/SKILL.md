---
name: app-orchestrator
tier: 2
description: "Route app-building requests to the right skill based on requirements — Code Engine for serverless functions, ProCode App Builder for UI apps (vanilla or React), AppDB Manager for storage. Trigger with 'build me an app', 'I need a custom app', 'create an application in Domo', or any request to build a Domo application."
maturity: beta
status: archived
audience: [orchestration, code]
---

# App Orchestrator

Decision tree and lifecycle coordinator for building Domo applications. Analyzes the user's requirements and routes to the correct skill(s): Code Engine Builder for serverless functions, ProCode App Builder for UI apps (vanilla or React), AppDB Manager for persistent storage, and App Tester for verification.

## Triggers

- "build me an app"
- "I need a custom app in Domo"
- "create an application"
- "I need a serverless function"
- "build a webhook handler"
- "create a simple app"
- "build a complex app with React"
- "I need app storage"

---

## Tools Required

This skill is a **routing orchestrator** — it delegates to sub-skills rather than calling tools directly. However, it needs to verify that the target skill's MCP servers are available before routing.

| Sub-Skill | MCP Server Required | Verify With |
|-----------|-------------------|-------------|
| Code Engine Builder | domo-codeengine | `codeengine_health_check` |
| ProCode App Builder | domo-datasets | `health_check` |
| AppDB Manager | domo-appdb | `health_check` |
| Dashboard Builder | domo-pages, domo-datasets | Tool availability check |
| Jupyter Builder | domo-jupyter | `jupyter_health_check` |

**Pre-flight:** Before routing, verify the target skill's MCP server is available. If the server is unavailable, STOP and report which tools are missing rather than routing to a skill that will fail.

## If Tools Are Unavailable

If any required tool is not available (returns "unknown tool" error or is missing from allowed tools):

1. **Check credentials**: The customer's Domo instance may not be configured. Ask the user to verify their Domo connection.
2. **Continuation mode**: If you're in a continuation turn, read-only tools (dataset_list, dataset_query, search) are stripped. Use data from the checkpoint context instead of re-querying.
3. **Report the gap**: Tell the user which specific tool is unavailable and why the workflow can't proceed without it.
4. **Never guess**: Do not attempt to call tools that aren't available. Do not try alternative endpoints or raw API calls.

---

## Step 0: Request Classification Guard

Before routing, classify the request to prevent misrouting:

**Route to Dashboard Builder** (App Studio / dashboards / reporting):
- Keywords: "app studio", "dashboard", "reporting page", "cards", "kpi", "charts", "page layout", "data visualization"
- User says: "build me a dashboard", "create an app studio app", "make a page with charts"

**Route to Code Engine Builder** (serverless functions):
- Keywords: "serverless", "webhook", "function", "api endpoint", "cron job", "scheduled task"
- User says: "create a function", "build a webhook handler"

**Route to ProCode App Builder** (custom HTML/CSS/JS apps):
- Keywords: "custom app", "react app", "procode", "html app", "interactive application", "custom UI"
- User says: "build a custom app", "create a react application"

**Route to Jupyter Builder** (data science / notebooks):
- Keywords: "notebook", "jupyter", "python script", "R script", "data science", "ML model"

**If ambiguous** — ask: "I want to make sure I build the right thing. Are you looking for (a) a data dashboard with charts and KPIs, (b) a custom interactive web app, or (c) a serverless function/API?"

**NEVER route "App Studio" to ProCode.** App Studio is Domo's no-code dashboard builder. ProCode is custom HTML/CSS/JS. They are completely different.

---

## Decision Tree

> **CRITICAL: App Studio ≠ Pro-Code.** These are completely different Domo application types. App Studio is a no-code drag-and-drop dashboard builder (cards + layouts). Pro-Code is custom HTML/CSS/JS or React code deployed via CLI. If the user says "App Studio", ALWAYS route to Dashboard Builder — NEVER to ProCode App Builder.

```
User Request
    |
    |--- "App Studio" / "dashboard" / "reporting page" / "KPI dashboard" / "cards layout"
    |       |
    |       +---> dashboard-builder (with App Studio output type)
    |             (No-code: create cards via API, arrange layout, import into App Studio)
    |             THIS IS NOT PRO-CODE. Do NOT use procode-app-builder for this.
    |
    |--- "App Studio form" / "intake form" / "submission form in app studio" / "data entry form"
    |       |
    |       +---> dashboard-builder → build-appstudio → form-builder
    |             (No-code: App Studio form with auto-created backing dataset)
    |             NOT ProCode forms. App Studio has native form support.
    |
    |--- "workflow button" / "automation trigger button" / "WORKFLOW_START"
    |       |
    |       +---> dashboard-builder → build-appstudio (workflow widget binding)
    |             (Binds existing Domo Workflow model to App Studio button)
    |
    |--- "serverless function" / "webhook" / "scheduled task" / "data transformer"
    |       |
    |       +---> code-engine-builder
    |             (no UI needed — pure backend logic)
    |
    |--- "simple app" / "basic dashboard widget" / "single-page display"
    |       |
    |       +---> procode-app-builder (vanilla template)
    |             (HTML + CSS + JS, no build step, Phoenix charts)
    |
    |--- "complex app" / "multi-page" / "forms" / "state management" / "interactive"
    |       |
    |       +---> procode-app-builder (react template)
    |             (React + TypeScript, Vite build, component architecture)
    |
    |--- "jupyter notebook" / "data science" / "python workspace" / "ML model"
    |       |
    |       +---> jupyter-builder
    |             (serverless Jupyter environment with dataset I/O)
    |
    |--- "needs storage" / "save user settings" / "persist data" / "form submissions"
    |       |
    |       +---> appdb-manager FIRST, then the app skill
    |             (set up collections before building the app that uses them)
    |
    |--- unclear / mixed requirements
            |
            +---> Ask clarifying questions (see below)
```

---

## Routing Logic

### Signal Detection

Analyze the user's request for these signals:

| Signal | Routes To | Why |
|--------|-----------|-----|
| "App Studio", "dashboard", "reporting", "KPIs", "cards on a page" | **dashboard-builder** (App Studio output) | No-code dashboard — NOT Pro-Code. Never confuse these. |
| "form in App Studio", "intake form", "submission form", "data entry form" | **dashboard-builder** → build-appstudio → **form-builder** | App Studio native forms — NOT ProCode. Forms auto-create backing datasets. |
| "workflow button", "WORKFLOW_START", "automation trigger button" | **dashboard-builder** → build-appstudio (workflow widget binding) | Binds existing Domo Workflow model to an App Studio button |
| "webhook", "API endpoint", "cron", "scheduled", "background job" | **code-engine-builder** | No UI needed — pure serverless compute |
| "simple", "quick", "basic", "single page", "just show data" | **procode-app-builder (vanilla)** | Minimal complexity, no build tooling needed |
| "React", "components", "routing", "state management", "TypeScript" | **procode-app-builder (react)** | Complex UI needs component architecture |
| "multi-page", "tabs", "forms with validation", "real-time updates" | **procode-app-builder (react)** | These patterns are significantly easier in React |
| "save settings", "persist", "user preferences", "store form data" | **appdb-manager** first | Storage must exist before the app can use it |
| "charts", "visualizations", "Phoenix" | **procode-app-builder (vanilla)** unless complex | Phoenix CDN works in vanilla; React adds overhead |

### Clarifying Questions

If the request is ambiguous, ask:

1. **Is this a dashboard/reporting page or a custom coded application?**
   - Dashboard with cards, KPIs, charts arranged on a page = **Dashboard Builder** (App Studio output)
   - Custom interactive app with its own UI logic = **ProCode App Builder**
   - If the user says "App Studio" → ALWAYS Dashboard Builder. App Studio is Domo's no-code dashboard tool, NOT a code editor.

2. **Does this need a user interface?**
   - No UI = Code Engine Builder (serverless function)
   - Yes UI = ProCode App Builder or Dashboard Builder (see #1)

3. **How complex is the UI?**
   - Simple display / 1-2 interactions = Vanilla template
   - Forms, tabs, multi-page, heavy interactivity = React template

4. **Does it need to persist data between sessions?**
   - Yes = AppDB Manager (set up first), then the app skill
   - No = Skip AppDB

5. **Does it need to respond to external events?**
   - Yes (webhooks, scheduled triggers) = Code Engine Builder
   - No = ProCode App Builder

---

## Full Lifecycle Phases

### Phase 1: Requirements Analysis

1. Determine the primary deliverable (function, app, or both)
2. Identify data sources (Domo datasets, AppDB, external APIs)
3. Identify storage needs (AppDB collections)
4. Determine deployment target (Code Engine, Domo card/page, both)

### Phase 2: Infrastructure Setup

If storage is needed, set up AppDB first:

```
app-orchestrator
    |
    +---> appdb-manager
    |       |
    |       +--- Create collections for app state
    |       +--- Create collections for user preferences
    |       +--- Seed default configuration documents
    |
    +---> [proceed to Phase 3]
```

If a backend function is needed alongside the app:

```
app-orchestrator
    |
    +---> code-engine-builder
    |       |
    |       +--- Create the serverless function package
    |       +--- Release the initial version
    |       +--- Note the function URL for the app to call
    |
    +---> [proceed to Phase 3]
```

### Phase 3: App Development

Route to the correct app builder:

```
app-orchestrator
    |
    +---> procode-app-builder (vanilla OR react)
            |
            +--- Scaffold the app from template
            +--- Implement the UI logic
            +--- Wire up data sources (datasets, AppDB, Code Engine functions)
            +--- Deploy with `domo publish`
```

### Phase 4: Testing

After deployment, verify everything works:

```
app-orchestrator
    |
    +---> app-tester
            |
            +--- Login to Domo
            +--- Navigate to the deployed app
            +--- Screenshot verification
            +--- Console log check
            +--- Functional assertions
            +--- Generate test report
```

### Phase 5: Iteration

If testing reveals issues:

```
app-orchestrator
    |
    +---> [diagnose failure]
    |       |
    |       +--- Backend issue? ---> code-engine-builder (new version)
    |       +--- Storage issue? ---> appdb-manager (fix schema/data)
    |       +--- UI issue? -------> procode-app-builder (fix + redeploy)
    |
    +---> app-tester (re-verify)
```

---

## Multi-Skill Composition Examples

### Example 1: Form Submission App

User: "Build an app where users can submit project requests and track their status."

**Routing:** AppDB Manager + ProCode App Builder (React) + App Tester

```
Phase 2: appdb-manager
  - Create "project-requests" collection
  - Create "request-statuses" collection (seed with: pending, approved, rejected, in-progress, complete)
  - Create "user-drafts" collection (for auto-save)

Phase 3: procode-app-builder (react)
  - Scaffold React app with form components
  - Build: request form, status tracker, list view
  - Wire to AppDB collections via domo.get/post

Phase 4: app-tester
  - Verify form renders
  - Submit a test request
  - Verify it appears in the list
  - Check console for errors
```

### Example 2: Webhook Integration

User: "I need a webhook endpoint that receives Salesforce events and writes them to a Domo dataset."

**Routing:** Code Engine Builder only

```
Phase 3: code-engine-builder
  - Create webhook handler function
  - Parse Salesforce event payload
  - Write to Domo dataset via domo SDK
  - Release version

Phase 4: app-tester (via network capture)
  - Send test webhook payload
  - Verify dataset receives the data
```

### Example 3: Dashboard Widget with Preferences

User: "Create a card that shows KPIs with user-selectable date ranges and remembers the last selection."

**Routing:** AppDB Manager + ProCode App Builder (vanilla)

```
Phase 2: appdb-manager
  - Create "widget-preferences" collection

Phase 3: procode-app-builder (vanilla)
  - Scaffold vanilla app with Phoenix charts
  - Add date range selector
  - Read/write preferences to AppDB on selection change
  - Display KPIs from dataset

Phase 4: app-tester
  - Verify KPIs render
  - Change date range
  - Refresh — verify selection persists
```

---

## Guardrails

- **NEVER confuse App Studio with Pro-Code.** App Studio = no-code dashboard builder (cards + layout). Pro-Code = custom HTML/CSS/JS or React deployed via CLI. If the user mentions "App Studio", route to Dashboard Builder with App Studio output type. If you're unsure, ASK — don't default to Pro-Code.
- **Always set up storage before building the app that uses it.** AppDB collections must exist before the app references them in `manifest.json`.
- **Always set up backend functions before building the app that calls them.** The app needs the function URL at development time.
- **Default to vanilla for simple apps.** React adds build complexity. If the app is a single page with a chart and a filter, vanilla is faster to build and deploy.
- **Default to React for complex apps.** Forms, multi-page routing, and state management are dramatically easier with React than vanilla JS.
- **Always test after deployment.** The app-tester phase is not optional. Apps that work on localhost frequently break in the Domo iframe context.
- **Route explicitly.** State which skill you are invoking and why. The user should understand the decision.

---

## Skills Composed

| Skill | Role in Orchestration |
|-------|----------------------|
| **Code Engine Builder** | Backend serverless functions |
| **ProCode App Builder** | Frontend UI applications (vanilla or React) |
| **AppDB Manager** | Persistent document storage |
| **App Tester** | Post-deployment verification |
| **Dashboard Builder** | No-code dashboards + App Studio apps (NOT Pro-Code) |
| **Build App Studio** | Direct API App Studio build (invoked by Dashboard Builder) |
| **Form Builder** | App Studio forms with backing datasets (invoked by Build App Studio) |

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: routing decision — which builder was selected (Code Engine/ProCode/AppDB), requirements analysis, complexity assessment.

## Related Skills

- **Dashboard Builder** (Build) — for Domo dashboards (cards + pages) AND App Studio apps. If a user asks for "App Studio", route HERE, not to ProCode App Builder. App Studio is a no-code drag-and-drop tool, not a code editor.
- **Card Builder** (Build) — for individual Domo cards that don't need a custom app
