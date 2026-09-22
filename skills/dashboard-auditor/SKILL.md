---
name: dashboard-auditor
tier: 1
description: "Evaluates an existing Domo dashboard against design science principles. Trigger with 'audit this dashboard', 'evaluate the dashboard', 'what's wrong with this page', 'review the dashboard', or any request to assess dashboard quality. Pulls card definitions, scores each card and the overall layout, then produces an audit report with keep/rebuild/delete decisions that feeds into dashboard-builder."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by dashboard-v2-build (T2) Guardrails section, which encodes the audit criteria as refusal conditions."
audience: [orchestration]
---

# Dashboard Auditor — Evaluate Dashboards Against Design Science

Evaluates an existing Domo dashboard (page) against design science principles. Produces a structured audit report: what to keep, what to rebuild, what to delete. Used when redesigning an existing dashboard — not when building from scratch.

The audit report feeds directly into the **dashboard-builder** orchestration as input for redesign workflows.

## Shared Knowledge

Before auditing, read these shared references:

| Reference | What It Covers | When to Read |
|-----------|---------------|--------------|
| `../dashboard-builder/reference/dashboard-principles.md` | Design science rules to audit against | Before Step 3 (evaluation criteria) |
| `../dashboard-builder/reference/dashboard-review-criteria.md` | 8-dimension visual scoring framework | Step 3 (visual evaluation) |
| `../dashboard-builder/reference/lessons-learned.md` | Common failure patterns to check for | Step 3 (diagnosing card issues) |
| `../card-builder/reference/chart-types.md` | Valid chart types and their appropriate use | Step 3 (checking chart type validity) |

## Triggers

- "audit this dashboard"
- "evaluate the dashboard"
- "what's wrong with this page"
- "review the fulfillment dashboard"
- "this dashboard is bad — what should we change?"
- "assess dashboard quality"
- "score this page"

---

## Execution Flow

### Step 1: Pull Current Dashboard State

Gather the complete state of the target page:

```
page_cards(page_id)                → list of card IDs on the page
card_bulk_definitions(card_ids)    → full card definitions (chart type, columns, mappings, filters, beast modes)
```

For each card, also extract:
- Chart type
- Dataset(s) used
- Column mappings (ITEM, VALUE, SERIES, etc.)
- Aggregations applied
- Filters
- Beast modes referenced
- Title

If the page ID isn't known, use `page_list` to find it by name.

### Step 2: Profile the Underlying Data

For each unique dataset powering the cards:

```
dataset_schema(dataset_id)    → column names and types
dataset_profile(dataset_id)   → cardinality, distributions, date ranges
```

This reveals whether cards are using data effectively — or ignoring available columns that would add context.

### Step 3: Evaluate Against Design Science Criteria

Score each card and the overall dashboard against these criteria. Each criterion maps to a principle from the dashboard-architect skill.

#### Card-Level Evaluation

For **each card**, assess:

| Criterion | Question | Scoring |
|-----------|----------|---------|
| **Context** | Does this KPI have comparison context (vs. target, vs. prior period, vs. benchmark)? Or is it a raw number? | Raw number with no comparison = FAIL. Single value cards without trend/comparison are the #1 dashboard anti-pattern. |
| **Chart type fit** | Is the chart type appropriate for the data relationship? (Cleveland & McGill encoding accuracy) | Pie chart with 6+ slices = FAIL. Gauge = FAIL. 3D anything = FAIL. Dual axis = FAIL. Line chart with 8+ series = FAIL. |
| **Aggregation correctness** | Is the aggregation appropriate? Any double-aggregation (SUM of a SUM beast mode)? | Double aggregation = CRITICAL. Wrong aggregation (AVG when should be SUM) = FAIL. |
| **Data validity** | Does the card actually render data? Any "No data in filtered range" or empty states? | Empty/broken card = CRITICAL — remove or fix immediately. |
| **Business question** | Does the card answer a clear, identifiable business question? Or is it charting data for the sake of charting? | If you can't state the question this card answers in one sentence, it doesn't belong. |
| **Title clarity** | Does the title state what the card shows in plain language? | Vague titles like "Chart 1" or overly technical titles = FAIL. |
| **Dimension cardinality** | If grouping by a dimension, is the cardinality reasonable? | >15 categories in a bar chart = WARN. >50 in any chart = FAIL. |

#### Dashboard-Level Evaluation

Assess the page as a whole:

| Criterion | Question | Scoring |
|-----------|----------|---------|
| **Information hierarchy** | Is there a clear hero → evidence → detail flow? Or is it a flat wall of cards? | No hero card/KPI row = FAIL. All cards same size/weight = FAIL. |
| **Card count** | How many cards? Is it appropriate for the audience? | Executive: >8 cards = TOO MANY. Manager: >12 = TOO MANY. |
| **KPI design** | Do KPI/summary cards have the 5 elements (label, value, comparison, trend, status)? | Raw numbers without context = the Jet's Pizza anti-pattern. |
| **Redundancy** | Are multiple cards showing the same metric with different chart types? | Same metric in both a bar chart and a pie chart = redundant, delete one. |
| **Missing dimensions** | Are there obvious analytical dimensions in the data that no card addresses? | Dataset has Region + Product + Time but cards only show one dimension = GAPS. |
| **Color consistency** | Is the same color used for the same meaning across all cards? Or is it random? | Inconsistent color encoding = WARN. Rainbow palette = FAIL. |
| **Cross-filtering potential** | Are there cards that should be cross-filter sources but aren't configured? | Bar/table cards with good dimension breakdowns but no interactions = MISSED OPPORTUNITY. |

### Step 4: Classify Each Card

Based on the evaluation, classify every card into one of three categories:

| Classification | Criteria | Action |
|----------------|----------|--------|
| **KEEP** | Card answers a clear business question, chart type is appropriate, data is valid, context is present | Leave as-is. May need minor formatting tweaks. |
| **REBUILD** | Card addresses the right business question but has wrong chart type, missing context, bad aggregation, or poor design | Delete the old card, design and build a replacement following dashboard-architect principles. |
| **DELETE** | Card is broken (no data), redundant (duplicate metric), answering no clear question, or using an anti-pattern chart type with no fix | Remove from the page. Do not replace. |

### Step 5: Produce the Audit Report

Output the report in this format:

```markdown
# Dashboard Audit Report: [Page Name]

**Page ID:** [ID]
**Cards Audited:** [N]
**Datasets Used:** [list]
**Audit Date:** [date]

---

## Overall Score: [POOR / NEEDS WORK / ACCEPTABLE / GOOD]

### Summary
[2-3 sentence summary of the dashboard's biggest problems and strengths]

### Top Issues
1. [Most critical issue — e.g., "All 8 KPI cards are raw numbers with no comparison context"]
2. [Second issue — e.g., "No information hierarchy — all cards are the same size in a flat grid"]
3. [Third issue — e.g., "1 card shows 'No data in filtered range' — broken filter or empty dataset"]

---

## Card-by-Card Assessment

### KEEP (N cards)

| Card | Title | Chart Type | Reason to Keep |
|------|-------|------------|----------------|
| [ID] | [Title] | [Type] | [Why it's acceptable] |

### REBUILD (N cards)

| Card | Title | Current Type | Issues | Recommended Fix |
|------|-------|-------------|--------|-----------------|
| [ID] | [Title] | [Type] | [List of failures] | [What to replace it with — chart type, added context, etc.] |

### DELETE (N cards)

| Card | Title | Chart Type | Reason to Delete |
|------|-------|------------|-----------------|
| [ID] | [Title] | [Type] | [Why it should be removed — broken, redundant, etc.] |

---

## Missing Elements

Cards/visualizations that SHOULD exist but don't:

| Missing Element | Business Question It Would Answer | Priority |
|-----------------|-----------------------------------|----------|
| [e.g., Trend chart] | [e.g., "Is fulfillment improving or declining?"] | HIGH |
| [e.g., Comparison KPIs] | [e.g., "How does this month compare to last?"] | HIGH |

---

## Redesign Constraints

These findings should be passed to dashboard-architect as constraints:

- **Datasets available:** [list with IDs]
- **Cards to preserve:** [IDs of KEEP cards — dashboard-architect should design around them]
- **Business questions identified from existing cards:** [inferred from what was built]
- **Anti-patterns to avoid:** [specific issues found — e.g., "raw KPIs without context"]
- **Data gaps:** [columns/dimensions available in datasets but unused by any card]
```

---

## Tool Mapping

| Step | Tools | Notes |
|------|-------|-------|
| Pull page cards | `page_cards` | Get card IDs from target page |
| Get card definitions | `card_bulk_definitions` | Bulk fetch — more efficient than individual calls |
| Get card metadata | `card_metadata` | Title, type, dataset ID |
| Profile datasets | `dataset_schema`, `dataset_profile` | Understand what data is available vs. used |
| Query data samples | `dataset_query` | Spot-check values if aggregation correctness is in question |

## MCP Servers Required

- **domo-pages** — for page cards, card definitions, card metadata
- **domo-datasets** — for dataset profiling

---

## Guardrails

- **Do not delete cards during the audit.** This skill evaluates and recommends — it does not take action. Deletion happens in the dashboard-builder orchestration after user approval.
- **Be specific in recommendations.** Don't say "improve this card." Say "Replace this single-value card with a KPI card that includes vs. prior month comparison and a 12-month sparkline."
- **Check the data before blaming the card.** A card showing "No data" might be a dataset issue, not a card issue. Note which it is.
- **Credit what works.** If a card is well-designed, say so. Not everything needs to be rebuilt.
- **Infer business questions generously.** Even a poorly-designed card was built for a reason. Try to identify the intent so the redesign addresses the same need.

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: audit score summary, cards assessed (keep/rebuild/delete counts), top findings, recommended redesign priority.

## Related Skills

- **Dashboard Builder** (Build) — the orchestration that uses this audit report to redesign dashboards (parent orchestrator)
- **Card Builder** (Build) — creates replacement cards for REBUILD items (includes chart type selection and beast mode writing)
- **Card Spec Designer** (Build) — designs specs for replacement cards
