---
name: sync-emails
tier: 1
maturity: beta
audience: [intelligence]
description: >
  Scrape Outlook emails for a customer and ingest into the project's knowledge base.
  Opens a browser, searches for the customer keyword, bulk-scrapes emails, and sends
  them to the server for deduplication and parallel ingestion. Trigger on "sync emails",
  "scrape emails", "pull emails", "sync outlook", "get emails", or any request to pull
  emails into the project.
---

# Sync Emails

Pull Outlook emails by keyword and ingest into the knowledge base via server-side pipeline.

**Requires:** Active project session. Get `customerSlug`, `opportunitySlug`, `sessionId`, and `serverBaseUrl` from the **Session Context** section of your system prompt — use the exact literal values shown there.

---

## Step 0 — Choose retrieval method (MANDATORY FIRST STEP)

Before showing any modal or scraping anything, determine which email retrieval path to use:

**Check for MS-365 Graph API availability:**

```
Tool: ToolSearch
Arguments: { "query": "select:mcp__ms-365__list-mail-messages", "max_results": 1 }
```

- **If ToolSearch returns the tool** → Use **Path A (MS-365 Graph API)**. This is faster, more reliable, and works on all platforms.
- **If ToolSearch returns nothing** → Use **Path B (Browser Scraping)** as fallback.

---

# Path A — MS-365 Graph API (PREFERRED)

Use this path when `mcp__ms-365__list-mail-messages` is available.

## A1 — Search for emails

Derive the customer display name from the customer slug for the search keyword. Search across inbox and sent items:

```
Tool: mcp__ms-365__list-mail-messages
Arguments: {
  "search": "{customer_name}",
  "select": "id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments",
  "top": 50
}
```

**IMPORTANT:** Do NOT pass `orderby` when using `search`. Microsoft Graph API returns HTTP 400 if `$orderBy` is combined with `$search`. Results are ranked by relevance when searching.

If the user specified specific folders (e.g. "inbox > Clients > Active Clients > CustomerName"), use `list-mail-folders` and `list-mail-folder-messages` to target those folders:

```
Tool: mcp__ms-365__list-mail-folders
Arguments: {}
```

Then for each relevant folder:

```
Tool: mcp__ms-365__list-mail-folder-messages
Arguments: {
  "folderId": "{folder_id}",
  "search": "{customer_name}",
  "top": 50,
  "select": "id,subject,from,toRecipients,receivedDateTime,bodyPreview,body,hasAttachments"
}
```

**IMPORTANT:** Pass `top` and `select` as the correct types — `top` must be a number (not a string), `select` must be a string. Do NOT pass `orderby` when using `search` — Microsoft Graph API returns HTTP 400 if `$orderBy` is combined with `$search`.

## A2 — Get full message content

For each email found, get the full body if `bodyPreview` is too short:

```
Tool: mcp__ms-365__get-mail-message
Arguments: { "messageId": "{message_id}", "select": "id,subject,from,toRecipients,receivedDateTime,body" }
```

Only fetch full bodies for emails where `bodyPreview` is truncated or insufficient. For most emails, `bodyPreview` + subject + sender is enough.

## A3 — Send to server

Build the email array and POST to the sync endpoint. Map each email to the format the server expects:

- `convid`: use the message `id` (Graph API message ID — used as dedup key)
- `ariaLabel`: construct from the email data: `"{from.name}, {subject}, {bodyPreview}, {receivedDateTime}"`

```bash
curl -s -X POST {serverBaseUrl}/api/emails/sync \
  -H "Content-Type: application/json" \
  -d '{"customerSlug":"{customerSlug}","opportunitySlug":"{opportunitySlug}","sessionId":"{sessionId}","keyword":"{customer_name}","emails":[{MAPPED_ARRAY}]}'
```

**IMPORTANT:** Use the exact values from your Session Context (sessionId, customerSlug, opportunitySlug, serverBaseUrl). Do NOT leave any field empty.

## A4 — Report

```
Email sync complete (via MS-365 Graph API):
- Found: {count} emails matching "{keyword}"
- New: {saved.length} saved and queued for ingestion
- Duplicates skipped: {skippedDuplicates}
- Errors: {errors.length}

Ingestion running in background.
```

---

# Path B — Browser Scraping (FALLBACK)

Use this path ONLY when MS-365 Graph API tools are not available.

## B1 — Settings modal (MANDATORY)

**STOP. Emit this modal before doing anything else.**

Derive the customer display name from the slug. Set `email_keyword` default to the derived name.

```
:::mcp_input_request
{
  "request_id": "sync-emails-settings",
  "title": "Sync Emails",
  "description": "Configure email scraping settings.",
  "fields": [
    {
      "name": "browser",
      "type": "select",
      "label": "Browser",
      "description": "Browser for Outlook scraping (must be signed into Microsoft)",
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
      "label": "Search keyword",
      "description": "Search term for Outlook (e.g. customer name)",
      "required": false,
      "placeholder": "e.g. Acme Corp"
    },
    {
      "name": "email_count",
      "type": "select",
      "label": "Emails to scrape",
      "description": "Maximum emails to pull (25 and 250 take similar time)",
      "required": true,
      "options": [
        { "value": "25", "label": "~25 emails (quick)" },
        { "value": "50", "label": "~50 emails" },
        { "value": "100", "label": "~100 emails" },
        { "value": "250", "label": "~250 emails (maximum)" }
      ],
      "default": "50"
    }
  ]
}
:::
```

Wait for response. If `email_keyword` is empty, derive from customer slug.

---

## B2 — Open Outlook and search

Navigate to Outlook, wait for load, then immediately search. Call these tools in sequence — do NOT take screenshots or verify login (persistent profile handles auth automatically):

```
Tool: mcp__browser__browser_navigate
Arguments: { "url": "https://outlook.office.com/mail/", "browser": "{browser}", "timeout": 30000 }
```

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 2000 }
```

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "input[aria-label*='Search']" }
```

```
Tool: mcp__browser__browser_type
Arguments: { "selector": "input[aria-label*='Search']", "text": "{email_keyword}" }
```

**CRITICAL: Use the EXACT keyword the user provided — do NOT redact, mask, or replace any part of it with asterisks. The keyword is an intentional search term, not sensitive PII. Typing a masked value like "Lily****" instead of the real name will return wrong results.**

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "button[aria-label='Search']" }
```

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 3000 }
```

**Only take a screenshot if a tool call fails.** Otherwise proceed directly to Step B3.

If the browser is not logged in (navigate returns a login page URL), tell the user to sign in and wait with `browser_wait` at 120000ms. This only happens once — persistent profile retains the session.

---

## B3 — Bulk scrape

Single call — collects all emails with virtual scrolling and dedup:

```
Tool: mcp__browser__browser_scrape_list
Arguments: {
  "item_selector": "div[role='option'][data-convid]",
  "scroll_direction": "down",
  "target_count": {email_count},
  "dedupe_attribute": "data-convid",
  "attributes": ["aria-label", "data-convid"],
  "scroll_amount": 2000,
  "wait_ms": 1000
}
```

**Do NOT click into individual emails.** The aria-label preview text is sufficient — the server distills it with Haiku.

---

## B4 — Send to server

POST the scraped data. The server handles dedup, file writing, parallel Haiku ingestion, KB update, and S3 sync.

Build a JSON array mapping each scraped item: `convid` = `data-convid` attribute, `ariaLabel` = `aria-label` attribute.

**Use the exact values from your Session Context** (sessionId, customerSlug, opportunitySlug, serverBaseUrl). Do NOT leave any field empty — if sessionId is missing from your context, tell the user instead of sending an empty value.

```bash
curl -s -X POST {serverBaseUrl}/api/emails/sync \
  -H "Content-Type: application/json" \
  -d '{"customerSlug":"{customerSlug}","opportunitySlug":"{opportunitySlug}","sessionId":"{sessionId}","keyword":"{email_keyword}","emails":[{MAPPED_ARRAY}]}'
```

**IMPORTANT:** If the curl returns an error or empty response, report the exact error to the user. Do NOT fabricate a success message.

---

## B5 — Report

```
Email sync complete (via browser scraping):
- Scraped: {count} emails matching "{keyword}"
- New: {saved.length} saved and queued for ingestion
- Duplicates skipped: {skippedDuplicates}
- Errors: {errors.length}

Ingestion running in background.
```

---

## Error handling

- **MS-365 tool not found:** Fall back to Path B (browser scraping).
- **MS-365 returns empty results:** Try broader search terms or different folders. If still empty, report "0 emails found".
- **Not logged in (browser):** Wait for user, then continue. Only happens once.
- **No emails found:** Report "0 emails found".
- **Server not responding:** Report clearly with port check suggestion.
- **Tool call fails:** Take a screenshot to diagnose (browser path), then retry the failed step.

## Memory

### Before executing
- Call `memory_bundle` with scope `{account_id, engagement_id}` and intent `"prep"` to load account and engagement context.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-observations"]}`, content: email count synced, key topics covered, action items extracted, chronological narrative of email threads.
