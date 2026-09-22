---
name: teams-chat-scraper
tier: 1
maturity: alpha
audience: [intelligence]
description: >
  Scrapes Microsoft Teams chat messages and channel posts via browser automation
  (Claude in Chrome) and returns structured message data. Use this skill any time the
  user asks to pull, read, check, or search their Teams chats or channels — whether
  for a specific engagement channel, a group chat, or unread messages. Trigger on
  "check Teams for [account]", "what's the chatter on [engagement]", "pull the Teams
  channel for [project]", "any updates in Teams about [topic]", "check my Teams messages",
  "what did [person] say in Teams", "Teams TODOs for [account]", or anything that implies
  reading live Microsoft Teams message data. Also trigger when another skill or workflow
  needs Teams channel content as a data source — for instance, cross-referencing Asana
  tasks against Teams discussion, or synthesizing engagement status from multiple sources
  including Teams. This skill works without API credentials by driving the browser directly.
---

# Teams Chat Scraper

This skill pulls live chat/channel messages from Microsoft Teams web app
(teams.cloud.microsoft) using browser automation and returns them as structured,
chronological message data. It requires Claude in Chrome tools and that the user
is (or can be) signed into their Teams account.

The scraper is designed to be used as a **data source** — other skills and workflows
can call on Teams data alongside Asana, Compass, Gong, and other tools to build
a complete picture of what's happening on an engagement.

---

## Overview

The workflow is:
1. Get browser context and navigate to Teams
2. Confirm the user is signed in
3. Find the target chat or channel (by search or sidebar navigation)
4. Scrape messages from the conversation — multiple scroll passes to get history
5. Parse messages into structured data (sender, timestamp, content)
6. Return the structured output for use by the caller

---

## Step 1 — Get browser context

Call `tabs_context_mcp` (createIfEmpty: true). If no tab exists, one will be created.
Save the tabId for all subsequent calls.

---

## Step 2 — Navigate to Teams

Navigate to `https://teams.microsoft.com/v2/` using the `navigate` tool. Teams will
likely redirect to `https://teams.cloud.microsoft/` — this is normal and expected.

**Important: Teams is a very heavy SPA.** The initial load can take 10+ seconds and
may even cause navigation timeouts. If the `navigate` call times out, that's OK —
Teams is probably still loading in the background. Wait 5-10 seconds, then take a
screenshot to check the state. If the tab title shows "Microsoft Teams" with a chat
name, you're in. If it's still loading, wait a bit more.

If creating a new tab for Teams fails or times out, try navigating an existing tab
to Teams instead — this tends to be more reliable.

---

## Step 3 — Check login state

After navigation, take a screenshot. Signs the user is NOT logged in:
- URL redirected to `login.microsoftonline.com`
- Page shows "Sign in" or "Pick an account" prompts
- Page is stuck on a loading spinner for more than 10 seconds

If not logged in: Tell the user "You'll need to sign into Teams first — please log in
in the browser window that just opened, then let me know and I'll re-run the scrape."
Stop and wait.

If logged in (you can see the Teams sidebar with chats/channels): proceed.

---

## Step 4 — Find the target conversation

The user's request will typically reference an account name, engagement name, project
name, or person. Teams has several navigation paths:

### Important context: Engagement chats live under "Chats"

Engagement-specific group chats (the ones tied to accounts and projects) are found
under the **"Chats"** tab in the sidebar — not "Channels". They typically include the
**account name** in the chat name, sometimes with additional context like "PS Chat",
"Internal Only", "Strategic Opportunity", or the project/program name.

Examples of real chat names:
- "ABG Intermediate Holdings 2 LLC"
- "BMS Program - Multiple Project"
- "Fogo de Chao PS Chat"
- "Opus PS Internal Only"
- "UPS Strategic Opportunity"

### Option A: Use Teams search (preferred)

1. Click the search bar at the top center of the Teams interface (it shows placeholder
   text like "Press ⌥ ⌘ G to go right to a chat or channel")
2. Type the **account name** (or a distinctive portion — e.g. "Fogo" for Fogo de Chao)
3. Wait 1-2 seconds for the search dropdown to populate
4. Take a screenshot to see the results. The dropdown shows:
   - **"Top hits"** section — this is where the engagement chat will appear, listed
     with the chat name and participant names (e.g. "Fogo de Chao PS Chat / Juliana")
   - Filter tabs: Messages, Files, Images, Group chats, Meetings, Channels
   - **"Recent messages"** section — recent messages matching the search term
5. Click the matching chat in the "Top hits" section to open it
6. If multiple similar results appear, prefer the one with "PS Chat", "Account Team Chat",
   or similar engagement-oriented naming over meeting chats or 1:1 conversations

### Option B: Browse the Chats tab (fallback)

1. Click the **"Chats"** tab in the sidebar (this is where engagement chats live)
2. Use `read_page` with `filter: "interactive"` to read the list of chats
3. Look for a chat whose name contains the account name
4. If not visible in the initial list, scroll down in the sidebar to find it
5. Click the matching conversation

### Option C: If the user provides a direct link

Sometimes Teams chats have direct links. If the user provides one, navigate
directly to it.

After opening the conversation, wait 1-2 seconds for messages to load, then take
a screenshot to confirm you're in the right place.

---

## Step 5 — Scrape messages

Teams messages are rendered in a scrollable container. To get useful history, do
multiple read passes with scrolling.

### Pass 1: Read current view (most recent messages)

Call `read_page` on the tab with these parameters:
- `depth: 8` (captures the full message structure including nested content)
- `filter: "all"` (not "interactive" — you need all elements to get message text)
- `max_chars: 50000` (Teams chats can be verbose)

**Do NOT use `get_page_text`** — it fails on Teams because the SPA is too complex
and the body contains embedded CSS/scripts. `read_page` is the only reliable method.

The accessibility tree will contain messages structured like this:
```
heading "[message summary] by [Sender]"
generic "[Sender]"
generic "[Timestamp, e.g. 'Thursday, March 5, 2026 7:06 PM.']"
group
  generic "[Full message content]"
  toolbar "Reaction summary" (if reactions exist)
```

Key patterns to look for:
- **@mentions**: `button "Mentioned [Name]"` inside the message group
- **File attachments**: `link` elements with SharePoint URLs, plus `generic "The message has an attachment."`
- **Reactions**: `toolbar "Reaction summary"` with buttons showing emoji + count
- **System messages**: `heading "[Person] added [Person] to the chat..."` (no group/content)
- **Reply quotes**: `group` elements inside messages that reference earlier messages with sender + timestamp
- **Rich content**: headings, lists, tables can appear inside message groups (e.g. structured briefs)
- **Day dividers**: `heading` elements containing just a day name like `generic "Friday"` or `generic "Yesterday"`

### Pass 2–10: Scroll up for history

Always do **10 total scroll-and-read passes** to get a solid block of conversation
history. This ensures enough context regardless of whether the user is asking about
recent chatter, TODOs, or a broader catch-up.

For each pass (repeat 9 more times after the initial read):
1. Scroll up in the message area: `scroll` at the center of the message list
   (approximately coordinate [756, 400]), direction "up", scroll_amount 5
2. Wait 1-2 seconds for older messages to load
3. Call `read_page` again with the same parameters
4. If the content doesn't change after scrolling (same messages as previous pass),
   you've hit the beginning of the chat history — stop early

For newer engagement chats (created in the last week or two), you may get everything
in fewer passes. Stop early if you see the chat creation system message ("X added Y
and N others to the chat").

This typically captures 1-3 weeks of conversation depending on how active the chat is,
which is enough for most use cases (TODOs, status catch-ups, action item sweeps).

### Deduplication

Messages that appear at the boundary between scroll passes will show up in both
reads. Deduplicate by matching on sender + timestamp + first ~50 chars of content.

---

## Step 6 — Parse messages

Walk through the accessibility tree output and extract messages. Here's how to parse:

**Identifying messages vs system events:**
- **User messages** have this pattern: a `heading` with content like `"[summary] by [Sender]"`,
  followed by `generic "[Sender]"`, `generic "[Timestamp]"`, then a `group` containing the
  actual message text in `generic` elements.
- **System events** have a `heading` like `"[Person] added [Person] to the chat..."` with
  NO following group — just a `group` containing `button` elements for the names.
- **Day dividers** are `heading` elements containing only `generic "Friday"` or `generic "Yesterday"`.

**For each user message, extract:**
- `sender`: From the `generic` element immediately after the heading (e.g. `generic "William West"`)
- `timestamp`: From the next `generic` element (e.g. `generic "Thursday, March 5, 2026 7:06 PM."`)
- `content`: From the `generic` elements inside the `group` — this is the full message body.
  Messages can contain rich content (headings, lists, tables) for structured posts.
- `mentions`: Look for `button "Mentioned [Name]"` elements — these are @mentions
- `attachments`: Look for `link` elements with SharePoint/OneDrive URLs and
  `generic "The message has an attachment."` indicators
- `reactions`: From `toolbar "Reaction summary"` — extract emoji + count from buttons
- `is_reply`: If the message `group` contains a nested `group` with a quoted message
  (showing original sender + timestamp + content), it's a reply

**Things to watch for:**
- Timestamps may be relative ("Yesterday at 11:19 AM") or absolute ("Thursday, March 5, 2026 7:06 PM")
- Message text in `generic` elements may be truncated with "..." in the heading summary
  but the full text is in the `group` > `generic` elements
- Rich content (tables, bullet lists, bold headings) is fully preserved in the tree — this
  is incredibly valuable for structured posts like briefs, status updates, and workshop agendas
- GIFs and images show as `button "Play GIF..."` or `image "Image"` — note their presence
  but don't try to extract visual content

---

## Step 7 — Return structured output

Return the scraped data in a clean format that other skills/workflows can consume.

**Output format:**

```
## Teams: [Channel/Chat Name]
Scraped [N] messages from [date range]

---

### [Date]

**[HH:MM AM/PM] — [Sender]**
[Message content]

**[HH:MM AM/PM] — [Sender]**
[Message content]
  > **[Reply sender]** (HH:MM): [Reply content]
  > **[Reply sender]** (HH:MM): [Reply content]

---

### [Previous Date]
[...]
```

**When used as a data source for other workflows**, the calling skill will typically
ask for specific things like:
- "Action items or TODOs mentioned in the chat"
- "Decisions that were made"
- "Blockers or issues raised"
- "Questions that haven't been answered"
- "Mentions of [specific person or topic]"

After scraping, analyze the messages through the lens of whatever the user asked for.
If the user asked about TODOs, scan for action-oriented language: "can you", "please",
"need to", "let's", "TODO", "action item", "follow up", "@mentions with requests".
Cross-reference with other data sources (Asana tasks, Compass actions) if available
in the conversation context.

---

## Integration with account workflows

This skill is designed to be a **composable data source** that other Compass skills
pull from when building a complete account picture. When any account-level inquiry
happens — account-360, call-prep, weekly-status, delivery-risk-radar, etc. — Teams
chat should be treated as another signal source alongside Compass health data, Gong
calls, Asana tasks, and Salesforce opportunities.

**How other skills should use this:**

When an account-focused skill is running (e.g., "brief me on BMS", "prep me for my
call with Fogo de Chao"), it should:

1. Follow the steps in this skill to scrape the relevant Teams chat for that account
2. Include the Teams data in its synthesis — look for:
   - Recent discussion themes (what's the team talking about?)
   - Action items or commitments mentioned in chat but not yet in Asana
   - Blockers, escalations, or customer concerns raised async
   - Decisions made in chat that should be documented elsewhere
   - Tone and sentiment — is the team confident, stressed, stuck?
3. Call out **gaps** — things discussed in Teams that don't have corresponding
   Asana tasks, Compass actions, or Gong follow-ups. These are the "missing tasks"
   that should be proposed.

**Cross-referencing with Asana:**

When checking for outstanding TODOs, the pattern is:
1. Pull Asana tasks for the account/project (via Asana MCP tools)
2. Scrape the Teams chat for the same account
3. Compare: are there things people committed to in Teams that don't have
   an Asana task? Are there Asana tasks that seem stale but are being actively
   discussed in Teams?
4. Surface the delta — propose new tasks for commitments that aren't tracked,
   and flag tasks that may need updating based on chat activity

---

## Tips and edge cases

**Teams URL**: Teams now redirects `teams.microsoft.com/v2/` to `teams.cloud.microsoft/`.
Both work as entry points. The tab title will show `"Chat | [Chat Name] | Microsoft Teams"`
when loaded successfully.

**Large channels**: Some engagement channels may have hundreds of messages. Don't try
to scrape everything — focus on the time range relevant to the user's question. Start
from the bottom (most recent) and scroll up.

**File sharing**: Teams channels often have shared files. If the user asks about shared
documents, note the file names and who shared them, but don't try to download or open
the files — just report what was shared.

**Mentions and notifications**: @mentions appear with a special highlight. These are
often high-signal — someone was directly asked to do something. Flag these when scanning
for action items.

**Meeting chat vs channel**: The "Meeting chats" tab contains chats from Teams meetings.
These can be valuable for finding decisions and action items from calls. Navigate to this
tab if the user asks about what was discussed in a specific meeting.

**Multiple matches**: If searching for a channel returns multiple results (e.g., the
user says "BMS" and there are several BMS-related channels), show the user the options
and ask which one they want to read.

**Rate of scrolling**: Teams loads messages in chunks. After each scroll-up, wait
1-2 seconds before reading. If the content doesn't change after scrolling, you've
reached the beginning of the conversation history.

**Pop-ups and notifications**: Teams may show notification pop-ups, "What's new" modals,
or update banners. Dismiss these by clicking "X" or "Got it" before proceeding with
the scrape.

## Memory

### Before executing
- Call `memory_bundle` with scope `{account_id, engagement_id}` (when engagement context exists) and intent `"prep"` to load account and engagement context.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}` (when engagement context exists), hints `{layers: ["engagement-observations"]}`, content: key discussion threads, decisions made in chat, action items, blockers raised, team sentiment.
