# Layouts Reference

All AppStudio pages share a single layout system controlled via writelock + PUT:

```
PUT /api/content/v4/pages/layouts/{layoutId}/writelock   <- acquire
PUT /api/content/v4/pages/layouts/{layoutId}             <- write
DELETE /api/content/v4/pages/layouts/{layoutId}/writelock <- release
```

The `community-domo-cli` handles writelock automatically: `app-studio layout-set $APP_ID $VIEW_ID --body-file layout.json`.

## Grid system

| View | Total Width | Aspect Ratio |
|---|---|---|
| `STANDARD` | 60 columns | 1.67 |
| `COMPACT` (mobile) | 12 columns | 1.0 |

Common standard heights:

| Height | Visual size | Typical use |
|---|---|---|
| 5 | ~1 line | Header element |
| 10 | ~2 rows | KPI metric strip |
| 15 | small card | Compact KPI row |
| 30 | standard card | Default — KPIs, charts, lists |
| 50–60 | large card | Hero chart, map, full-page list |

Compact layout: all cards collapse to single column (`width: 12`), stacked at `height: 6` each.

## Layout body structure

```json
{
  "layoutId": <number>,
  "pageUrn": "<landingViewId>",
  "printFriendly": true,
  "background": null,
  "isDynamic": true,
  "hasPageBreaks": false,
  "style": null,
  "content": [],
  "standard": {
    "aspectRatio": 1.67, "width": 60, "frameMargin": 4, "framePadding": 8,
    "type": "STANDARD", "template": []
  },
  "compact": {
    "aspectRatio": 1, "width": 12, "frameMargin": 4, "framePadding": 8,
    "type": "COMPACT", "template": []
  }
}
```

## Content item (CARD)

```json
{
  "type": "CARD",
  "contentKey": 1,
  "cardId": 12345678,
  "cardUrn": "12345678",
  "cardType": "kpi",
  "compactInteractionDefault": true,
  "editInAppViewer": false,
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

For rooster (List/Gallery/FilterList/Banner/Details) cards: `"cardType": "rooster"`, `"hideTitle": true`.

## Template item (position)

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

## Page break

```json
{
  "type": "PAGE_BREAK",
  "contentKey": 87,
  "x": 0,
  "y": <y position>,
  "width": 60,
  "height": 0,
  "virtual": false,
  "virtualAppendix": false
}
```

Use high contentKey values (80+) for page breaks to avoid conflicts.

## Common layout patterns

### Full-width hero

```
(x:0, y:0, w:60, h:60)
```

### Two-column equal split

```
CARD1 (x:0,  y:0, w:30, h:60)
CARD2 (x:30, y:0, w:30, h:60)
```

### 2x2 grid

```
CARD1 (x:0,  y:0,  w:30, h:30)    CARD2 (x:30, y:0,  w:30, h:30)
CARD3 (x:0,  y:30, w:30, h:30)    CARD4 (x:30, y:30, w:30, h:30)
```

### Three-column equal (KPI strip)

```
CARD1 (x:0,  y:0, w:20, h:30)
CARD2 (x:20, y:0, w:20, h:30)
CARD3 (x:40, y:0, w:20, h:30)
```

### Header + large chart

```
HEADER (x:0, y:0, w:60, h:5)    <- type:"HEADER" in content, not a card
CARD   (x:0, y:5, w:60, h:55)
```

### KPI strip + full-width list

```
KPI1 (x:0,  y:0, w:20, h:15)
KPI2 (x:20, y:0, w:20, h:15)
KPI3 (x:40, y:0, w:20, h:15)
LIST (x:0, y:15, w:60, h:45)
```

### Split panel (FilterList left + content right)

```
FILTER (x:0,  y:0, w:20, h:55)   <- FilterList, listWidth ~350–380
DETAIL (x:20, y:0, w:40, h:55)   <- Details or chart cards
```

### 30/70 asymmetric split

```
CARD1 (x:0,  y:0, w:18, h:55)   <- narrow sidebar
CARD2 (x:18, y:0, w:42, h:55)   <- dominant main area
```

## Writelock rules

- Always acquire before writing, release after.
- If editing for 30+ seconds, send heartbeat: `PUT .../writelock/heartbeat`.
- Always release even if PUT fails — orphaned locks block other editors.
- The `community-domo-cli layout-set` command handles acquire + PUT + release automatically.

## contentKey rules

- Every content item needs a unique `contentKey` integer.
- The `contentKey` in `content[]` must match the `contentKey` in `template[]`.
- Sequential integers are idiomatic but any unique integers work.
- Tab child elements (TAB_BAR, TAB_CONTENT, nested CARDs) use the same contentKey system but are nested in `children` arrays.

## Key gotchas

- `layoutId` is only in the POST `/api/content/v1/dataapps` response when a rich body is sent (include `owners`, `enabled`, `showNavigation`, etc.). A minimal `{title, type}` body returns `views[0].layout = null`.
- Rooster cards must use `cardType: "rooster"` in content items.
- `editInAppViewer: false` in production — `true` shows Edit buttons to end users.
- Cards that fall outside the grid (x + width > 60) are silently truncated.
- Zero-height elements (`height: 0`) are supported for PAGE_BREAK but not for cards.
- `hasPageBreaks` must be `true` if any `PAGE_BREAK` elements are in the template.

---

## Pattern library (patterns 11–23)

All patterns use standard grid positions `(x, y, width, height)` on the 60-column grid.
`contentKey` values are placeholders — use any unique sequential integer per layout.

---

### Pattern 11 — 4x2 Grid

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

### Pattern 12 — Header + 3x2 Grid

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

### Pattern 13 — Large Left + 2 Stacked Right (40:20)

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

### Pattern 14 — Equal Left + 2 Stacked Right (30:30)

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

### Pattern 15 — Header + Asymmetric 2-Col (40:20)

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

Compact: Header `(0, 0, 12, 2)`, 2 cards stacked `(0, *, 12, 6)`.

**When to use:**
- Labelled section with a primary analysis chart (wide) and a context/detail card (narrow) — e.g., "Revenue Trends" header, trend chart on the left, commentary or metric card on the right
- Operational sections where the main chart drives decisions and the narrow card provides a single supporting KPI or small ranked list
- Multi-section pages where each section follows this pattern consistently — creates visual rhythm and clear hierarchy
- **Avoid** when both cards need equal width — use pattern 3 or a header above pattern 3; also avoid when the narrow card holds a chart with an x-axis label that needs breathing room

---

### Pattern 16 — Header + Large Left + 2 Stacked Right

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

Compact: Header `(0, 0, 12, 2)`, 3 cards stacked `(0, *, 12, 6)`.

**When to use:**
- The richest single-section layout: a labelled section with a dominant chart and two companion KPIs — ideal for any analytical section that needs a title, a primary visualization, and two supporting numbers
- Executive briefing sections: "Pipeline Health" header, stage funnel (large left), Win Rate + Average Days to Close (stacked right)
- Product analytics: "Engagement" header, DAU trend chart (large left), 7-day Retention + Session Length (stacked right)
- **Avoid** when all four elements (header + 3 cards) carry the same weight — the layout's visual hierarchy will mislead the viewer; use pattern 12 for equal-weight grid sections

---

### Pattern 17 — 2-Col Top + 3-Col Bottom

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

### Pattern 18 — Sidebar Left + 2x2 Right

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

### Pattern 19 — Narrow Sidebar + Wide Main

```
+----+-------------------------------------------------------+
| C1 |                     CARD 2                            |
|(15)|                                                       |
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

### Pattern 20 — 3-Col Top + Full-Width Large Bottom

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

### Pattern 21 — Full-Width Top + Asymmetric 2-Col Bottom (40:20)

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

### Pattern 22 — Header + Left Half + Right 2x2

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

Compact: Header `(0, 0, 12, 2)`, 5 cards stacked `(0, *, 12, 6)`.

**When to use:**
- A labelled section with one primary analysis chart (left half) and four supporting KPIs (right 2x2) — the most information-dense single-section pattern
- Customer analytics: "Acquisition" header, conversion funnel on the left, four KPI tiles (CAC, LTV, Churn Rate, NPS) in the right grid
- Supply chain: "Inventory Health" header, inventory aging chart on the left, four status KPIs (In Stock %, Days on Hand, Overstock, Stockout) on the right
- **Avoid** when the four right-side cards need charts rather than KPI tiles — at w=15 they are too narrow for bar charts or trend lines; use pattern 16 (with stacked right charts at w=20) instead

---

### Pattern 23 — Left Stacked (3) + Right Tall

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

## Pattern selection guide

Quick reference for choosing a pattern based on your content signal.

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
| Drill-down detail (overview → breakdown) | 8, 10, 17 |
| Wide primary chart + context sidebar | 13, 15, 19 |
| Section with label (header + content) | 7, 12, 15, 16, 22 |
| Dense multi-metric (5+ metrics + chart) | 16, 22 |

---

## Multi-section stacking (PAGE_BREAK Y-cursor tracking)

Separate sections with `PAGE_BREAK` elements. Stack them by advancing a running Y cursor.

### Y-cursor rules

1. **Track the current Y cursor.** Start at `y = 0`. After placing each row of cards, advance the cursor by that row's height.
2. **All cards in the same row share the same `y` value.** Only cards in different rows have different `y` values.
3. **PAGE_BREAK `y` = the cursor value where the next section begins.** The page break has `height: 0` — it does not consume vertical space.
4. **Set `hasPageBreaks: true`** in the layout body whenever any `PAGE_BREAK` elements are present.
5. **Compact template stacks everything.** Multi-column standard layouts collapse to single-column in compact — each card gets `(0, cursor, 12, 6)` advancing by 6 each time. PAGE_BREAKs in compact use the same `contentKey` as standard but set `"isHidden": true` (or omit it — both work).

### Worked example: Header (h=10) → 2-col section (h=30) → 2x2 grid (h=60)

```json
// --- Section 1: HEADER ---
// cursor starts at 0
// content[]: { "type": "HEADER", "contentKey": 1, "text": "Section Title", ... }
// template[]: { "type": "HEADER", "contentKey": 1, "x": 0, "y": 0, "width": 60, "height": 10 }
// cursor advances to 10

// PAGE_BREAK at y=10 (cursor value before section 2)
{ "type": "PAGE_BREAK", "contentKey": 90, "x": 0, "y": 10, "width": 60, "height": 0 }

// --- Section 2: 2-col (h=30) ---
// cards start at y = cursor = 10
{ "contentKey": 2, "x": 0,  "y": 10, "width": 30, "height": 30 }
{ "contentKey": 3, "x": 30, "y": 10, "width": 30, "height": 30 }
// cursor advances to 10 + 30 = 40

// PAGE_BREAK at y=40
{ "type": "PAGE_BREAK", "contentKey": 91, "x": 0, "y": 40, "width": 60, "height": 0 }

// --- Section 3: 2x2 grid ---
// top row starts at y = cursor = 40
{ "contentKey": 4, "x": 0,  "y": 40, "width": 30, "height": 30 }
{ "contentKey": 5, "x": 30, "y": 40, "width": 30, "height": 30 }
// cursor advances to 40 + 30 = 70

// bottom row starts at y = 70
{ "contentKey": 6, "x": 0,  "y": 70, "width": 30, "height": 30 }
{ "contentKey": 7, "x": 30, "y": 70, "width": 30, "height": 30 }
// final cursor = 70 + 30 = 100
```

### Y-cursor formula for any section

```
section_start_y  = sum of all row heights in preceding sections
section_end_y    = section_start_y + sum of all row heights in this section
PAGE_BREAK y     = section_start_y  (placed before the section's first card)
next_section_y   = section_end_y
```

Multi-row sections: advance cursor once per row. Cards within the same row always share the same `y`.

---

## Column-width reference

| Columns | Width per col | x start positions |
|---|---|---|
| 1 (full) | 60 | `x: 0` |
| 2 (half) | 30 | `x: 0, 30` |
| 3 (third) | 20 | `x: 0, 20, 40` |
| 4 (quarter) | 15 | `x: 0, 15, 30, 45` |

Mix freely — a 2:1 split is `w=40` + `w=20`, a sidebar layout is `w=15` + `w=45`, etc.

---

## Asymmetric splits reference

Any `width` pair that sums to 60 is valid. Common asymmetric splits on the 30-column half-grid:

| Left (w) | Right (w) | Sum | Use case |
|---|---|---|---|
| 40 | 20 | 60 | Wide main + narrow detail (patterns 13, 15, 16, 21) |
| 45 | 15 | 60 | Wide main + slim sidebar (pattern 19) |
| 20 | 40 | 60 | Narrow nav/label + wide chart (pattern 18 sidebar variant) |
| 30 | 30 | 60 | Equal split (patterns 3, 14) |

For three-column asymmetric layouts sum all three widths to 60:

| Left (w) | Center (w) | Right (w) | Sum | Use case |
|---|---|---|---|---|
| 20 | 20 | 20 | 60 | Equal thirds (patterns 5, 6, 12) |
| 15 | 15 | 30 | 60 | Two narrow + one wide (custom) |
| 30 | 15 | 15 | 60 | Wide left + two narrow right (pattern 22) |
