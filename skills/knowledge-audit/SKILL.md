---
name: knowledge-audit
tier: 0
description: "knowledge store, compass memory, and MCP tool coverage. Produces a structured report showing inventory counts, connections, staleness, gaps, and recommendations. Trigger on \"knowledge web\", \"audit knowledge\", \"spin the web\", \"go web go\", \"knowledge audit\", \"what knowledge do we have\", \"skill inventory\", \"audit skills and templates\", \"knowledge health check\", or any request to understand the state of ArmOS's knowledge assets."
maturity: alpha
---

# Knowledge Web

Maps the entire web of ArmOS's knowledge — skills, templates, knowledge store entries,
compass memory health, and MCP tool coverage. Every node is a knowledge asset, every thread
is a connection between them, and every gap is an opportunity. Designed for platform
administrators and knowledge-work leads to understand what exists, what's stale, and what's missing.

---

## How It Works

```
User asks "audit knowledge"
    │
    │   ┌── PARALLEL (steps 1-5 are independent — fire all at once) ──┐
    │   │                                                              │
    ├─→ │ 1. Scan skills inventory (core/skills/**/SKILL.md)          │
    │   │     → Count by plugin, tier, phase, state                   │
    │   │     → Flag skills with no triggers, no MCP refs, stale desc │
    │   │                                                              │
    ├─→ │ 2. Scan knowledge store (knowledge_list)                    │
    │   │     → Count entries by namespace, tag distribution           │
    │   │     → Flag stale entries (>90 days without update)           │
    │   │                                                              │
    ├─→ │ 3. Scan compass memory (memory_recall with intent: patterns)│
    │   │     → Count patterns, decisions, stakeholder records         │
    │   │                                                              │
    ├─→ │ 4. Scan template registry (core/templates/**)               │
    │   │     → Count templates by type (pptx, docx, dotx, email)     │
    │   │                                                              │
    ├─→ │ 5. Scan MCP tool coverage (core/mcps/**/tool-meta.json)     │
    │   │     → List all MCP servers and their tool counts             │
    │   │     → Cross-reference against skill SKILL.md content         │
    │   │                                                              │
    │   └──────────────────────────────────────────────────────────────┘
    │         ↓ all results collected
    └─→ 6. Generate HTML report with findings + recommendations
```

---

## Triggers

- "audit knowledge" / "knowledge audit"
- "knowledge surface report"
- "what knowledge do we have"
- "skill inventory" / "list all skills"
- "audit skills and templates"
- "knowledge health check"
- "what's stale in our knowledge base"
- "knowledge gaps"

---

## Execution Strategy — Parallel First

**Steps 1-5 are completely independent.** None depends on the output of another. Execute them
in parallel by issuing all initial tool calls in a **single response**:

1. **Glob** `core/skills/**/SKILL.md` (skills inventory)
2. **MCP call** `mcp__knowledge-store__knowledge_list` (knowledge store)
3. **MCP call** `mcp__compass-memory__memory_recall` with `intent: "patterns"` (compass memory)
4. **Glob** `core/templates/**/*` (template registry)
5. **Glob** `core/mcps/**/tool-meta.json` (MCP coverage)
6. **Glob** `{workspace}/**/*` (workspace files — for customer audits)

Fire all in one batch. Once all results return, proceed to any follow-up reads needed
(e.g., reading individual SKILL.md frontmatter or tool-meta.json contents), again batching
those reads in parallel where possible. Only Step 6 (HTML report generation) is sequential
because it needs all collected data.

**Goal:** Minimize round-trips. The gather phase should complete in 2-3 tool-call rounds
(initial batch → follow-up reads → report), not 15-20 sequential calls.

If an MCP tool is unavailable (not connected), skip that section immediately — do not retry
or block the other parallel calls.

**CRITICAL — Tool Selection:**
- Use **Glob** for finding files, **Read** for reading file contents. **NEVER use Bash `ls`
  or Bash `find`** — customer workspace paths contain commas and special characters that break
  shell commands. A single failed Bash call cancels all parallel calls in the batch.
- Glob and Read handle special characters correctly. Bash does not.

---

## Execution Flow

### Step 1: Skills Inventory *(parallel — batch with steps 2-5)*

Glob `core/skills/**/SKILL.md`, then **batch-read all matched files in one round** (up to 20
Read calls in parallel). For each skill extract:
- **Name, plugin, tier, phase, state** from frontmatter
- **Trigger count** — how many trigger phrases are defined
- **MCP tool references** — which tools does the skill mention
- **Template references** — does it reference the template registry
- **Memory operations** — does it read/write compass memory

Produce a summary table:

| Plugin | Skills | Ready | Planned | Future | Avg Triggers |
|--------|--------|-------|---------|--------|-------------|
| compass-core | 23 | 20 | 2 | 1 | 6.5 |
| ps-build | 31 | 28 | 3 | 0 | 4.2 |
| ... | ... | ... | ... | ... | ... |

Flag:
- Skills with state=future or state=planned that haven't been updated in 60+ days
- Skills with empty or minimal descriptions (<50 chars)
- Skills with no MCP tool references (may be orphaned or documentation-only)

### Step 2: Knowledge Store Health *(parallel — batch with steps 1, 3-5)*

Call `mcp__knowledge-store__knowledge_list` to get the full manifest. If the MCP is not
connected, note "Knowledge Store: unavailable" and move on — do not block other steps.

Analyze:
- **Total entries** and **entries by namespace**
- **Tag distribution** — most/least common tags
- **Freshness** — entries updated in last 7/30/90 days vs older
- **Orphans** — entries with no tags or empty summaries

### Step 3: Compass Memory Coverage *(parallel — batch with steps 1-2, 4-5)*

Call `mcp__compass-memory__memory_recall` with `intent: "patterns"` to assess cross-account
pattern coverage. If the MCP is not connected, note "Compass Memory: unavailable" and move on.

Report:
- **Total patterns stored**
- **Pattern categories** (solution patterns, risk patterns, adoption patterns)
- **Coverage gaps** — which engagement phases have thin pattern coverage

### Step 4: Template Registry *(parallel — batch with steps 1-3, 5)*

Glob `core/templates/**/*`, then batch-read as needed. For each template:
- **File type** (pptx, docx, dotx, xlsx)
- **Category** (brand, adoption, pmo, cs-solutions)
- **Last modified date**
- **Referenced by** — which skills mention this template

Flag:
- Templates not referenced by any skill (orphaned)
- Templates older than 1 year (may need refresh)
- Skills that reference templates that don't exist on disk (broken references)

### Step 5: MCP Tool Coverage Map *(parallel — batch with steps 1-4)*

Glob `core/mcps/**/tool-meta.json`, then batch-read all matched files in parallel.
Cross-reference against skill SKILL.md content (already collected in Step 1).

Produce a coverage matrix:

| MCP Server | Tools | Skills Referencing | Coverage |
|-----------|-------|-------------------|----------|
| compass-domo | 10 | 8 skills | 80% |
| domo-datasets | 5 | 12 skills | 100% |
| knowledge-store | 6 | 3 skills | 50% |
| ... | ... | ... | ... |

Flag:
- MCP tools with 0 skill references (unused or undocumented)
- Skills that reference MCP tools from servers that don't exist (stale references)

### Step 6: Generate Report (JSON + Template)

**Do NOT generate HTML.** The template renders everything from JSON data.

1. **Read** the template: `core/skills/compass-core/skills/knowledge-audit/report-template.html`
2. **Build a JSON object** matching the schema below
3. **Replace the single token** `{{REPORT_DATA}}` with the JSON string (no pretty-printing — compact JSON to minimize output size)
4. **Write** the result to `{workspace}/knowledge-web-{YYYY-MM-DD}.html`
5. Inform the user of the file path

The template's JavaScript renders all KPI cards, tables, timelines, gap cards, and recommendations
from the JSON. You produce DATA, not markup. This is critical for speed.

#### JSON Schema

```json
{
  "scope": "platform | customer",
  "scopeLabel": "Platform" or "Customer Name",
  "date": "YYYY-MM-DD",
  "timestamp": "ISO string",

  "kpi": {
    "skills":    { "total": 153, "subtitle": "140 ready / 10 planned / 3 future", "status": "green | amber | red" },
    "knowledge": { "total": 45,  "subtitle": "38 fresh / 7 stale",               "status": "green | amber | red" },
    "artifacts": { "total": 9,   "subtitle": "4 pptx, 3 md, 2 json",             "status": "green | amber | red" },
    "templates": { "total": 24,  "subtitle": "20 referenced / 4 orphaned",        "status": "green | amber | red" },
    "mcp":       { "total": 200, "subtitle": "15 servers / 180 tools covered",    "status": "green | amber | red" },
    "memory":    { "total": 32,  "subtitle": "18 solution / 8 risk / 6 adoption", "status": "green | amber | red" },
    "workspace": { "total": 25,  "subtitle": "8 artifacts, 6 qa, 4 code, ...",    "status": "green | amber | red" },
    "health":    { "score": 78,  "status": "amber", "summary": "3 issues need attention", "formula": "triggers 92% + freshness 78% + templates 85% + MCP 60%" }
  },

  "sections": {
    "skills": {
      "pluginSummary": [
        { "plugin": "compass-core", "count": 24, "ready": 22, "planned": 2, "future": 0, "avgTriggers": 6.5, "phase": "Discover / Ops", "notable": "account-360, call-prep, knowledge-audit, sync-emails" }
      ],
      "flags": [
        { "severity": "amber", "title": "Flag title", "detail": "Description with specifics — name the skills, count the gap, explain the impact" }
      ]
    },

    "knowledge": {
      "unavailable": null,
      "columns": [{ "label": "Namespace", "key": "namespace" }, { "label": "Entries", "key": "count", "type": "number" }, { "label": "Fresh (<90d)", "key": "fresh", "type": "number" }, { "label": "Stale", "key": "stale", "type": "number" }, { "label": "Tags", "key": "tags" }],
      "table": [{ "namespace": "engagement", "count": 12, "fresh": 10, "stale": 2, "tags": "discovery, intake, stakeholder" }],
      "summary": "Detailed assessment — call out what namespaces are missing, what's stale, actionable next steps"
    },

    "memory": {
      "unavailable": null,
      "columns": [{ "label": "Pattern Category", "key": "category" }, { "label": "Count", "key": "count", "type": "number" }, { "label": "Examples", "key": "examples" }],
      "table": [{ "category": "Data Architecture & ETL", "count": 10, "examples": "Bronze-silver-gold, snapshot-before-append, upsert strategies" }],
      "summary": "Include coverage gaps: which engagement phases (Discover, Adopt, Change Management) have thin or zero pattern coverage"
    },

    "templates": {
      "columns": [{ "label": "Category", "key": "category" }, { "label": "Files", "key": "count", "type": "number" }, { "label": "Types", "key": "types" }, { "label": "Key Templates", "key": "notable" }, { "label": "Skill Coverage", "key": "status" }],
      "table": [
        { "category": "pmo", "count": 13, "types": "12 docx, 1 pptx", "notable": "Welcome Email, Weekly Agenda, Meeting Minutes, Status Report, Project Close", "status": "covered" },
        { "category": "discovery", "count": 0, "types": "—", "notable": "—", "status": "uncovered", "_flag": "amber" }
      ]
    },

    "mcp": {
      "columns": [{ "label": "MCP Server", "key": "name" }, { "label": "Tools", "key": "tools", "type": "number" }, { "label": "Category", "key": "category" }, { "label": "Coverage", "key": "coverage", "coverage": true }],
      "table": [
        { "name": "domo-pages", "tools": 42, "category": "Pages, Cards, App Studio, Layouts", "coverage": 85 },
        { "name": "domo-datasets", "tools": 20, "category": "Datasets, Streams, Schema, Webforms", "coverage": 90 },
        { "name": "ms-365", "tools": 150, "category": "Mail, Calendar, Teams, OneDrive (runtime)", "coverage": 15 }
      ]
    },

    "workspace": {
      "columns": [{ "label": "File Type", "key": "type" }, { "label": "Count", "key": "count", "type": "number" }, { "label": "Purpose", "key": "purpose" }],
      "table": [
        { "type": ".js", "count": 2084, "purpose": "Application code, custom apps, build artifacts" },
        { "type": ".md", "count": 2020, "purpose": "Documentation, skill definitions, notes" }
      ]
    },

    "customerContext": {
      "cards": [
        { "title": "Account Overview", "items": [{ "label": "Account", "value": "Young & Laramore" }, { "label": "Industry", "value": "Media (Advertising)" }, { "label": "Contact", "value": "Jake Smith, Manager" }, { "label": "SF Account ID", "value": "0013800001GezoTAAR" }] },
        { "title": "Engagement Goals", "text": "Eliminate recurring Excel export cycle with a filterable, client-ready app inside Domo" },
        { "title": "Products & Services", "items": [{ "label": "App", "value": "Paid Media Performance Hub" }, { "label": "Instance", "value": "domo-ps-repo.domo.com" }] },
        { "title": "Current Phase", "text": "Pre-discovery — MVP v1.2 deployed, awaiting first discovery call" }
      ],
      "flags": [
        { "severity": "green", "title": "Intake survey captured", "detail": "5 structured questions answered with confidence ratings" },
        { "severity": "amber", "title": "22 days since intake", "detail": "No discovery call scheduled — momentum at risk" }
      ]
    },

    "documentedIntel": {
      "groups": [
        {
          "title": "Pipeline Outputs (500apps Automation)",
          "columns": [{ "label": "Document", "key": "name" }, { "label": "Content Summary", "key": "summary" }, { "label": "Quality", "key": "quality" }],
          "rows": [
            { "name": "INTAKE-FIELDS.md", "summary": "Structured field map from Salesforce: account ID, contact, industry, 5 survey themes with confidence ratings", "quality": "Complete" },
            { "name": "NORTHSTAR.md", "summary": "Business outcome, user actions, agentic behaviors, hero metric, traceability matrix", "quality": "Complete" },
            { "name": "BUILD-SPEC.md", "summary": "Full build spec: scope, visual personality, architecture, 3 tabs with DOM IDs + handlers", "quality": "Complete" }
          ]
        },
        {
          "title": "Brand & Design",
          "rows": [{ "name": "brandkit-young-laramore.md", "summary": "Full brand kit: Y&L Yellow #FFCD00, typography, chart colors, surface tokens", "quality": "Complete" }]
        }
      ]
    },

    "knowledgeGaps": [
      { "severity": "critical", "title": "No Compass Memory for this account", "detail": "SF Account ID 0013800001GezoTAAR has 0 entries. All intelligence is local-only.", "action": "Use memory_remember to persist stakeholder info, engagement status, and key decisions" },
      { "severity": "critical", "title": "No meeting transcripts", "detail": "meetings/ folder is empty. No discovery call recorded or ingested.", "action": "Schedule and record discovery call, then ingest transcript" },
      { "severity": "amber", "title": "Single stakeholder identified", "detail": "Only Jake Smith (Manager) is documented. Economic buyer and other team members unknown.", "action": "Map stakeholders during discovery call" }
    ],

    "timeline": [
      { "date": "2026-04-08", "title": "Intake survey submitted", "detail": "By Jake Smith, Manager — 5 structured questions answered", "color": "blue" },
      { "date": "2026-04-09", "title": "Pipeline processed: intake, north star, build spec generated", "detail": "Full automation via 500apps pipeline", "color": "green" },
      { "date": "2026-04-09", "title": "MVP v1.0 deployed to domo-ps-repo", "detail": "Page 896732077 — Paid Media Performance Hub", "color": "green" },
      { "date": "2026-04-16", "title": "App redeployed v1.2, brand kit created", "detail": "Stale card ID fixed, discovery handoff rebuilt", "color": "green" },
      { "date": "2026-04-30", "title": "22 days since intake, no discovery call scheduled", "detail": "Momentum at risk — outreach needed", "color": "amber" }
    ],

    "recommendations": [
      { "priority": "high", "title": "Schedule discovery call with Jake Smith", "detail": "22 days since intake. Demo app is built and ready. Use DISCOVERY-HANDOFF.md conversation guide. Send DISCOVERY-EMAIL.md outreach. Every day of delay risks losing momentum." },
      { "priority": "high", "title": "Persist account context to Compass Memory", "detail": "All intelligence is trapped in local workspace files. Use memory_remember to save stakeholder info, engagement status, and SF Account ID. Prevents data loss if workspace is cleared." },
      { "priority": "medium", "title": "Create discovery and build phase templates", "detail": "55 skills across Discover (24) and Build (31) phases have zero templates. Priority: discovery questionnaire, stakeholder map worksheet, kickoff deck, dashboard design spec." },
      { "priority": "low", "title": "Add triggers to remaining 11 skills", "detail": "11 skills (7%) lack trigger phrases. Current coverage is 93% — closing this gap is low effort, high polish." }
    ]
  }
}
```

**Be RICH with data, not minimal.** The JSON should contain the same level of detail you would
put in a hand-written report. Specifically:

- **Skills**: Include `phase` and `notable` (list of key skill names) per plugin row
- **Memory**: Include an `examples` column with actual pattern names/descriptions from the data
- **MCP**: MUST include `coverage` (integer 0-100) and `category` columns — these render as visual progress bars. Do NOT use a plain "status" text column for MCP.
- **Templates**: Include `notable` (key template names) and `status` columns. Flag missing categories (discovery, build, kickoff) with `"_flag": "amber"`
- **Workspace**: Break down by file type with purpose descriptions, not just folder names
- **Recommendations**: Write 2-3 sentence details with specific action steps, not one-liners
- **Flags/Gaps**: Name the specific skills, files, or accounts. Quantify the gap. Explain the impact.
```

#### Status Thresholds

| KPI | Green | Amber | Red |
|-----|-------|-------|-----|
| Skills | >80% ready | 50-80% | <50% |
| Knowledge (platform) | <30% stale | 30-60% stale | >60% stale |
| Artifacts (customer) | >5 files | 1-5 | 0 |
| Templates | <20% orphaned | 20-40% | >40% |
| MCP Tools | >80% covered | 50-80% | <50% |
| Memory | >20 patterns | 5-20 | <5 |
| Workspace | >10 files | 1-10 | 0 |
| Health | >80 | 50-80 | <50 |

#### Health Score Formula

```
health = (
  (skills_with_triggers / total_skills) * 0.25 +
  (fresh_knowledge / total_knowledge) * 0.25 +
  (referenced_templates / total_templates) * 0.25 +
  (tools_with_skill_coverage / total_tools) * 0.25
) * 100
```

If a data source is unavailable, exclude its weight and redistribute equally.

#### Customer-Only Sections

`customerContext`, `documentedIntel`, `knowledgeGaps`, and `timeline` are only rendered when
`scope` is `"customer"`. For platform audits, omit these keys or set them to `null` — the
template skips them automatically.

#### Key Rules

- **Output compact JSON** — no pretty-printing, no extra whitespace. Every saved token = faster generation.
- **Do NOT generate any HTML** — the template JS handles all rendering.
- **Do NOT modify the template file** — only read it and replace `{{REPORT_DATA}}`.
- **`status` values in table rows** become pill CSS classes — use lowercase words like `ready`, `planned`, `fresh`, `stale`, `active`, `error`, `complete`, `rich`, `empty`, `growing`, `partial`.
- **`_flag` key on table rows** sets row highlighting: `"red"` or `"amber"`.
- **`coverage` in table columns** triggers automatic progress bar rendering — value should be an integer 0-100.

---

## Connecting MCP Tools

| Tool | Role | Required? |
|------|------|-----------|
| `mcp__knowledge-store__knowledge_list` | List all knowledge entries + manifest | Yes |
| `mcp__knowledge-store__knowledge_search` | Search for specific knowledge | Optional |
| `mcp__compass-memory__memory_recall` | Query cross-account patterns | Optional |
| `mcp__compass-memory__memory_bundle` | Get account context bundles | Optional |

The skill also uses the **filesystem** (Read, Glob tools) to scan SKILL.md files and
template directories directly. No external API calls required for the core audit.

---

## Guardrails

- This is a **read-only audit** — do not modify, delete, or create any files (except the output HTML)
- **Do not modify the template** (`report-template.html`) — only read it and replace the `{{REPORT_DATA}}` token with JSON
- Report findings objectively — flag issues but don't auto-fix
- If MCP tools are unavailable (not connected), skip that section and note it
- Keep the report concise — summary tables, not raw data dumps
- Include timestamps so audits can be compared over time
- **NEVER use Bash `ls`, `find`, or any shell command for file discovery** — customer paths contain commas and special characters that break shell commands. Use Glob and Read tools exclusively.

---

## Related Skills

- `template-registry` — Source of truth for templates (audit verifies template existence)
- `knowledgebase-navigator` — Searches knowledge store (audit checks store health)
- `contribute` — Adds knowledge entries (audit identifies what needs contributing)
- `account-360` — Uses compass memory (audit checks memory coverage)
