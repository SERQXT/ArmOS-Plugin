# Demo context card — canonical template

**This is a reusable ProCode card template** for the demo page on domo-ps-repo. It provides a polished, marketing-quality summary of what the app does and why it matters. Agents do NOT design this layout each time — they copy this template and inject slot data.

The output must read like **Domo marketing material** — business-friendly language, clear value proposition. Use Domo product terminology as-is (AppDB, Datasets, Code Engine, Magic ETL, Workflows, Domo AI) — Domo business users understand these terms. Think: something a VP or exec at a Domo customer could scan in 10 seconds and understand the value.

## Template reference

| Item | Value |
|------|-------|
| **Template path** | `template/demo-context-card/` |
| **Used by** | `steps/15-publish-internal-demo.md` (Phase 4, step 4) |
| **Slot data format** | JSON in a `<script type="application/json" id="slot-data">` element |
| **Brand system** | Domo Design Playbook — Open Sans, Domo Blue header, orange accents |

## How agents use this (step 15 instruction)

1. **Copy the template** — copy `template/demo-context-card/` into `code-demo/demo-context/`
2. **Inject slot data** — replace the placeholder JSON inside the existing `<script id="slot-data">` element in `index.html` with real values. The element is already in the template above the reader script — just update its contents.
3. **Update `manifest.json`** — set `name` to `500apps-demo-context-{use-case}`, clear `id` (or use prior `demoContextDesignId`)
4. **Publish** — publish as a separate ProCode design on domo-ps-repo
5. **Place on page** — create a card from this design at the top of the demo page (above the app card)

## Slot data JSON

```json
{
  "use_case_title": "Marketing Attribution Catalog",
  "industry": "Automotive",
  "value_prop": "Give marketing leaders a single source of truth for every initiative and channel effort — with automated attribution tagging that eliminates manual UTM management.",
  "challenge": "Marketing teams managed initiatives across disconnected spreadsheets and Monday.com boards. Channel efforts had no standardized tracking, UTM values were inconsistent, and leadership couldn't see which initiatives were actually driving results.",
  "result": "One unified catalog where strategy architects create initiatives, campaign executors log channel efforts with standardized identifiers, and UTM campaign values are auto-generated — giving leadership a clear line of sight from initiative to attribution.",
  "capabilities": [
    { "name": "AppDB", "count": 1, "detail": "collection" },
    { "name": "Datasets", "count": 3, "detail": "connected" },
    { "name": "Domo AI", "count": 2, "detail": "integrations" }
  ],
  "how_it_works": "AppDB persistence for initiative and effort management, live Datasets for channel performance metrics, and spreadsheet import for bulk onboarding from Monday.com."
}
```

## Primary source: `delivery/DELIVERY-SUMMARY.md`

**Read the delivery summary first.** It's the richest, most complete source — written after the full build. It contains the app name, what it does (with a one-line value statement), key capabilities delivered, data connections table (with exact counts of Datasets and AppDB collections), success criteria, and out-of-scope items. Distill from it rather than re-analyzing the code.

| Slot | Pull from delivery summary | Fallback (if no delivery summary) |
|------|---------------------------|-----------------------------------|
| `use_case_title` | App name / title (anonymize customer name) | Infer from manifest + code |
| `value_prop` | "What This App Does" → one-line value sentence | Infer from NORTHSTAR.md |
| `challenge` | Problem context from "What This App Does" intro | Infer from NORTHSTAR.md |
| `result` | "Success Criteria" + "Key Capabilities" distilled | Infer from BUILD-SPEC.md |
| `capabilities` | Count from "Data Connections" table + capability list | Count from manifest |
| `how_it_works` | Summarize the approach from capability descriptions | Infer from code analysis |

## Language rules

| Slot | What it is | Guidance |
|------|-----------|----------|
| `use_case_title` | Benefit-oriented name | "Marketing Attribution Catalog" not "CRUD App v2" |
| `industry` | Industry vertical | "Automotive", "Healthcare", "Retail" |
| `value_prop` | One sentence elevator pitch | What business outcome this enables — written for a VP |
| `challenge` | Business pain | What the team struggled with BEFORE this app |
| `result` | Measurable outcome | What changed. Frame as team impact: "Now the team can..." |
| `capabilities` | Domo features used with counts | Array of `{ name, count, detail }` objects. Do NOT include "ProCode App" — that's implicit. |
| `how_it_works` | One sentence | How the app delivers the result — approachable but Domo-literate |

### Capability format

Each capability is an object with a count. Do NOT include "ProCode App" — that's always true and obvious from the context.

```json
{ "name": "AppDB", "count": 1, "detail": "collection" }
```

Renders as: **AppDB** 1 collection

Available capability names (use Domo product terms as-is):

| Name | `detail` (singular/plural) | Example |
|------|---------------------------|---------|
| AppDB | collection(s) | 2 collections |
| Datasets | connected / created | 3 connected |
| Domo AI | integration(s) | 2 integrations |
| Code Engine | function(s) | 1 function |
| Magic ETL | dataflow(s) | 3 dataflows |
| Workflows | workflow(s) | 1 workflow |
| Dashboards | page(s) | 2 pages |

Only list the ones actually used by the app. Count from the manifest and code analysis.

## Layout

The card renders as a Domo-branded marketing card:

```
┌─────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░  DOMO BLUE HERO BANNER  ░░░░░░░░░░░░ │
│  {Industry} · Domo Professional Services            │
│  {Use Case Title}                                   │
│  {Value proposition — the elevator pitch}           │
├─────────────────────────┬───────────────────────────┤
│                         │                           │
│  THE CHALLENGE          │  POWERED BY               │
│  {challenge text}       │  (AppDB 1 collection)     │
│                         │  (Datasets 3 connected)   │
│  THE RESULT             │  {how it works}           │
│  {result text — bold}   │                           │
└─────────────────────────┴───────────────────────────┘
```

Domo Blue gradient header, Open Sans typography, pill-shaped capability tags. Designed for `h:16` on the 60-unit Domo grid.

## Updating the template

Edit the files in this folder directly. All future captures use the updated layout. Existing demos on domo-ps-repo are not affected (they're published copies).
