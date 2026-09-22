---
name: dashboard-reviewer
tier: 1
description: "Visual evaluation of a dashboard screenshot. Scores 8 dimensions: card visibility, layout balance, card sizing, spacing, readability, visual hierarchy, content cleanliness, and content-type fit. Returns PASS/MINOR_ISSUE/MAJOR_ISSUE per dimension with specific layout_set corrections. Includes content-type sizing guidelines (tables need ≥20w, scatter plots ≥16w, horizontal bars ≥24h) and orphan detection. Used as the 'Check' step in the screenshot PDCA loop."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by dashboard-v2-build (T2) Success criteria checklist, which encodes the visual quality gates as pass/fail checkboxes."
audience: [delivery]
---

# Dashboard Reviewer — Visual Layout Evaluation

Evaluates a dashboard screenshot against structured design criteria across 8 dimensions. Returns a per-dimension scorecard that drives the PDCA feedback loop: if any dimension scores MAJOR_ISSUE, the reviewer recommends specific `layout_set` corrections, the layout is updated, and a new screenshot is taken for re-evaluation. Iteration 1 focuses on structural issues (KPI sizing, hierarchy, orphans). Iteration 2 focuses on polish (chart readability, table widths, header text). Max 2 iterations.

## Triggers

This skill is invoked automatically by the `layout-visual-check` step in the dashboard-builder symphony. It is not typically triggered directly by the user.

- "review this dashboard screenshot"
- "check the dashboard layout"
- "does this layout look right?"

---

## Inputs

1. **Dashboard screenshot** — an image (MCP image block from `qa_domo_page_screenshot`)
2. **Expected cards** — list of card titles from the blueprint (so we know what should be visible)
3. **Blueprint layout** — the intended grid positions from the dashboard-architect (Row 1 = KPIs, Row 2 = analysis, etc.)
4. **Output type** — `v2_page` or `app_studio` (this skill only applies to Layout API-backed output types)

---

## Evaluation Dimensions

Score each dimension as: **PASS**, **MINOR_ISSUE**, or **MAJOR_ISSUE**.

### 1. Card Visibility

- All expected cards from the blueprint are visible in the screenshot
- No cards are cut off at the edges or hidden behind other elements
- No blank/empty card placeholders where data should appear

| Score | Criteria |
|-------|----------|
| PASS | All expected cards visible with rendered content |
| MINOR_ISSUE | 1 card partially cut off or showing loading state |
| MAJOR_ISSUE | 1+ cards completely missing or showing error state |

### 2. Layout Balance

- KPI summary row at the top, evenly spaced across the full width
- Analysis cards in a logical grid below KPIs
- No excessive whitespace (gaps > 1 card width between elements)
- No cards pushed to one side with empty space on the other

| Score | Criteria |
|-------|----------|
| PASS | Balanced grid, KPIs top row, logical flow top-to-bottom |
| MINOR_ISSUE | Slight imbalance — one row has uneven spacing but still readable |
| MAJOR_ISSUE | Cards clustered on one side, large empty gaps, or KPIs not in top row |

### 3. Card Sizing

- KPI cards are equal width across the row
- Chart cards are large enough to read axis labels and data points
- Table/detail cards use full width or near-full width
- No cards so small that content is illegible

| Score | Criteria |
|-------|----------|
| PASS | All cards appropriately sized for their content type |
| MINOR_ISSUE | 1 card slightly too small but still readable |
| MAJOR_ISSUE | Cards too small to read, or KPI cards unequal width |

### 4. Spacing & Overlap

- Even gutters between cards (consistent gap size)
- No overlapping cards
- No cards touching/abutting without gutters

| Score | Criteria |
|-------|----------|
| PASS | Even gutters, no overlap |
| MINOR_ISSUE | Slightly uneven gutters but no overlap |
| MAJOR_ISSUE | Cards overlapping or zero-gap abutting |

### 5. Readability

- Card titles are visible and legible
- Chart axis labels are readable
- Data values (especially KPI numbers) are prominent
- Color contrast is sufficient

| Score | Criteria |
|-------|----------|
| PASS | All text elements legible at normal zoom |
| MINOR_ISSUE | Some axis labels small but decipherable |
| MAJOR_ISSUE | Titles or KPI values not readable |

### 6. Visual Hierarchy

- Eye naturally flows: KPIs (status) -> analysis (trends/breakdowns) -> detail (tables)
- Most important information is most prominent
- Secondary information doesn't compete with primary metrics

| Score | Criteria |
|-------|----------|
| PASS | Clear top-down flow matching information priority |
| MINOR_ISSUE | Flow mostly correct but one card placement feels out of order |
| MAJOR_ISSUE | Detail tables above KPIs, or primary analysis buried below secondary |

### 7. Content Cleanliness

- No placeholder or generic text ("Example Header", "Card Title", "Untitled")
- No orphan elements rendering as grey boxes or blank areas
- No deleted/empty card placeholders visible on the page
- Header text matches the dashboard's actual domain/purpose

| Score | Criteria |
|-------|----------|
| PASS | All text is meaningful, no orphan elements visible |
| MINOR_ISSUE | Header text is generic but not obviously placeholder |
| MAJOR_ISSUE | Visible grey boxes, "Example Header" placeholder, or empty card areas |

### 8. Content-Type Fit

- Table cards are wide enough to show key columns without truncation
- Horizontal bar charts are tall enough for y-axis labels (player names, category names)
- Scatter plots with color legends have enough width for the legend
- Charts with many data points aren't too compressed to interpret

| Score | Criteria |
|-------|----------|
| PASS | Each card type has appropriate dimensions for its content |
| MINOR_ISSUE | One chart slightly small but still interpretable |
| MAJOR_ISSUE | Table columns truncated, bar chart labels unreadable, or legend cut off |

---

## Scoring & Decision

After evaluating all 8 dimensions:

- **All PASS** -> Overall: **PASS** — layout is ready, proceed to next symphony step
- **Any MINOR_ISSUE, no MAJOR_ISSUE** -> Overall: **PASS with notes** — proceed but log the minor issues
- **Any MAJOR_ISSUE** -> Overall: **NEEDS_CORRECTION** — generate layout corrections

---

## Correction Output

When any dimension scores MAJOR_ISSUE, produce specific corrections:

```markdown
## Layout Corrections Required

### Issues Found
1. [Dimension]: [MAJOR_ISSUE description]
2. [Dimension]: [MAJOR_ISSUE description]

### Recommended layout_set Adjustments

Call `layout_set` with these updated positions:

| Card Title | Card ID | Current Position | Corrected Position | Change |
|-----------|---------|-----------------|-------------------|--------|
| [Title] | [ID] | x=0 y=0 w=10 h=15 | x=0 y=0 w=15 h=15 | Widened KPI to equal width |
| [Title] | [ID] | x=40 y=45 w=20 h=30 | x=0 y=15 w=30 h=30 | Moved analysis card to Row 2 |

### Iteration
- This is correction iteration [1/2]
- After applying corrections, re-screenshot and re-evaluate
- Maximum 2 correction iterations before proceeding with best-effort layout
```

---

## Integration with Dashboard Builder

This skill is used in the `layout-visual-check` step of the dashboard-builder symphony:

1. Symphony calls `qa_domo_page_screenshot` to capture the current layout
2. This skill evaluates the screenshot against the blueprint
3. If MAJOR_ISSUE: symphony calls `layout_set` with corrections, re-screenshots, re-evaluates (max 2 iterations)
4. If PASS: symphony proceeds to the setup-guide / assembly-guide step

---

## Tool Dependencies

| Tool | MCP Server | Purpose |
|------|-----------|---------|
| `qa_domo_page_screenshot` | mcp-qa-testing | Capture dashboard screenshot |
| `layout_set` | domo-pages | Apply corrected positions |

---

## Common MAJOR_ISSUE Patterns & Fixes

| Pattern | Symptom | Fix |
|---------|---------|-----|
| All cards same size | KPIs as big as charts, wasted space | Set KPI height=8, chart height=18-24 |
| Cards stacked vertically | Single-column layout, excessive scrolling | Spread cards across grid width (60 units) |
| KPIs not in top row | Summary numbers buried below analysis | Move KPI cards to y=0 (or just below header) |
| Overlapping cards | Cards drawn on top of each other | Recalculate y-positions to stack rows sequentially |
| Unequal KPI widths | First KPI wider than others | Set all KPI cards to equal width (60/N) |
| Placeholder header | Header says "Example Header" or generic text | Rename to match the dashboard's actual purpose |
| Orphan/empty content items | Grey boxes or blank areas rendering on page | Set orphan contentKeys to x=0 y=0 w=0 h=0 to hide |
| Table card too narrow | Data table columns truncated, can't read values | Tables need ≥20w (wider than charts). Give tables 1/3 of the row width |
| Horizontal bar chart compressed | Y-axis labels (names, categories) unreadable | Increase height to ≥20 units; for player/item lists, use ≥24 |
| Scatter plot legend overlapping | Color legend categories overlap or are cut off | Increase width to ≥16 units to give legend room |
| KPI row split across 2 rows | Some KPIs oversized, inconsistent with others | Consolidate ALL KPIs into a single row with equal width (60/N), height=8 |
| Header text garbled | Strikethrough or overlapping text in header | **Header height must be ≥5.** height=2 or height=3 causes corrupted rendering |

---

## Content-Type Sizing Guidelines

Different card types have different minimum size requirements on the 60-unit grid:

| Card Type | Min Width | Min Height | Notes |
|-----------|-----------|------------|-------|
| KPI / Summary Number | 10 | 8 | All KPIs in one row, equal width |
| Horizontal Bar Chart | 30+ (full width ideal) | 20-24 | Y-axis labels need height; full-width best |
| Vertical Bar / Stacked Bar | 12 | 18 | Narrower OK since x-axis labels are shorter |
| Scatter Plot | 16 | 18 | Needs width for color legend |
| Line / Area Chart | 15 | 18 | Standard chart sizing |
| Data Table | 20+ | 18-20 | Columns need width; wider = more columns visible |
| Pie / Donut | 12 | 15 | Square-ish aspect ratio |
| Header | 60 (full) | **5** | Full width. **height < 5 causes garbled/strikethrough text rendering.** Must contain meaningful text. |

### Orphan Content Items

Domo layouts may contain orphan content items (deleted cards, placeholder elements) that render as grey boxes. These appear in `standard.template` with contentKeys that have no corresponding card in `content`. **Always check for and hide these** by setting them to `x=0, y=0, width=0, height=0`.

---

## Multi-Iteration Evaluation Strategy

When running the PDCA loop, evaluate in priority order:

### Iteration 1 (Structural)
Focus on the biggest layout problems first:
1. Are all KPIs in one row with equal sizing?
2. Is the visual hierarchy correct (KPIs → analysis → detail)?
3. Are there orphan/empty elements visible?
4. Are cards sized appropriately for their content type?

### Iteration 2 (Polish)
After structural fixes, look for refinement:
1. Are chart legends readable? Do scatter plots have enough width?
2. Are table columns visible? Does the table need more width?
3. Is the header text meaningful (not "Example Header" or placeholder)?
4. Are horizontal bar charts tall enough for y-axis labels?
5. Is there wasted whitespace that could be redistributed?

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: review findings — design science scores, accessibility issues, data accuracy concerns, actionable recommendations.
