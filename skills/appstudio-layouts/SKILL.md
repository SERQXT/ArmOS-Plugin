---
name: appstudio-layouts
tier: 0
description: "Domo App Studio layout grid system — 60-column standard and 12-column compact grids, card positioning, page-breaks, writelock acquisition/release, content array types, and full API payload reference. Trigger with 'layout', 'app studio layout', 'grid system', 'card positioning', 'writelock'."
maturity: alpha
deprecated: true
deprecation_note: "Folded into appstudio-page-build/references/widgets/layouts.md"
audience: [code]
---


# App Studio Layouts

## CLI Quick Start

The `community-domo-cli` handles write lock acquisition and release automatically:

```bash
# Get the current layout
community-domo-cli --output json app-studio layout-get $APP_ID $VIEW_ID > layout.json
LAYOUT_ID=$(python3 -c "import json; print(json.load(open('layout.json'))['layoutId'])")

# Modify layout (see grid system and patterns below)
# ... update layout.json with card positioning ...

# Apply layout — CLI handles writelock acquire/release automatically
community-domo-cli --output json -y app-studio layout-set $APP_ID $VIEW_ID \
  --body-file layout_modified.json

# Verify with dry-run before executing
community-domo-cli --dry-run app-studio layout-set $APP_ID $VIEW_ID --body-file layout_modified.json
```

The CLI executes three steps internally:
1. `PUT /content/v4/pages/layouts/{layoutId}/writelock`
2. `PUT /content/v4/pages/layouts/{layoutId}` with the body
3. `DELETE /content/v4/pages/layouts/{layoutId}/writelock` (always runs, even on failure)

The body **must contain `layoutId`** — the CLI extracts it to build the lock/PUT/unlock URLs.

For composable layout building, see `references/layout_assembler.py` in this skill directory.

For the full CLI workflow (app creation, card operations), see `basic-app-studio`.

---

## Overview

All AppStudio pages share a single layout system controlled by two API calls:

```
PUT /api/content/v4/pages/layouts/{layoutId}/writelock   <- acquire
PUT /api/content/v4/pages/layouts/{layoutId}             <- write
DELETE /api/content/v4/pages/layouts/{layoutId}/writelock <- release
```

The layout body defines a **60-column grid** (standard view) and a **12-column grid**
(compact/mobile view). Every card, header, and page-break element is positioned with
`{ x, y, width, height }` in grid units.

---

## Grid System

| View | Total Width | Unit Meaning |
|---|---|---|
| `STANDARD` | 60 columns | `width: 60` = full-page width |
| `COMPACT` | 12 columns | `width: 12` = full-page width (mobile) |

**Height units** are proportional to width units — the aspect ratio is 1.67 (standard)
and 1.0 (compact). Common heights:

| Height (std) | Visual size | Typical use |
|---|---|---|
| 5 | ~1 line | Header text element |
| 10 | ~2 rows | Thin KPI summary bar, metric strip |
| 25 | ~half card | Medium chart, compact table |
| 30 | standard card | Default card height — KPIs, charts, lists |
| 50-60 | large card | Hero chart, map, full-page table |

**Compact layout** collapses all multi-column layouts to single-column (`width: 12`),
stacking cards vertically at `height: 6` each regardless of standard height.

---

## Layout Body Structure

```json
{
  "layoutId": <number>,
  "pageUrn": "<landingViewId string>",
  "printFriendly": true,
  "background": null,
  "isDynamic": true,
  "hasPageBreaks": false,
  "style": null,
  "content": [ ...content items... ],
  "standard": {
    "aspectRatio": 1.67,
    "width": 60,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "STANDARD",
    "template": [ ...template items... ]
  },
  "compact": {
    "aspectRatio": 1,
    "width": 12,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "COMPACT",
    "template": [ ...template items... ]
  }
}
```

### Content item (CARD)

```json
{
  "type": "CARD",
  "contentKey": 1,
  "cardId": 12345678,
  "cardUrn": "12345678",
  "cardType": "kpi",
  "compactInteractionDefault": true,
  "editInAppViewer": true,
  "acceptFilters": true,
  "acceptDateFilter": true,
  "acceptSegments": true,
  "fitToFrame": false,
  "hasSummary": false,
  "hideBorder": false,
  "hideFooter": true,
  "hideMargins": false,
  "hideSummary": false,
  "hideTimeframe": false,
  "hideTitle": false,
  "hideDescription": true,
  "hideWrench": false,
  "summaryNumberOnly": false,
  "background": null
}
```

### Template item (CARD position)

```json
{
  "type": "CARD",
  "contentKey": 1,
  "x": 0,
  "y": 0,
  "width": 30,
  "height": 30,
  "virtual": false,
  "virtualAppendix": false
}
```

### Page break (visual section divider)

```json
{
  "type": "PAGE_BREAK",
  "contentKey": 87,
  "x": 0,
  "y": <y position of break>,
  "width": 60,
  "height": 0,
  "virtual": false,
  "virtualAppendix": false
}
```

Page breaks in compact template additionally set `"isHidden": true` (or omit it —
both work). Use high contentKey values (80+) to avoid conflicts with card contentKeys.

---

## Layout Patterns (Live Captures)

All patterns below are expressed as standard grid positions `(x, y, w, h)`.
The contentKey is a placeholder — use any unique sequential integer.

### 1 — Full-Width Hero
Single large card spanning the full width.

```
+------------------------------------------------------------+ h=60
|                         CARD 1                             |
+------------------------------------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 60 | 60 |

Compact: `(0, 0, 12, 6)`

**When to use:**
- One visualization tells the complete story — a trend line spanning months, a large geographic map, a network/org chart that needs room to breathe
- Executive summary opener: a single big number, a goal-vs-actual gauge, or a full-page chart before supporting detail below
- Immersive content that loses meaning when squeezed — Sankey diagrams, hierarchical trees, dense scatter plots
- **Avoid** when you have two or more metrics of equal importance — they will compete for the same hero space and neither wins

---

### 2 — Full-Width Stacked (2 cards)

```
+------------------------------------------------------------+ h=30
|                         CARD 1                             |
+------------------------------------------------------------+ h=30
|                         CARD 2                             |
+------------------------------------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 60 | 30 |
| 2 | 0 | 30 | 60 | 30 |

Compact: both `(0, *, 12, 6)` stacked.

**When to use:**
- Two charts that have a clear narrative sequence — a summary trend on top, a supporting detail breakdown below (e.g., revenue trend -> revenue by region)
- Before/after or plan/actual comparisons where both charts need full width to be readable
- Wide tables that must span the full page and cannot be placed side-by-side
- **Avoid** when the two charts are truly independent (no narrative link) — a 2-column or 2x2 grid signals equality better than stacking

---

### 3 — Two-Column Equal Split

```
+-----------------------------+------------------------------+ h=60
|          CARD 1             |           CARD 2             |
|        (w=30)               |          (w=30)              |
+-----------------------------+------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 30 | 60 |
| 2 | 30 | 0 | 30 | 60 |

Compact: stacked `(0, 0, 12, 6)`, `(0, 6, 12, 6)`.

**When to use:**
- Two charts of exactly equal priority that the viewer should compare side-by-side — current period vs prior period, budget vs actual, two product lines
- Tall chart types that benefit from a half-page column: vertical bar charts with many categories, ranked lists, funnel charts
- Split-audience pages where the left half serves one team and the right half another
- **Avoid** for KPI numbers — two large numbers side-by-side waste vertical space; a horizontal KPI strip (pattern 5 or 6) is more efficient

---

### 4 — 2x2 Grid

```
+-----------------------------+------------------------------+ h=30
|          CARD 1             |           CARD 2             |
+-----------------------------+------------------------------+ h=30
|          CARD 3             |           CARD 4             |
+-----------------------------+------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 30 | 30 |
| 2 | 30 | 0 | 30 | 30 |
| 3 | 0 | 30 | 30 | 30 |
| 4 | 30 | 30 | 30 | 30 |

Compact: 4 stacked `(0, *, 12, 6)`.

**When to use:**
- Four KPIs or charts of equal weight with no single dominant metric — balanced scorecards, four-quadrant performance reviews
- Mixed chart types that are all the same size class: four bar charts, four donut charts, four summary tables
- Department-level snapshots where each quadrant owns a business function (Sales / Marketing / Support / Finance)
- **Avoid** when one of the four items deserves more emphasis — use pattern 13 or 14 instead; also avoid for 4 wide tables, which need full width

---

### 5 — Three-Column Equal Split

```
+---------------+---------------+---------------+ h=30
|    CARD 1     |    CARD 2     |    CARD 3     |
|    (w=20)     |    (w=20)     |    (w=20)     |
+---------------+---------------+---------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 20 | 30 |
| 2 | 20 | 0 | 20 | 30 |
| 3 | 40 | 0 | 20 | 30 |

Compact: 3 stacked `(0, *, 12, 6)`.

**When to use:**
- A KPI summary strip of exactly three equal metrics — three revenue pillars, three SLA gauges, three conversion-funnel stages
- Three charts that encode the same data type (three bar charts comparing regions, three donut charts by product)
- Top-of-page metric banner before a deeper-analysis section below (combine with pattern 20 for the full page)
- **Avoid** for complex charts needing width — at w=20 the column is roughly one-third of the page, which is too narrow for multi-series line charts or tables with many columns

---

### 6 — 3x2 Grid

```
+---------------+---------------+---------------+ h=30
|    CARD 1     |    CARD 2     |    CARD 3     |
+---------------+---------------+---------------+ h=30
|    CARD 4     |    CARD 5     |    CARD 6     |
+---------------+---------------+---------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 20 | 30 |
| 2 | 20 | 0 | 20 | 30 |
| 3 | 40 | 0 | 20 | 30 |
| 4 | 0 | 30 | 20 | 30 |
| 5 | 20 | 30 | 20 | 30 |
| 6 | 40 | 30 | 20 | 30 |

Compact: 6 stacked `(0, *, 12, 6)`.

**When to use:**
- Six KPIs or small charts of truly equal priority — operational monitoring dashboards, support-queue metrics, marketing channel breakdown
- Category-vs-metric grids where each cell covers one combination (3 regions x 2 time periods)
- Compact scorecards for executives who scan six numbers in under 5 seconds
- **Avoid** when any one of the six metrics is more important than the others — the grid implies equality and buries the lead; also avoid for charts that need width to be readable

---

### 7 — Header + Large Chart

> **The thin top row (`h=10`) is a `type:"HEADER"` layout element — not a card.**
> Place a Header component there (see `appstudio-header`), not a card.

```
+------------------------------------------------------------+ h=10
|                  HEADER (section title)                    |
+------------------------------------------------------------+ h=50
|                     MAIN CHART (card)                      |
+------------------------------------------------------------+
```

| element | type | contentKey | x | y | w | h |
|---|---|---|---|---|---|---|
| Section title | HEADER | 1 | 0 | 0 | 60 | 10 |
| Main chart | CARD | 2 | 0 | 10 | 60 | 50 |

Header in `content`: `{ "type": "HEADER", "contentKey": 1, "text": "Sales Overview", ... }`
Card in `content`: standard card content item with `cardId`.

Compact: Header `(0, 0, 12, 2)`, Card `(0, 2, 12, 6)`.

**When to use:**
- A labelled section that contains a single dominant chart — ideal as the first section of a multi-section page where the header orients the viewer
- Complex visualizations that need almost full-page height: heat maps, timeline charts, large pivot tables, geographic maps with detail
- Reports where every section needs a clear title for print/export readability
- **Avoid** on standalone single-section pages with an obvious page title — the header is redundant overhead; use pattern 1 instead

---

### 8 — Header + Two Full-Width Cards

> **The thin top row (`h=10`) is a `type:"HEADER"` layout element — not a card.**

```
+------------------------------------------------------------+ h=10
|                  HEADER (section title)                    |
+------------------------------------------------------------+ h=25
|                     CARD 2                                 |
+------------------------------------------------------------+ h=25
|                     CARD 3                                 |
+------------------------------------------------------------+
```

| element | type | contentKey | x | y | w | h |
|---|---|---|---|---|---|---|
| Section title | HEADER | 1 | 0 | 0 | 60 | 10 |
| Card 2 | CARD | 2 | 0 | 10 | 60 | 25 |
| Card 3 | CARD | 3 | 0 | 35 | 60 | 25 |

**When to use:**
- A labelled section with two sequential full-width charts — a summary metric row followed by a wide detail chart, or two complementary trend lines
- Financial reporting sections: a P&L summary table (full width) followed by a variance chart (full width), both under a "Revenue" header
- Drill-down layouts where card 2 is the overview and card 3 is the breakdown, both needing full page width
- **Avoid** when the two cards under the header have equal priority and similar width needs — pattern 3 side-by-side reads faster for comparisons

---

### 9 — Two-Column Top + Full-Width Bottom

```
+-----------------------------+------------------------------+ h=30
|          CARD 1             |           CARD 2             |
+-----------------------------+------------------------------+ h=30
|                         CARD 3                             |
+------------------------------------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 30 | 30 |
| 2 | 30 | 0 | 30 | 30 |
| 3 | 0 | 30 | 60 | 30 |

Compact: 3 stacked `(0, *, 12, 6)`.

**When to use:**
- Two supporting KPIs or smaller charts at the top that together set context for a wide detail chart below — e.g., Total Revenue + Total Units at top, Revenue by Product Over Time below
- Pipeline dashboards: Opportunities Won + Opportunities Lost at top, full-width pipeline funnel or activity table below
- **Avoid** when the bottom card is just as compact as the top two — use a 2x2 grid (pattern 4) if all three or four items are the same size class

---

### 10 — Full-Width Top + Two-Column Bottom

```
+------------------------------------------------------------+ h=30
|                         CARD 1                             |
+-----------------------------+------------------------------+ h=30
|          CARD 2             |           CARD 3             |
+-----------------------------+------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 60 | 30 |
| 2 | 0 | 30 | 30 | 30 |
| 3 | 30 | 30 | 30 | 30 |

Compact: 3 stacked `(0, *, 12, 6)`.

**When to use:**
- One primary summary chart on top (the answer) followed by two supporting breakdowns below (the why) — classic executive summary structure
- Trend line at top showing total performance, two bar charts below showing contributing dimensions (by region, by product)
- When the top card is a wide table or timeline that cannot be split, and the bottom two charts are natural companions
- **Avoid** when the top card is just another KPI tile — a wide empty tile at the top wastes prime viewport space; reserve this for genuinely wide content

---

### 11 — 4x2 Grid

```
+----------+----------+----------+----------+ h=30
|  CARD 1  |  CARD 2  |  CARD 3  |  CARD 4  |
+----------+----------+----------+----------+ h=30
|  CARD 5  |  CARD 6  |  CARD 7  |  CARD 8  |
+----------+----------+----------+----------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 15 | 30 |
| 2 | 15 | 0 | 15 | 30 |
| 3 | 30 | 0 | 15 | 30 |
| 4 | 45 | 0 | 15 | 30 |
| 5 | 0 | 30 | 15 | 30 |
| 6 | 15 | 30 | 15 | 30 |
| 7 | 30 | 30 | 15 | 30 |
| 8 | 45 | 30 | 15 | 30 |

Compact: 8 stacked `(0, *, 12, 6)`.

**When to use:**
- Eight KPI summary tiles of equal importance — operational monitoring with many signals, SLA dashboards, support-center metrics (CSAT, AHT, FCR, SLA, Volume, Escalations, Backlog, Sentiment)
- Dense scorecards where the audience is trained to scan a grid quickly and each cell is a single number with a spark line
- Multi-entity comparison where each cell is one entity (8 sales reps, 8 products, 8 stores)
- **Avoid** for charts with axis labels, legends, or multiple series — at w=15 they become illegible; also avoid if any one metric deserves more emphasis than the other seven

---

### 12 — Header + 3x2 Grid

> **The thin top row (`h=10`) is a `type:"HEADER"` layout element — not a card.**

```
+------------------------------------------------------------+ h=10
|                  HEADER (section title)                    |
+-------------------+-------------------+--------------------+ h=25
|      CARD 2       |      CARD 3       |      CARD 4        |
+-------------------+-------------------+--------------------+ h=25
|      CARD 5       |      CARD 6       |      CARD 7        |
+-------------------+-------------------+--------------------+
```

| element | type | contentKey | x | y | w | h |
|---|---|---|---|---|---|---|
| Section title | HEADER | 1 | 0 | 0 | 60 | 10 |
| Card 2 | CARD | 2 | 0 | 10 | 20 | 25 |
| Card 3 | CARD | 3 | 20 | 10 | 20 | 25 |
| Card 4 | CARD | 4 | 40 | 10 | 20 | 25 |
| Card 5 | CARD | 5 | 0 | 35 | 20 | 25 |
| Card 6 | CARD | 6 | 20 | 35 | 20 | 25 |
| Card 7 | CARD | 7 | 40 | 35 | 20 | 25 |

Compact: Header `(0, 0, 12, 2)`, 6 cards stacked `(0, *, 12, 6)`.

**When to use:**
- A labelled section with six equal metrics — the header gives the section semantic meaning in a multi-section page (e.g., "Customer Health" above 6 support KPIs)
- Department scorecards that belong to a named section within a larger executive dashboard
- When the same 3x2 grid is repeated for multiple sections (one per business unit, each with its own header)
- **Avoid** on a single-section page where the header adds no navigation value — use pattern 6 directly; also avoid when the six metrics span wildly different scales or chart types

---

### 13 — Large Left + 2 Stacked Right (40:20)

```
+--------------------------------------+--------------+
|                                      |   CARD 2    | h=30
|           CARD 1  (w=40)             +--------------+
|                                      |   CARD 3    | h=30
+--------------------------------------+--------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 40 | 60 |
| 2 | 40 | 0 | 20 | 30 |
| 3 | 40 | 30 | 20 | 30 |

Compact: 3 stacked `(0, *, 12, 6)`.

**When to use:**
- One dominant analysis chart on the left (scatter plot, multi-series line, large bar) with two supporting KPIs or context metrics on the right
- Map-plus-context layouts: a geographic map occupying 2/3 of the page with a ranked list and a total KPI in the right sidebar
- Sales pipeline: the main funnel or stage-progression chart on the left, with Win Rate and Average Deal Size on the right
- **Avoid** when the right-side cards are the primary message — the layout trains the eye to the left first; if the two right cards are the heroes, flip to pattern 23 instead

---

### 14 — Equal Left + 2 Stacked Right (30:30)

```
+-----------------------------+----------------------+
|                             |       CARD 2        | h=30
|          CARD 1  (w=30)     +----------------------+
|                             |       CARD 3        | h=30
+-----------------------------+----------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 30 | 60 |
| 2 | 30 | 0 | 30 | 30 |
| 3 | 30 | 30 | 30 | 30 |

Compact: 3 stacked `(0, *, 12, 6)`.

**When to use:**
- Left card is a tall chart (vertical bar, ranked list, waterfall) and the right two cards are medium-height companions — all three carry weight but the left chart is taller by nature
- Financial dashboards: a monthly P&L waterfall on the left, with YTD Total and Budget Variance stacked on the right
- When the left chart and right two charts are all important but the left chart needs more vertical height than either right card individually
- **Avoid** when the right cards are small KPI tiles that don't need half the page width — use pattern 13 (40:20) to give the main chart more room

---

### 15 — Header + Asymmetric 2-Col (40:20)

> Thin top row is `type:"HEADER"`.

```
+----------------------------------------------------+ h=10
|                      HEADER                        |
+----------------------------------+-----------------+ h=50
|         CARD 2  (w=40)           |  CARD 3 (w=20)  |
+----------------------------------+-----------------+
```

| element | type | contentKey | x | y | w | h |
|---|---|---|---|---|---|---|
| Section title | HEADER | 1 | 0 | 0 | 60 | 10 |
| Wide card | CARD | 2 | 0 | 10 | 40 | 50 |
| Narrow card | CARD | 3 | 40 | 10 | 20 | 50 |

Compact: Header `(0,0,12,2)`, 2 cards stacked `(0,*,12,6)`.

**When to use:**
- Labelled section with a primary analysis chart (wide) and a context/detail card (narrow) — e.g., "Revenue Trends" header, trend chart on the left, commentary or metric card on the right
- Operational sections where the main chart drives decisions and the narrow card provides a single supporting KPI or small ranked list
- Multi-section pages where each section follows this pattern consistently — creates visual rhythm and clear hierarchy
- **Avoid** when both cards need equal width — use pattern 3 or a header above pattern 3; also avoid when the narrow card holds a chart with an x-axis label that needs breathing room

---

### 16 — Header + Large Left + 2 Stacked Right

> Thin top row is `type:"HEADER"`.

```
+----------------------------------------------------+ h=10
|                      HEADER                        |
+----------------------------------+-----------------+
|                                  |    CARD 3      | h=25
|         CARD 2  (w=40)           +-----------------+
|                                  |    CARD 4      | h=25
+----------------------------------+-----------------+
```

| element | type | contentKey | x | y | w | h |
|---|---|---|---|---|---|---|
| Section title | HEADER | 1 | 0 | 0 | 60 | 10 |
| Large card | CARD | 2 | 0 | 10 | 40 | 50 |
| Top-right | CARD | 3 | 40 | 10 | 20 | 25 |
| Bottom-right | CARD | 4 | 40 | 35 | 20 | 25 |

Compact: Header `(0,0,12,2)`, 3 cards stacked `(0,*,12,6)`.

**When to use:**
- The richest single-section layout: a labelled section with a dominant chart and two companion KPIs — ideal for any analytical section that needs a title, a primary visualization, and two supporting numbers
- Executive briefing sections: "Pipeline Health" header, stage funnel (large left), Win Rate + Average Days to Close (stacked right)
- Product analytics: "Engagement" header, DAU trend chart (large left), 7-day Retention + Session Length (stacked right)
- **Avoid** when all four elements (header + 3 cards) carry the same weight — the layout's visual hierarchy will mislead the viewer; use pattern 12 for equal-weight grid sections

---

### 17 — 2-Col Top + 3-Col Bottom

```
+-----------------------------+----------------------+ h=25
|          CARD 1             |        CARD 2        |
+---------------+--------------+-------------------+ h=35
|    CARD 3     |     CARD 4     |      CARD 5       |
+---------------+----------------+-------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 30 | 25 |
| 2 | 30 | 0 | 30 | 25 |
| 3 | 0 | 25 | 20 | 35 |
| 4 | 20 | 25 | 20 | 35 |
| 5 | 40 | 25 | 20 | 35 |

Compact: 5 stacked `(0, *, 12, 6)`.

**When to use:**
- A transitional layout where two summary charts at the top feed three drill-down charts below — the top row sets the "what", the bottom row shows the "where/who/why"
- Marketing dashboards: Total Spend + Total Conversions at top, breakdown by Channel / Campaign / Creative below
- Financial reporting: Gross Revenue + Net Margin at top, Revenue by Region / Product / Sales Rep below
- **Avoid** when all five charts are the same size class and importance — a 3x2 or separate sections are cleaner; also avoid when the top two cards need to be taller than the bottom three

---

### 18 — Sidebar Left + 2x2 Right

```
+--------+----------------------+----------------------+
|        |       CARD 2        |       CARD 3        | h=30
| CARD 1 +----------------------+----------------------+
| (w=20) |       CARD 4        |       CARD 5        | h=30
+--------+----------------------+----------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 20 | 60 |
| 2 | 20 | 0 | 20 | 30 |
| 3 | 40 | 0 | 20 | 30 |
| 4 | 20 | 30 | 20 | 30 |
| 5 | 40 | 30 | 20 | 30 |

Compact: 5 stacked `(0, *, 12, 6)`.

**When to use:**
- A persistent left panel (navigation, filter summary, entity details, or a tall ranked list) alongside four related metric cards — good for entity-detail pages where the left panel describes the selected record
- Customer 360 layout: the left sidebar holds the customer profile or a demographic breakdown, the right 2x2 holds purchase history, support tickets, NPS, and LTV
- **Avoid** when the left sidebar content is not truly "persistent" or contextual — if it's just another chart of equal weight, it looks awkward crammed into a narrow column; use a 3x2 grid instead

---

### 19 — Narrow Sidebar + Wide Main

```
+----+-------------------------------------------------------+
| C1 |                     CARD 2                        |
|(15)|                                                    |
+----+-------------------------------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 15 | 60 |
| 2 | 15 | 0 | 45 | 60 |

Compact: 2 stacked `(0, *, 12, 6)`.

**When to use:**
- A slim label/legend/index panel on the left with a wide primary chart on the right — when the left card is purely contextual (category list, time period selector label, legend key)
- Large time-series or Gantt-style charts where 3/4 of the page width is the minimum for readability
- When the narrow left card holds a very tall ranked list or a single large KPI number that anchors the page
- **Avoid** when the left card needs to be a full chart — at w=15 it is too narrow for anything with axis labels; use pattern 13 (40:20) or pattern 15 for charts on both sides

---

### 20 — 3-Col Top + Full-Width Large Bottom

```
+---------------+---------------+---------------+ h=20
|    CARD 1     |    CARD 2     |    CARD 3     |
+---------------+---------------+---------------+ h=40
|                    CARD 4                      |
+------------------------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 20 | 20 |
| 2 | 20 | 0 | 20 | 20 |
| 3 | 40 | 0 | 20 | 20 |
| 4 | 0 | 20 | 60 | 40 |

Compact: 4 stacked `(0, *, 12, 6)`.

**When to use:**
- Three headline KPI tiles at the top (short height is intentional — these are numbers, not charts) anchoring a full-width detail chart below
- Executive summary: Total Revenue, Total Units, Avg Deal Size at top; Revenue Trend by Month below
- Operational command center: three alert/status tiles at the top; full-width activity table or map below
- **Avoid** when the top three cards need more height for their chart type — at h=20 they are best suited to single-number KPIs or very compact bar charts; tall charts in h=20 will be clipped

---

### 21 — Full-Width Top + Asymmetric 2-Col Bottom (40:20)

```
+------------------------------------------------+ h=30
|                    CARD 1                      |
+----------------------------------+-------------+ h=30
|         CARD 2  (w=40)           | CARD 3(w=20)|
+----------------------------------+-------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 60 | 30 |
| 2 | 0 | 30 | 40 | 30 |
| 3 | 40 | 30 | 20 | 30 |

Compact: 3 stacked `(0, *, 12, 6)`.

**When to use:**
- A wide summary chart at the top followed by a primary analysis chart (wide) and a context KPI (narrow) below — three-tier hierarchy of decreasing specificity
- Financial dashboards: full-width revenue trend at top, wide cost-breakdown bar chart below-left, Net Margin KPI below-right
- When the full-width top card and the wide bottom-left card are both analysis charts but the narrow bottom-right is a single supporting metric
- **Avoid** when the bottom two cards need equal width — use pattern 10; also avoid when the top card is just a KPI tile that doesn't justify taking the full width

---

### 22 — Header + Left Half + Right 2x2

> Thin top row is `type:"HEADER"`.

```
+------------------------------------------------+ h=10
|                      HEADER                    |
+-----------------+--------------+---------------+
|                 |   CARD 3    |   CARD 4     | h=25
|   CARD 2        +--------------+---------------+
|   (w=30)        |   CARD 5    |   CARD 6     | h=25
+-----------------+--------------+---------------+
```

| element | type | contentKey | x | y | w | h |
|---|---|---|---|---|---|---|
| Section title | HEADER | 1 | 0 | 0 | 60 | 10 |
| Left tall | CARD | 2 | 0 | 10 | 30 | 50 |
| Top-right-left | CARD | 3 | 30 | 10 | 15 | 25 |
| Top-right-right | CARD | 4 | 45 | 10 | 15 | 25 |
| Bot-right-left | CARD | 5 | 30 | 35 | 15 | 25 |
| Bot-right-right | CARD | 6 | 45 | 35 | 15 | 25 |

Compact: Header `(0,0,12,2)`, 5 cards stacked `(0,*,12,6)`.

**When to use:**
- A labelled section with one primary analysis chart (left half) and four supporting KPIs (right 2x2) — the most information-dense single-section pattern
- Customer analytics: "Acquisition" header, conversion funnel on the left, four KPI tiles (CAC, LTV, Churn Rate, NPS) in the right grid
- Supply chain: "Inventory Health" header, inventory aging chart on the left, four status KPIs (In Stock %, Days on Hand, Overstock, Stockout) on the right
- **Avoid** when the four right-side cards need charts rather than KPI tiles — at w=15 they are too narrow for bar charts or trend lines; use pattern 16 (with stacked right charts at w=20) instead

---

### 23 — Left Stacked (3) + Right Tall

```
+----------------------+------------------------------+
|       CARD 1        |                              | h=20
+----------------------+       CARD 4  (w=40)        | h=20
|       CARD 2        |                              |
+----------------------+                              | h=20
|       CARD 3        |                              |
+----------------------+------------------------------+
```

| contentKey | x | y | w | h |
|---|---|---|---|---|
| 1 | 0 | 0 | 20 | 20 |
| 2 | 0 | 20 | 20 | 20 |
| 3 | 0 | 40 | 20 | 20 |
| 4 | 20 | 0 | 40 | 60 |

Compact: 4 stacked `(0, *, 12, 6)`.

**When to use:**
- Three small KPI tiles or compact charts stacked on the left acting as a legend/index for a tall primary chart on the right — the right chart is the hero, the left column provides the keys
- Ranked list on the right (top 10 products, top 10 customers) with three filter-context KPIs on the left (Total, Average, Change %)
- Geographic map on the right (needs tall vertical space) with three regional aggregates stacked on the left
- **Avoid** when the left three cards need more than h=20 each — they will crowd; also avoid when the right chart is not genuinely tall, as the asymmetry will look forced; use pattern 13 when the left card is the dominant one

---

## Pattern Selection Guide

Quick reference for choosing a pattern based on your content.

| Content type | Recommended patterns |
|---|---|
| Single hero chart | 1 |
| KPI summary strip (3 metrics) | 5 |
| KPI summary strip (3 metrics + detail chart below) | 20 |
| Equal-priority KPIs — 2 | 3 |
| Equal-priority KPIs — 4 | 4 |
| Equal-priority KPIs — 6 | 6 |
| Equal-priority KPIs — 8 | 11 |
| Mixed KPI + chart (KPIs above, chart below) | 9, 20 |
| Mixed KPI + chart (chart above, KPIs below) | 10 |
| Executive summary (one number + big chart) | 1, 7 |
| Executive summary (trend + two breakdowns) | 10, 17 |
| Sales pipeline | 13, 16 |
| Financial report | 14, 21, 8 |
| Operational monitoring (many signals) | 6, 11, 12 |
| Drill-down detail (overview -> breakdown) | 8, 10, 17 |
| Wide primary chart + context sidebar | 13, 15, 19 |
| Section with label (header + content) | 7, 12, 15, 16, 22 |
| Dense multi-metric (5+ metrics + chart) | 16, 22 |

---

## Combining Patterns (Multi-Section Pages)

Separate sections with PAGE_BREAK elements. Stack them by offsetting `y` values.

### Example: Header + 2-col + 2x2 grid

```json
// Section 1: HEADER (h=10) -> y ends at 10
// In content[]: { "type": "HEADER", "contentKey": 1, "text": "Section Title", ... }
// In template[]: { "type": "HEADER", "contentKey": 1, "x": 0, "y": 0, "width": 60, "height": 10, ... }
{ "contentKey": 1, "x": 0, "y": 0, "width": 60, "height": 10 }

// PAGE_BREAK at y=10
{ "type": "PAGE_BREAK", "contentKey": 90, "x": 0, "y": 10, "width": 60, "height": 0 }

// Section 2: 2-col (h=30) -> y starts at 10, ends at 40
{ "contentKey": 2, "x": 0,  "y": 10, "width": 30, "height": 30 }
{ "contentKey": 3, "x": 30, "y": 10, "width": 30, "height": 30 }

// PAGE_BREAK at y=40
{ "type": "PAGE_BREAK", "contentKey": 91, "x": 0, "y": 40, "width": 60, "height": 0 }

// Section 3: 2x2 grid -> y starts at 40
{ "contentKey": 4, "x": 0,  "y": 40, "width": 30, "height": 30 }
{ "contentKey": 5, "x": 30, "y": 40, "width": 30, "height": 30 }
{ "contentKey": 6, "x": 0,  "y": 70, "width": 30, "height": 30 }
{ "contentKey": 7, "x": 30, "y": 70, "width": 30, "height": 30 }
```

### Rules for stacking sections

1. **Track the current Y cursor.** Start at 0. Add the height of each row to advance.
2. **All cards in the same row share the same `y` value.** Only cards in different rows
   have different `y` values.
3. **PAGE_BREAK `y` = the y value where the next section begins.** It has `height: 0`
   so it doesn't consume vertical space.
4. **Compact template stacks everything.** Multi-column layouts in standard collapse to
   single-column in compact — each card gets `(0, cursor, 12, 6)` advancing by 6 each time.
5. **PAGE_BREAKs in compact** mirror the same `contentKey` as standard but with
   `"isHidden": true` (or omitted). They act as invisible separators.

---

## Column Width Reference

| Columns | Width per col | contentKey x values |
|---|---|---|
| 1 (full) | 60 | `x: 0` |
| 2 (half) | 30 | `x: 0, 30` |
| 3 (third) | 20 | `x: 0, 20, 40` |
| 4 (quarter) | 15 | `x: 0, 15, 30, 45` |

Mix freely — a 2:1 split is `w=40` + `w=20`, a sidebar layout is `w=15` + `w=45`, etc.

---

## Asymmetric Layouts

Any `width` that sums to 60 is valid. Common asymmetric splits:

| Left | Right | Use case |
|---|---|---|
| 40 | 20 | Wide main + narrow detail |
| 45 | 15 | Wide main + slim sidebar |
| 20 | 40 | Narrow nav/label + wide chart |

Example — wide chart + sidebar:
```json
{ "contentKey": 1, "x": 0,  "y": 0, "width": 40, "height": 40 }
{ "contentKey": 2, "x": 40, "y": 0, "width": 20, "height": 40 }
```

---

## Mixing Content Types

Headers (`type: "HEADER"`) and cards (`type: "CARD"`) can coexist on the same page.
Headers use `height: 5` (standard) and `height: 2` (compact).

Example — header above a 3-col grid:
```json
// Header at y=0, h=5
{ "type": "HEADER", "contentKey": 1, "x": 0, "y": 0, "width": 60, "height": 5 }

// 3-col cards start at y=5
{ "contentKey": 2, "x": 0,  "y": 5, "width": 20, "height": 30 }
{ "contentKey": 3, "x": 20, "y": 5, "width": 20, "height": 30 }
{ "contentKey": 4, "x": 40, "y": 5, "width": 20, "height": 30 }
```

---

## Assigning Cards to a Page

Before setting the layout, assign card IDs to the page with:

```
PUT /api/content/v1/cards/bulk/pages
```

```json
{
  "cardIds": [cardId1, cardId2, ...],
  "destinationPageIds": [<landingViewId as number>]
}
```

All cards that appear in the layout `content` array must be assigned to the page first.

---

## Gotchas

1. **`contentKey` must be unique across the entire layout** (content + all template items).
   PAGE_BREAK contentKeys should be offset high (80+, 90+) to avoid collision with card
   contentKeys.

2. **`y` must be consistent between standard template and content** — the `content` array
   doesn't have positions, only the `template` arrays do. However both standard and compact
   templates must list every contentKey present in `content`.

3. **Compact template must include all contentKeys.** If a card is in `content` but missing
   from the compact template, it will not render on mobile.

4. **PAGE_BREAK does not appear in `content`** — only in `template`. Don't add PAGE_BREAK
   to the `content` array.

5. **Heights are not pixel values.** The grid unit is relative to the page width. `height: 30`
   with `width: 60` at `aspectRatio: 1.67` means each unit is approximately 1/60th of the
   page width squared by the ratio. Use the captured reference heights (10, 25, 30, 50, 60)
   for predictable results.

6. **Cards must be in `bulk/pages` before the layout write.** If a `cardId` in the layout
   hasn't been assigned to the page, the layout PUT will succeed but the card won't render.
