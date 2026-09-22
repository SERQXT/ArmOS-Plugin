---
name: project-sync
tier: 1
maturity: alpha
description: >
  Sync Outlook emails and Teams chats into a project's knowledge base. Collects settings
  via a single modal, then scrapes Outlook and Teams, saves results to project folders,
  and triggers the distillation pipeline. Note: Gong meeting sync is now handled via the
  Meetings button in the UI (server-driven, not agent-driven). Trigger on "project sync",
  "sync project", "sync all data", "full sync", "pull all sources", "sync knowledge base",
  "sync everything", or any request to pull emails and chats into the project at once.
audience: [intelligence]
---

# Project Sync — Email & Teams Sync

Sync Outlook emails and Teams chats into the current project's knowledge base in a single flow.

> **Note:** Gong meeting sync is now handled via the "Meetings" button in the chat header. It uses a server-driven modal where users select which meetings to sync. This skill handles emails and Teams only.

---

## Overview

```
User says: "project sync"
              |
     Step 1: Collect settings (single modal)
              |
     Step 2: Email scrape (unless skipped)
              |
     Step 3: Teams scrape (unless skipped)
              |
     Step 4: Summary report
```

---

## Prerequisites

This skill requires an active project session (not a general chat). You need:
- `customerSlug` and `opportunitySlug` (or account-level session) from the active session
- `sessionId` for ingestion API calls

If the session is a general chat, tell the user: "Project sync requires an active project session. Please switch to a project first."

---

## Step 1 — Collect settings (MANDATORY — do not skip)

**STOP. You MUST emit this modal before doing anything else. Do NOT call any tools or APIs until the user responds.**

Derive the customer display name from the customer slug (e.g. "Sony" from "Sony Group Corporation - A01234567").

Emit this input request modal:

```
:::mcp_input_request
{
  "request_id": "project-sync-settings",
  "title": "Project Sync Settings",
  "description": "Configure which data sources to sync. Gong meetings are synced separately via the Meetings button.",
  "fields": [
    {
      "name": "sync_email",
      "type": "boolean",
      "label": "Sync Outlook emails",
      "description": "Scrape recent emails from Outlook matching a keyword",
      "required": false,
      "default": true
    },
    {
      "name": "sync_teams",
      "type": "boolean",
      "label": "Sync Teams messages",
      "description": "Scrape messages from a Teams channel or group chat",
      "required": false,
      "default": true
    },
    {
      "name": "browser",
      "type": "select",
      "label": "Browser",
      "description": "Browser for Outlook and Teams scraping (must be signed into Microsoft)",
      "required": true,
      "options": [
        { "value": "chrome", "label": "Chrome" },
        { "value": "edge", "label": "Microsoft Edge" },
        { "value": "firefox", "label": "Firefox" },
        { "value": "safari", "label": "Safari" }
      ],
      "default": "edge"
    },
    {
      "name": "email_keyword",
      "type": "text",
      "label": "Email search keyword",
      "description": "Search term for Outlook (e.g. customer name, project name)",
      "required": false,
      "placeholder": "e.g. Acme Corp"
    },
    {
      "name": "email_count",
      "type": "select",
      "label": "Emails to scrape",
      "description": "Maximum number of emails to pull from Outlook",
      "required": true,
      "options": [
        { "value": "10", "label": "~10 emails (quick)" },
        { "value": "25", "label": "~25 emails" },
        { "value": "50", "label": "~50 emails" }
      ],
      "default": "25"
    },
    {
      "name": "teams_channel",
      "type": "text",
      "label": "Teams channel/chat name",
      "description": "Name of the Teams channel or group chat to scrape",
      "required": false,
      "placeholder": "e.g. Acme Corp - Implementation"
    },
    {
      "name": "teams_message_limit",
      "type": "select",
      "label": "Teams messages to scrape",
      "description": "Maximum number of Teams messages to pull",
      "required": true,
      "options": [
        { "value": "50", "label": "~50 messages (quick)" },
        { "value": "100", "label": "~100 messages" },
        { "value": "200", "label": "~200 messages" }
      ],
      "default": "100"
    }
  ]
}
:::
```

**Before emitting the modal**, set the `email_keyword` and `teams_channel` field defaults to the derived customer name.

Wait for the user's response. Store all values for use in subsequent steps.

If `email_keyword` is empty and `sync_email` is true, derive it from the customer slug.
If `teams_channel` is empty and `sync_teams` is true, use the customer display name.

---

## Step 2 — Email scrape (unless `sync_email` is false)

Scrape Outlook emails matching the keyword and save to the `emails/` folder.

### 2a. Navigate to Outlook

```
Tool: mcp__browser__browser_navigate
Arguments: { "url": "https://outlook.office.com/mail/", "browser": "{browser}", "timeout": 30000 }
```

Wait and verify login:

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 5000 }

Tool: mcp__browser__browser_screenshot
Arguments: { "name": "sync-outlook" }
```

If not logged in, tell the user to sign in and wait with `browser_wait` at 120000 ms.

### 2b. Search for keyword

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "input[aria-label*='Search']" }

Tool: mcp__browser__browser_type
Arguments: { "selector": "input[aria-label*='Search']", "text": "{email_keyword}" }

Tool: mcp__browser__browser_wait
Arguments: { "delay": 3000 }
```

### 2c. Bulk scrape email list

```
Tool: mcp__browser__browser_scrape_list
Arguments: {
  "item_selector": "div[role='option'][data-convid]",
  "scroll_direction": "down",
  "target_count": {email_count},
  "dedupe_attribute": "data-convid",
  "attributes": ["aria-label", "data-convid"],
  "scroll_amount": 2000,
  "wait_ms": 1500
}
```

### 2d. Read full content for each email

For each scraped email, click to open and extract body:

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "div[role='option'][data-convid='{convid}']" }

Tool: mcp__browser__browser_wait
Arguments: { "delay": 2000 }

Tool: mcp__browser__browser_get_text
Arguments: { "selector": "div[role='document']", "max_length": 50000 }
```

### 2e. Deduplicate — check for existing email scrapes

Before saving, list existing files in `emails/` using the Glob tool. If a file with the **same keyword and date** already exists (e.g. `sony-2026-03-17.md`), **skip saving and ingestion** — those emails were already scraped today.

### 2f. Save consolidated results (if new)

**Filename:** `{keyword}-{YYYY-MM-DD}.md` (e.g. `acme-corp-2026-03-16.md`)

**Format:**
```markdown
# Outlook Emails: {keyword}
Scraped: {date} | Count: {N} emails

---

## {Subject} — {Sender} ({Time})
{Email body}

---
...
```

### 2g. Trigger ingestion (MANDATORY — do not skip or ask)

**You MUST trigger ingestion for the saved file. Do NOT ask the user.**

```bash
curl -s -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "customerSlug": "{customerSlug}",
    "opportunitySlug": "{opportunitySlug}",
    "sessionId": "{sessionId}",
    "folder": "emails",
    "filename": "{keyword}-{date}.md"
  }'
```

---

## Step 3 — Teams scrape (unless `sync_teams` is false)

Scrape Teams messages and save to the `teams-chat/` folder.

### 3a. Navigate to Teams

```
Tool: mcp__browser__browser_navigate
Arguments: { "url": "https://teams.microsoft.com/v2/", "browser": "{browser}", "timeout": 30000 }
```

Wait and verify login:

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 5000 }

Tool: mcp__browser__browser_screenshot
Arguments: { "name": "sync-teams" }
```

If not logged in, tell the user to sign in and wait with `browser_wait` at 120000 ms.

### 3b. Search for the channel/chat

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "input[type='search']" }

Tool: mcp__browser__browser_type
Arguments: { "selector": "input[type='search']", "text": "{teams_channel}" }

Tool: mcp__browser__browser_wait
Arguments: { "delay": 2000 }
```

Check search results and click the correct option:

```
Tool: mcp__browser__browser_get_elements
Arguments: { "selector": "[role='option']", "attributes": ["aria-label"], "max_results": 10 }
```

Click the matching result. If multiple matches, pick the best one or ask the user.

### 3c. Bulk scrape messages

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 3000 }

Tool: mcp__browser__browser_scrape_list
Arguments: {
  "item_selector": "[data-tid='chat-pane-message']",
  "scroll_selector": "[data-tid='message-pane-list-viewport']",
  "scroll_direction": "up",
  "target_count": {teams_message_limit},
  "attributes": ["aria-label"],
  "scroll_amount": 2000,
  "wait_ms": 2000
}
```

### 3d. Save consolidated results

**Filename:** `{channel-slug}-{YYYY-MM-DD}.md`

**Format:**
```markdown
# Teams: {channel name}
Scraped: {date} | Count: {N} messages

---

**{Time} — {Sender}**
{Message content}

...
```

### 3e. Trigger ingestion (MANDATORY — do not skip or ask)

**You MUST trigger ingestion for the saved file. Do NOT ask the user.**

```bash
curl -s -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "customerSlug": "{customerSlug}",
    "opportunitySlug": "{opportunitySlug}",
    "sessionId": "{sessionId}",
    "folder": "teams-chat",
    "filename": "{channel-slug}-{date}.md"
  }'
```

---

## Step 4 — Summary

```markdown
## Project Sync Complete

| Source | Status | Details |
|--------|--------|---------|
| Outlook | {synced/skipped} | {X emails for "{keyword}", saved to emails/} |
| Teams | {synced/skipped} | {X messages from "{channel}", saved to teams-chat/} |

All imported content has been automatically distilled into `knowledgebase/`.

> **Tip:** Use the "Meetings" button in the chat header to sync Gong call recordings separately.
```

---

## Error Handling

- **Browser not logged in:** Wait for user to log in, then continue.
- **No emails/messages found:** Report "0 items found" and move on.
- **Ingestion fails:** Report the error but don't abort — the raw file is still saved.

---

## Tips

- **Browser reuse**: If email and Teams scraping both use the same browser, the browser session persists between steps.
- **Persistent login**: Browser profile at `~/.armos/browser-profiles/{browser}/` retains cookies across scrapes.
- **Incremental syncs**: Emails are deduplicated by keyword + date — same-day re-scrapes are skipped.
- **Ingestion is automatic**: Every saved file triggers `POST /api/ingest`. Never ask the user if they want to distill.

## Memory

### Before executing
- Call `memory_bundle` with scope `{account_id, engagement_id}` and intent `"prep"` to load account and engagement context.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-observations"]}`, content: sources synced (email count, Teams message count), key themes across all sources, timeline of activity, distillation results.
