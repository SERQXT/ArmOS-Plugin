---
name: consulting-report
description: Generate a Domo-branded Business Impact Review PDF for a named consulting account, grounded in the Consulting Command Centre AppDB (billable hours + weekly notes) and rendered via the domo-branded-pdf skill. Trigger when the user names an instance/account and asks for a consulting report, business impact review, or engagement summary.
---

# Consulting Report

Produce a client-ready **Business Impact Review** PDF for one consulting account. The
report is grounded in real data from the **Consulting Command Centre** AppDB on
`domo.domo.com` (billable timesheet hours + AI-polished weekly notes) and rendered with
the `domo-branded-pdf` skill.

`SKILL_DIR` below = `/Users/arminas.juknevicius/orca/projects/arminimum/.claude/skills/consulting-report`.

## Workflow

### 1. Resolve the account
The user names an instance/account (for example "Simply Thank You", "Independent"). Pull
its data with the bundled script, run from the project root (where `.env` lives):

```bash
cd /Users/arminas.juknevicius/orca/projects/arminimum
python3 "SKILL_DIR/scripts/pull_engagement.py" "<account substring>"
```

- If the name is ambiguous or you are unsure it exists, list accounts first:
  `python3 "SKILL_DIR/scripts/pull_engagement.py" --list`
- The script prints: total billable hours, hours by workstream (`ace` / `named` /
  `update`), hours by week, and the weekly notes (`updateText`) with RAG status.
- Add `--json out.json` to also capture a structured file you can re-read while authoring.

The script reads `DOMO_DOMO_DEVELOPER_TOKEN` from `.env`. **Never print or commit the token.**

### 2. Ask the same two clarifying questions
Use `AskUserQuestion` (one call, two questions):

1. **Framing** — how to present the hours. Offer options based on what the data shows:
   - *Full engagement* — all hours across every workstream.
   - *ACE Accelerate focus* — only the `ace:` hours (use when ACE is the story and the
     managed/`update:` hours would dwarf it).
   - *Recent period* — the last N weeks only.
   Recommend the framing that matches the data honestly. If ACE hours are a small slice
   of a much larger managed-service total, say so and do not clone an "all ACE" framing
   onto non-ACE hours.
2. **Reporting period** — the label for the cover/footer (for example "Aug 2026",
   "May to August 2026").

### 3. Author the HTML (cover + body)
Copy the structure from a prior report as the template:
- `workspace/Independent Digital News & Media/impact_cover.html` and `impact_body.html`
  (compact ACE-focus example), or
- `workspace/Simply Thank You/impact_cover.html` and `impact_body.html` (full 6-page example).

Write the new files under `workspace/<Org Name>/impact_cover.html` and `impact_body.html`.

Structure: **cover** (one `.cover` section) + **body** (one `<section class="content">`
per page): (1) executive summary with 3 KPI tiles, (2) value-delivered cards, (3) hours
breakdown table by delivery phase, (4) key takeaways checklist + recommended next steps.
Group weeks into 3-5 named delivery phases; each phase row shows Focus / Period / Hours /
bullet notes. The hours in the table **must sum to the real total** the script reported.

### 4. Clean the content (mandatory)
- Notes come from `updateText` (AI-polished), never raw `quickNotes`.
- Generalise personal names to roles: "the customer", "the <Org> stakeholders", "the
  external systems integrator (ESI)". Never put a real individual's name in the deliverable.
- Convert "•" bullets and `**markdown**` to HTML lists / `<strong>`.
- **No em-dashes, no emoji, no raw Unicode glyphs** (use inline SVG icons). Domo Blue
  `#99CCEE` for fills/accents only, never text. Charcoal `#3F454D` text. Open Sans only.
- Link `domo.css` and assets by absolute path:
  `/Users/arminas.juknevicius/.claude/skills/domo-branded-pdf/theme/domo.css`.

### 5. Render + QA
```bash
DOMO_PDF=/Users/arminas.juknevicius/.claude/skills/domo-branded-pdf
cd "workspace/<Org Name>"
NODE_PATH=$(npm root -g) node "$DOMO_PDF/scripts/render_pdf.js" \
  impact_body.html "<Org>_Business_Impact_Review.pdf" --cover impact_cover.html
bash "$DOMO_PDF/scripts/qa_pdf.sh" "<Org>_Business_Impact_Review.pdf" /tmp/qa 150
```
Read every QA PNG and confirm the domo-branded-pdf checklist: full-bleed cover with no
footer, content footered + numbered from 1, Open Sans throughout, Domo Blue as fill only,
no clipping, no em-dashes/emoji. Fix and re-render until clean, then `open` the PDF.

## AppDB data shape (baked into the script — reference only)
- Collections on `domo.domo.com`: timesheets `07ab0050-bb16-4d32-b042-8265aafd94aa`,
  weeklyUpdates `69f2dbad-b94f-4eeb-ab20-d0d5d3b81840`. Endpoint:
  `GET /api/datastores/v1/collections/{id}/documents/?limit=200&offset=N`, header
  `X-DOMO-Developer-Token`, paged 200 at a time.
- App fields nest under `doc.content`; the app appends a doc per edit, so dedupe by latest
  `updatedOn`. Timesheet `hours` is a `{mon..fri}` dict — sum it. `projectId` prefix
  encodes workstream (`ace:` / `named:` / `update:`). weeklyUpdates has no `accountName`
  and links by `projectId`.

## House rules
- Keep working files under `workspace/<Org Name>/` (git-ignored scratch space).
- Ground every number in the script output; do not fabricate hours or outcomes.
- Never print or commit the developer token.
