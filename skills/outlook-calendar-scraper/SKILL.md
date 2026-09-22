---
name: outlook-calendar-scraper
tier: 1
maturity: alpha
audience: [intelligence]
description: >
  Scrapes the current user's Outlook calendar via browser automation (Playwright)
  and returns structured event data organized by day. Use this skill any time the user
  asks to pull, fetch, read, or display their Outlook calendar, schedule, or meetings —
  whether for a specific day, the current week, next week, or a custom date range.
  Also trigger when the user asks "what's on my calendar", "show me my meetings",
  "pull my schedule", "what do I have this week", or anything that implies reading
  live Outlook calendar data. This skill uses the browser MCP tools with a persistent
  login — no API credentials required, the user just needs to be signed into Outlook
  in the browser.
---

# Outlook Calendar Scraper

This skill pulls live calendar data from Outlook Web (outlook.office.com) using the
browser MCP tools and returns it as structured, day-by-day event data. It uses a
persistent browser profile so the user only needs to sign into Microsoft once.

---

## Overview

The workflow is:
1. **Ask the user which browser they want to use** (Chrome, Edge, Firefox, or Safari)
2. Navigate to the Outlook calendar in the correct view and week
3. Confirm the user is signed in
4. Extract events using element queries and text scraping
5. Parse and organize events by day
6. Present the structured output

---

## Step 1 — Ask which browser to use (MANDATORY — do not skip)

**STOP. You MUST emit this modal before doing anything else. Do NOT navigate or call any browser tools until the user responds.**

Emit this input request modal to collect the browser preference:

```
:::mcp_input_request
{
  "request_id": "browser-selection",
  "title": "Browser Selection",
  "description": "Which browser would you like me to use for scraping Outlook?",
  "fields": [
    {
      "name": "browser",
      "type": "select",
      "label": "Browser",
      "required": true,
      "options": [
        { "value": "chrome", "label": "Chrome" },
        { "value": "edge", "label": "Microsoft Edge" },
        { "value": "firefox", "label": "Firefox" },
        { "value": "safari", "label": "Safari" }
      ],
      "default": "edge"
    }
  ]
}
:::
```

Wait for the user's response. Use the `browser` value as the `browser` parameter on the first `browser_navigate` call.
Only skip this modal if the user has already stated their browser preference earlier in this conversation.

---

## Step 2 — Navigate to the calendar

Determine what time range the user wants:
- **Default / "this week"**: `https://outlook.office.com/calendar/view/week`
- **"today" / "day view"**: `https://outlook.office.com/calendar/view/day`
- **"next week"**: Navigate to week view first, then click the forward navigation

Navigate using the `browser_navigate` tool, passing the user's browser choice:

```
Tool: mcp__browser__browser_navigate
Arguments: { "url": "https://outlook.office.com/calendar/view/week", "browser": "edge" }
```

Wait for the page to load, then take a screenshot to confirm state:

```
Tool: mcp__browser__browser_screenshot
Arguments: { "name": "outlook-calendar" }
```

Then use the Read tool on the screenshot path to visually verify.

---

## Step 3 — Check login state

After navigation, check the page title and URL. Signs the user is NOT logged in:
- URL redirected to `login.microsoftonline.com`
- Title contains "Sign in" or "Pick an account"
- Page shows the Outlook marketing page

If not logged in:
1. **Keep the browser alive** by calling `browser_wait` with a long delay (120000 ms = 2 minutes)
   so the user has time to sign in:
   ```
   Tool: mcp__browser__browser_wait
   Arguments: { "delay": 120000 }
   ```
2. Tell the user: "A browser window should be open — please sign into your Microsoft
   account there. Take your time, I'll wait. Let me know when you're done."
3. After the wait completes (or the user says they're done), take a screenshot to check.
4. The persistent browser profile means they only need to do this once — future scrapes
   will be logged in automatically.

If logged in (title contains "Calendar" and URL is on outlook.office.com): proceed.

---

## Step 4 — Extract calendar events

Outlook renders calendar events as `[role="button"]` div elements (NOT `<button>` tags)
with rich `aria-label` attributes containing all event details.

**IMPORTANT**: Use `[role="button"]` selector, NOT `button`. The events are divs with
`role="button"`, and using `button[aria-label]` will return zero calendar events.

Extract AM events and PM events separately to capture all timed events:

```
Tool: mcp__browser__browser_get_elements
Arguments: {
  "selector": "[role='button'][aria-label*='AM']",
  "attributes": ["aria-label"],
  "max_results": 200
}
```

```
Tool: mcp__browser__browser_get_elements
Arguments: {
  "selector": "[role='button'][aria-label*='PM']",
  "attributes": ["aria-label"],
  "max_results": 200
}
```

Merge both result sets and deduplicate by aria-label.

Calendar events have aria-labels following this pattern:
```
"[Title], [HH:MM AM/PM to HH:MM AM/PM | all day event], [Day], [Month DD, YYYY], ..., By [Organizer], [Busy|Free|Tentative][, Recurring event]"
```

**Examples:**
```
"Internal | Discuss Fanatics, 9:30 AM to 10:00 AM, Monday, March 16, 2026, Microsoft Teams Meeting, By Simeon Nielsen, Busy"
"INT - Sony RMA, 12:00 PM to 12:30 PM, Monday, March 16, 2026, Microsoft Teams Meeting, By Dylan Jensen, Busy"
"Casey OOO (Vball), all day event, Thursday, March 13, 2026, Free"
```

**Filter rules** — keep only elements whose aria-label contains:
- A time pattern like `"HH:MM AM"` or `"HH:MM PM"` (timed events), OR
- `"all day event"` (all-day events)
AND whose label is longer than 15 characters. Discard results that are just date
cells (e.g., `"22, February, 2026"`).

---

## Step 5 — Parse events from aria-labels

For each event aria-label, extract:
- `title`: First segment before the first comma
- `is_all_day`: true if label contains "all day event"
- `start_time`: e.g. "10:00 AM" (null for all-day)
- `end_time`: e.g. "10:15 AM" (null for all-day)
- `day_of_week`: e.g. "Tuesday"
- `date`: e.g. "March 10, 2026"
- `organizer`: Name after "By " (if present)
- `status`: "Canceled" if title starts with "Canceled:", else "Tentative"/"Busy"/"Free"
- `is_recurring`: true if label contains "Recurring event"
- `meeting_platform`: "Microsoft Teams" if contains "Microsoft Teams Meeting",
  "Zoom" if contains "zoom.us", else null

---

## Step 6 — Organize and present

Group events by date, sorted chronologically. Within each day:
1. All-day events first
2. Timed events sorted by start time
3. Canceled events shown with strikethrough notation

**Output format:**

```
📅 [Week range, e.g. "March 8–14, 2026"]

**All-Week / Multi-Day**
- [Event] (dates, organizer)

---

**[Day, Date]** *(Today)*
- [HH:MM–HH:MM AM/PM] · [Title] *(organizer, Recurring/Tentative)*
- ~~[HH:MM–HH:MM AM/PM] · [Title]~~ *(Canceled)*

---
[repeat for each day]
```

At the end, briefly note:
- Total event count (excluding canceled)
- Any notable scheduling conflicts (overlapping times on the same day)

---

## Tips and edge cases

- **Persistent login**: The browser uses a persistent profile at `~/.armos/browser-profiles/{browser}/`.
  After the user logs in once, cookies persist and future scrapes work without re-auth.
- **Element type**: Calendar events are `[role="button"]` divs, NOT `<button>` elements.
  Always use `[role="button"][aria-label*="AM"]` etc., never `button[aria-label]`.
- **URL redirect**: Outlook may redirect from `outlook.office.com` to `outlook.cloud.microsoft`.
  Both work fine.
- **Navigating weeks**: Use `browser_click` on `button[aria-label*="next week"]` or
  `button[aria-label*="previous week"]`.
- **`[role="main"]`**: Works in Outlook calendar for full text extraction as a fallback.
- **Stick to week view**: Week view gives the most data in one scrape.

## Memory

### Before executing
- Call `memory_bundle` with scope `{account_id, engagement_id}` (when engagement context exists) and intent `"prep"` to load account and engagement context.

### After executing
- Call `memory_remember` with scope `{account_id}`, hints `{layers: ["engagement-observations"]}`, content: meetings found with attendees and topics, cadence patterns (weekly/bi-weekly), meeting gaps, upcoming meetings relevant to the account.
