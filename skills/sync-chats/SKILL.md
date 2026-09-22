---
name: sync-chats
tier: 1
maturity: alpha
audience: [intelligence]
description: >
  Scrape Teams messages from a channel or group chat and ingest into the project's knowledge base.
  Opens a browser, navigates to the channel, scrapes messages, saves to teams-chat/,
  and triggers the distillation pipeline. Trigger on "sync chats", "sync teams", "scrape teams",
  "pull teams messages", "get teams chat", or any request to pull Teams messages into the project.
---

# Sync Chats — Teams Message Scraper

Scrape messages from a Teams channel or group chat and ingest them into the project's knowledge base.

---

## Prerequisites

This skill requires an active project session (not a general chat). You need:
- `customerSlug` and `opportunitySlug` (or account-level session) from the active session
- `sessionId` for ingestion API calls

If the session is a general chat, tell the user: "Teams sync requires an active project session. Please switch to a project first."

---

## Step 1 — Collect settings (MANDATORY — do not skip)

**STOP. You MUST emit this modal before doing anything else. Do NOT call any tools or APIs until the user responds.**

Derive the customer display name from the customer slug (e.g. "Sony" from "Sony Group Corporation - A01234567").

Emit this input request modal:

```
:::mcp_input_request
{
  "request_id": "sync-chats-settings",
  "title": "Sync Teams Chats",
  "description": "Configure Teams scraping settings. Messages will be saved and ingested into the knowledge base.",
  "fields": [
    {
      "name": "browser",
      "type": "select",
      "label": "Browser",
      "description": "Browser for Teams scraping (must be signed into Microsoft)",
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
      "label": "Messages to scrape",
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

**Before emitting**, set the `teams_channel` field's `"default"` to the derived customer name.

Wait for the user's response. If `teams_channel` is empty, use the customer display name.

---

## Step 2 — Navigate to Teams

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

---

## Step 3 — Search for the channel/chat

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

---

## Step 4 — Bulk scrape messages

Wait for messages to load, then scrape:

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

---

## Step 5 — Save consolidated results

Build a markdown file with all messages. Use the Write tool to save:

**Filename:** `{channel-slug}-{YYYY-MM-DD}.md` (e.g. `acme-corp-implementation-2026-03-16.md`)

**Format:**
```markdown
# Teams: {channel name}
Scraped: {date} | Count: {N} messages

---

**{Time} — {Sender}**
{Message content}

**{Time} — {Sender}**
{Message content}

...
```

---

## Step 6 — Trigger ingestion (MANDATORY — do not skip or ask)

**You MUST trigger ingestion for the saved file. Do NOT ask the user.** The ingestion pipeline automatically distills chat content and updates `knowledgebase/knowledgebase.md`.

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

Report: "Teams sync complete: scraped X messages, saved & ingested to teams-chat/"

---

## Error Handling

- **Browser not logged in:** Wait for user to log in, then continue. The persistent profile means this only happens once.
- **No messages found:** Report "0 messages found" and finish.
- **Ingestion fails:** Report the error but don't abort — the raw file is still saved.

---

## Tips

- **Persistent login**: Browser profile at `~/.armos/browser-profiles/{browser}/` retains cookies across scrapes.
- **Browser reuse**: If you just ran email sync in the same browser, the Microsoft session persists — no re-login needed.
- **Ingestion is automatic**: The saved file triggers the full pipeline: distill → knowledgebase update. Never ask the user if they want to distill.

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-observations"]}`, content summarizing: key discussion threads scraped, decisions made in chat, action items identified, blockers raised, team sentiment indicators, message count and date range covered.
