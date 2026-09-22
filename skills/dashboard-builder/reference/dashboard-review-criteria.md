# Dashboard Review Criteria — Visual Layout Evaluation

Shared reference for **dashboard-builder** (Step 7.7: Layout Visual Check). Defines the 8-dimension scoring framework used to evaluate dashboard screenshots in the PDCA loop.

This was previously a standalone skill (`dashboard-reviewer`). It is now a reference document because it is only invoked programmatically by dashboard-builder — never triggered directly by users.

---

## Evaluation Dimensions

Score each dimension as: **PASS**, **MINOR_ISSUE**, or **MAJOR_ISSUE**.

### 1. Card Visibility

- All expected cards from the blueprint are visible in the screenshot
- No cards cut off at edges or hidden behind other elements
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

- Eye naturally flows: KPIs (status) → analysis (trends/breakdowns) → detail (tables)
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
- Horizontal bar charts are tall enough for y-axis labels
- Scatter plots with color legends have enough width for the legend
- Charts with many data points aren't too compressed to interpret

| Score | Criteria |
|-------|----------|
| PASS | Each card type has appropriate dimensions for its content |
| MINOR_ISSUE | One chart slightly small but still interpretable |
| MAJOR_ISSUE | Table columns truncated, bar chart labels unreadable, or legend cut off |

---

## Scoring & Decision

- **All PASS** → Overall: **PASS** — layout is ready
- **Any MINOR_ISSUE, no MAJOR_ISSUE** → Overall: **PASS with notes** — proceed, log minor issues
- **Any MAJOR_ISSUE** → Overall: **NEEDS_CORRECTION** — generate layout corrections

---

## Content-Type Sizing Guidelines (60-unit grid)

| Card Type | Min Width | Min Height | Notes |
|-----------|-----------|------------|-------|
| KPI / Summary Number | 10 | 8 | All KPIs in one row, equal width |
| Horizontal Bar Chart | 30+ (full width ideal) | 20-24 | Y-axis labels need height; full-width best |
| Vertical Bar / Stacked Bar | 12 | 18 | Narrower OK since x-axis labels are shorter |
| Scatter Plot | 16 | 18 | Needs width for color legend |
| Line / Area Chart | 15 | 18 | Standard chart sizing |
| Data Table | 20+ | 18-20 | Columns need width; wider = more columns visible |
| Pie / Donut | 12 | 15 | Square-ish aspect ratio |
| Header | 60 (full) | **5** | **height < 5 causes garbled/strikethrough text rendering** |

---

## Common MAJOR_ISSUE Patterns & Fixes

| Pattern | Symptom | Fix |
|---------|---------|-----|
| All cards same size | KPIs as big as charts, wasted space | Set KPI height=8, chart height=18-24 |
| Cards stacked vertically | Single-column layout, excessive scrolling | Spread cards across grid width (60 units) |
| KPIs not in top row | Summary numbers buried below analysis | Move KPI cards to y=0 |
| Overlapping cards | Cards drawn on top of each other | Recalculate y-positions to stack rows sequentially |
| Unequal KPI widths | First KPI wider than others | Set all KPI cards to equal width (60/N) |
| Placeholder header | "Example Header" or generic text | Rename to match the dashboard's actual purpose |
| Orphan/empty content items | Grey boxes or blank areas | Now auto-hidden by `layout_set` — check response warnings for orphan count. If still visible, verify all intended cards are in the `positions` array. |
| Table card too narrow | Columns truncated | Tables need ≥20w |
| Horizontal bar compressed | Y-axis labels unreadable | Increase height to ≥24 units |
| KPI row split across 2 rows | Inconsistent sizing | Consolidate ALL KPIs into single row, equal width (60/N), height=8 |
| Header text garbled | Strikethrough or overlapping text | Header height must be ≥5 |

---

## Multi-Iteration Evaluation Strategy

### Iteration 1 (Structural)
1. Are all KPIs in one row with equal sizing?
2. Is the visual hierarchy correct (KPIs → analysis → detail)?
3. Are there orphan/empty elements visible?
4. Are cards sized appropriately for their content type?

### Iteration 2 (Polish)
1. Are chart legends readable? Do scatter plots have enough width?
2. Are table columns visible? Does the table need more width?
3. Is the header text meaningful?
4. Are horizontal bar charts tall enough for y-axis labels?
5. Is there wasted whitespace that could be redistributed?
