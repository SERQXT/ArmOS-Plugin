---
name: outlook-mail-scraper
tier: 1
maturity: alpha
audience: [intelligence]
description: >
  Scrapes the current user's Outlook email inbox (or other folders) via browser
  automation (Playwright) and returns structured email data. Use this skill any time
  the user asks to pull, fetch, read, check, or search their Outlook email — whether
  for unread messages, emails from a specific sender, a specific folder, or recent
  correspondence about a topic. Trigger on "check my email", "any new emails",
  "pull my inbox", "what emails did I get from [person]", "check email about [topic]",
  "show my unread messages", "look at my Sent Items", "search email for [keyword]",
  or anything that implies reading live Outlook email data. Also trigger when another
  skill or workflow needs email content as a data source. This skill uses the browser
  MCP tools with a persistent login — no API credentials required.
---

# Outlook Mail Scraper

This skill pulls live email data from Outlook Web (outlook.office.com) using the
browser MCP tools and returns it as structured message data. It uses a persistent
browser profile so the user only needs to sign into Microsoft once.

The scraper is designed to be used as a **data source** — other skills and workflows
can call on email data alongside Teams, Compass, Gong, and other tools.

---

## Overview

The workflow is:
1. **Ask the user for settings** (browser, folder, how far back)
2. Navigate to Outlook Mail
3. Confirm the user is signed in
4. Optionally navigate to a specific folder or search
5. Scrape email list with scroll passes
6. Optionally read full email content for selected messages
7. Present structured output

---

## Step 1 — Collect scrape settings (MANDATORY — do not skip)

**STOP. You MUST emit this modal before doing anything else. Do NOT navigate or call any browser tools until the user responds.**

Emit this input request modal:

```
:::mcp_input_request
{
  "request_id": "mail-scrape-settings",
  "title": "Outlook Mail Scrape Settings",
  "description": "Configure the email scrape before starting.",
  "fields": [
    {
      "name": "browser",
      "type": "select",
      "label": "Browser",
      "description": "Which browser to use for scraping",
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
      "name": "email_count",
      "type": "select",
      "label": "How many emails?",
      "description": "Maximum number of emails to scrape from the list (more = slower)",
      "required": true,
      "options": [
        { "value": "10", "label": "~10 emails (quick glance)" },
        { "value": "25", "label": "~25 emails" },
        { "value": "50", "label": "~50 emails" },
        { "value": "100", "label": "~100 emails" },
        { "value": "250", "label": "~250 emails (maximum)" }
      ],
      "default": "25"
    }
  ]
}
:::
```

Wait for the user's response. Use the `browser` value as the `browser` parameter on
the first `browser_navigate` call. Use `email_count` to determine scroll passes
(~10 emails visible at a time, so 10 = 0 scrolls, 25 = 2, 50 = 4, 100 = 10).

Only skip this modal if the user has already provided these preferences earlier in
this conversation.

---

## Step 2 — Navigate to Outlook Mail

```
Tool: mcp__browser__browser_navigate
Arguments: { "url": "https://outlook.office.com/mail/", "browser": "edge", "timeout": 30000 }
```

Wait for the page to load:

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 2000 }

Tool: mcp__browser__browser_screenshot
Arguments: { "name": "outlook-mail" }
```

Use the Read tool on the screenshot to verify state.

**Not logged in?**
1. Call `browser_wait` with 120000 ms delay to keep browser alive for login
2. Tell the user: "A browser window should be open — please sign into your Microsoft
   account there. Take your time, I'll wait. Let me know when you're done."
3. After the wait, take a screenshot to check.
4. Persistent profile means they only sign in once.

---

## Step 3 — Navigate to the right folder (if needed)

By default, Outlook opens the Inbox (Focused tab). If the user wants a different folder:

### Folder navigation

Folders are `[role="treeitem"]` elements in the sidebar. Common folders:
- Inbox (with unread count)
- Sent Items
- Drafts
- Junk Email
- Archive

```
Tool: mcp__browser__browser_get_elements
Arguments: { "selector": "[role='treeitem']", "attributes": ["aria-label"], "max_results": 20 }
```

Click the desired folder:

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "[role='treeitem']:has-text('Sent Items')" }
```

Wait for the folder to load:

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 2000 }
```

### Focused vs Other tab

Outlook's Inbox has "Focused" and "Other" tabs. By default you see Focused.
If the user wants all mail or "Other" emails, check for and click the "Other" tab.

### Search

To search for emails by keyword, sender, or subject — click the search box, type the keyword, and press Enter to submit:

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "input[aria-label*='Search']" }

Tool: mcp__browser__browser_type
Arguments: { "selector": "input[aria-label*='Search']", "text": "from:John Smith subject:quarterly" }
```

Submit the search by pressing Enter:

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "button[aria-label='Search']" }
```

Wait for search results to load:

```
Tool: mcp__browser__browser_wait
Arguments: { "delay": 3000 }
```

**Only take a screenshot if the scrape results in Step 4 return 0 items.** Otherwise skip verification to save time.

---

## Step 4 — Scrape email list (single bulk call)

Use the `browser_scrape_list` tool to collect all emails in one fast call. This tool
handles virtual scrolling, extraction, and deduplication internally — no need to
manually loop scroll + extract.

```
Tool: mcp__browser__browser_scrape_list
Arguments: {
  "item_selector": "div[role='option'][data-convid]",
  "scroll_direction": "down",
  "target_count": 25,
  "dedupe_attribute": "data-convid",
  "attributes": ["aria-label", "data-convid"],
  "scroll_amount": 2000,
  "wait_ms": 1000
}
```

Set `target_count` to the user's `email_count` setting (10, 25, 50, 100, or 250).

The tool auto-detects the scrollable container by walking up from the first item.
It returns all unique items with their `aria-label` and `data-convid` attributes.

Each email's `aria-label` contains rich data in this format:
```
"[Has attachments] [Sender] [Subject] [Time] [Preview text...]"
```

**Examples:**
```
"SharePoint Online Heads up! We noticed that you recently deleted... 8:57 PM Files are permanently removed..."
"Has attachments Domo Spain/Portugal RMA 3:24 PM Non Assigned Lines Spain/Portugal..."
"Meeting Ed Engalan Ed OOO spring break 11:23 AM No preview is available."
```

---

## Step 5 — Read full email content (optional)

If the user wants to read specific emails in detail (not just the list), click on
the email to open it in the reading pane:

```
Tool: mcp__browser__browser_click
Arguments: { "selector": "div[role='option'][data-convid='<convid>']" }

Tool: mcp__browser__browser_wait
Arguments: { "delay": 2000 }
```

Then extract the email body from the reading pane:

```
Tool: mcp__browser__browser_get_text
Arguments: { "selector": "[role='main']", "max_length": 50000 }
```

Or for just the message body (excluding headers/chrome):

```
Tool: mcp__browser__browser_get_text
Arguments: { "selector": "div[role='document']", "max_length": 50000 }
```

Both `[role="main"]` and `div[role="document"]` work for reading email content.
`[role="main"]` includes email headers (sender, to, date). `div[role="document"]`
is just the message body.

---

## Step 6 — Parse emails

From the `aria-label` of each `div[role="option"]`, extract:
- **has_attachments**: true if label starts with "Has attachments"
- **is_meeting**: true if label starts with "Meeting"
- **sender**: Name/address after "Has attachments" prefix (if any) and before the subject
- **subject**: The email subject line
- **time**: Time string (e.g., "3:24 PM") or date for older emails
- **preview**: First line of email body text
- **conversation_id**: The `data-convid` attribute

---

## Step 7 — Present results

```
## Outlook: [Folder Name]
Scraped [N] emails

---

### Today

**[HH:MM AM/PM] — [Sender]**
**[Subject]**
[Preview text...]
📎 [if has attachments]

---

### Yesterday
[...]
```

---

## Analysis based on user request

After presenting the email list, analyze through the lens of what the user asked:

- **Action items**: Emails requesting action, containing "please", "can you", "need"
- **Urgent/important**: Flagged emails, emails from leadership
- **Unread count**: How many unread vs read
- **Threads**: Group related emails by conversation
- **Attachments**: List emails with attachments and their likely content

---

## Tips

- **Persistent login**: Browser profile at `~/.armos/browser-profiles/{browser}/`
  retains cookies. User logs in once, future scrapes work automatically.
- **Virtual scrolling**: Only ~10 emails in DOM at a time. Use `div[role="option"][data-convid]`
  for items, `[role="listbox"]` for the list container.
- **Search**: `input[aria-label*='Search']` with `placeholder="Search"`. Supports
  Outlook search syntax: `from:name`, `subject:keyword`, `has:attachment`.
- **Folders**: `[role="treeitem"]` elements. Click to navigate to Inbox, Sent Items, etc.
- **Reading pane**: `[role="main"]` for full email with headers, `div[role="document"]`
  for just the body.
- **URL redirect**: May redirect from `outlook.office.com` to `outlook.cloud.microsoft`.
  Both work.
- **Focused/Other**: Inbox has two tabs. Default is Focused. Check if user wants Other.

## Memory

### Before executing
- Call `memory_bundle` with scope `{account_id, engagement_id}` (when engagement context exists) and intent `"prep"` to load account and engagement context.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}` (when engagement context exists), hints `{layers: ["engagement-observations"]}`, content: key email threads found, sender/recipient patterns, action items extracted, sentiment indicators, escalation signals.
