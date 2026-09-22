---
name: Standup Summarizer
description: "Reformats raw daily standup bullet points into a structured Done / In Progress / Blockers / Next Steps Markdown summary"
version: 1.0.0
tags: ["productivity", "standup", "meetings", "formatting", "summarization"]
---

# Standup Summarizer

## When to use this skill

Use this when the user pastes raw daily standup notes and wants them reformatted into a clean, shareable summary.

Example prompts that route here:

- "Summarize my standup notes"
- "Format these standup bullets for Slack"
- "Here are my standup updates, clean them up"
- "Turn this into a standup summary"

## When NOT to use this skill

Don't use this to schedule standups or create calendar events (use a calendar skill). Don't use this for non-standup meeting notes — the four-section structure only makes sense for daily standups. Don't use this to send the summary anywhere; just format and return it.

## What this skill does

1. Accepts raw standup notes as freeform text (bullet points, sentences, or a mix).
2. Uses Claude to classify each item into one of four categories:
   - **Done** — completed since last standup
   - **In Progress** — actively being worked on today
   - **Blockers** — impediments needing resolution
   - **Next Steps** — planned work for tomorrow or later
3. Outputs a clean Markdown summary with one section per category. Empty sections are omitted.
4. Optionally appends a one-sentence TL;DR if the user asks for it.

## Inputs

- `notes` (required) — raw standup text pasted by the user.
- `author` (optional) — name to include in the summary header (e.g. "Alex — 2026-05-27").
- `tldr` (optional, boolean) — if true, prepend a one-sentence summary above the sections.

## Outputs

A Markdown block ready to paste into Slack, email, or a doc. Example:

```
## Standup — Alex — 2026-05-27

### ✅ Done
- Merged PR #412: auth middleware refactor
- Closed three stale issues

### 🔄 In Progress
- Reviewing Design doc for search ranking v2

### 🚧 Blockers
- Waiting on staging credentials from DevOps

### 📋 Next Steps
- Start spike on embedding model integration
```

## Failure modes and recovery

- **No items classified** — if Claude cannot identify any standup items in the input, ask the user to paste cleaner notes (one item per line works best).
- **Ambiguous item** — if an item could fit Done or In Progress, default to In Progress and note the assumption in a parenthetical.
- **All sections empty** — surface a message: "I couldn't find any standup items in what you pasted. Try one item per line."

## Notes

This is a temp skill created to test the archiving workflow. It is not intended for production use.
