---
name: knowledgebase-navigator
tier: 1
description: "Navigate and retrieve information from the project knowledgebase. Trigger with 'what do we know about', 'check the knowledgebase', 'what's in the KB', 'meeting notes', 'review the uploaded docs', 'what was discussed', 'project context', 'background on this account'. Also trigger when the user asks a question that likely requires uploaded project knowledge (meeting transcripts, discovery docs, prior analysis)."
maturity: alpha
audience: [intelligence, orchestration]
---

# Knowledgebase Navigator

Efficiently retrieves and synthesizes information from the project knowledgebase. The knowledgebase contains distilled versions of uploaded files — meeting transcripts, discovery documents, analysis reports, and other project materials.

## How It Works

```
User asks about project context
            |
    Read <knowledgebase-index> from boot context
    (directory path + file listing)
            |
    +---------+---------+
    |                   |
  knowledgebase.md    Individual *-distilled.md
  (consolidated)      (per-file distilled content)
    |                   |
    +---------+---------+
            |
    Synthesize answer from relevant files
            |
    Cite sources (which files, which sections)
```

## Triggers

- "what do we know about [topic]"
- "check the knowledgebase"
- "what's in the KB"
- "meeting notes from [date/topic]"
- "review the uploaded docs"
- "what was discussed about [topic]"
- "project context"
- "background on this account"
- "what did [person] say about [topic]"
- "summarize what we know"
- Any question likely requiring uploaded project knowledge

## Execution Flow

### Step 1: Locate the Knowledgebase

Check boot context for `<knowledgebase-index>` or `<account-knowledgebase-index>` tags. These contain:
- Directory path (e.g., `/path/to/customer/Opportunities/opp/knowledgebase/`)
- File listing (e.g., `knowledgebase.md, meeting-2026-01-15-distilled.md, discovery-doc-distilled.md`)

If no index is present, the knowledgebase is empty — tell the user and suggest they upload documents.

### Step 2: Search the Consolidated File — Don't Blind-Read It

The consolidated files (`{folder}-knowledgebase.md` — e.g. `meetings-knowledgebase.md`, `emails-knowledgebase.md`, `documents-knowledgebase.md`) are **append-only and grow without bound** as content is ingested. On active accounts they routinely exceed the Read tool's limit (256KB / 25,000 tokens), so **reading one whole will fail**. Do NOT `Read` a consolidated file whole unless the index shows it is small.

Instead, retrieve only what you need:

1. **Grep for the relevant sections first.** `Grep` is not size-limited — search the consolidated file for the topic, person, date, or keyword.
   ```
   Grep: pattern="<topic|person|date>", path="{kbDir}/{folder}-knowledgebase.md", output_mode="content", -n=true
   ```
2. **Read only the matching slice** using the line numbers Grep returns:
   ```
   Read: {kbDir}/{folder}-knowledgebase.md  (offset=<line>, limit=<n>)
   ```
3. **Prefer per-file distilled docs for detail** — for a specific meeting/document, read its individual `*-distilled.md` file (small and scoped).

If a Read returns a "file content exceeds maximum allowed size/tokens" error, that is expected on a large KB — switch to Grep + offset/limit; do not retry the whole-file Read.

### Step 3: Drill Into Individual Files (if needed)

If the consolidated file doesn't have enough detail, or if the user asks about a specific document/meeting, read the individual `*-distilled.md` file.

File naming convention:
- `{original-filename}-distilled.md` — Distilled from uploaded file
- Files are structured with: Summary, Key Facts, Action Items, Decisions, Context

### Step 4: Check Account-Level KB (if in an opportunity)

If the boot context has `<account-knowledgebase-index>`, the account-level knowledgebase contains shared context across all opportunities for this customer. Check it when:
- The user asks about the customer broadly (not just this opportunity)
- The opportunity KB doesn't have the answer
- The question spans multiple engagements

### Step 5: Synthesize and Cite

When answering:
- **Cite which file(s)** the information came from
- **Quote specific sections** when relevant
- **Flag recency** — note dates from filenames (e.g., "Based on the Jan 15 meeting notes...")
- **Flag gaps** — if the KB doesn't cover the topic, say so explicitly

## Guardrails

- **Never blind-read a consolidated file** — the `*-knowledgebase.md` files grow past the Read size limit (256KB / 25K tokens) on active accounts. Grep for the relevant sections, then Read with offset/limit, or read the smaller per-file `*-distilled.md` docs. A "file exceeds maximum allowed size" error means switch to Grep — don't retry the whole-file Read.
- **Respect the index** — Only read files listed in the knowledgebase-index. Don't guess at filenames.
- **Don't fabricate** — If the knowledgebase doesn't contain information about a topic, say "The knowledgebase doesn't have information on this" rather than synthesizing from general knowledge.
- **Account vs opportunity scope** — Account KB is shared; opportunity KB is specific. Don't conflate them.
- **Cite sources** — Always tell the user which document the information came from so they can verify.

## Connecting MCP Tools

| Tool | Required | What It Does |
|------|----------|-------------|
| Grep (built-in) | **Yes** | Search large KB files for relevant sections without hitting the Read size limit |
| Read (built-in) | **Yes** | Read knowledgebase files from disk — use offset/limit on large consolidated files |
| knowledge_search | Optional | Search persistent agent memory (separate from file KB) |
| knowledge_retrieve | Optional | Retrieve specific persistent memory entries |

## Memory

### Before executing
- Call `memory_recall` with scope `{account_id}` and intent `"prep"` to load account context.

### After executing
- No memory writes required for this utility skill.

## Related Skills

- **Account 360** — Uses KB context to enrich account deep-dives
- **Discovery Questionnaire** — Often generates the documents that end up in the KB
- **Executive Briefing** — Draws from KB for account-specific talking points
