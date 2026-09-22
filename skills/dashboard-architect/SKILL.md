---
name: dashboard-architect
tier: 1
description: "Designs highly effective Domo dashboards grounded in cognitive science, data visualization research, and Domo-specific best practices. Produces a complete dashboard blueprint — page layout, card specifications, color system, KPI design, and drill paths — before any cards are built. Trigger with 'design a dashboard', 'dashboard blueprint', 'build me a dashboard', 'dashboard layout', 'plan the dashboard', 'how should I visualize this', or any request to create or redesign a Domo dashboard."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by dashboard-build (T1) in the v2 customer-delivery cluster. The spec phase from this skill folds into dashboard-build's judgment axes."
audience: [intelligence]
pipeline:
  phase: build
  sub_phase: dashboarding
  position: 1
  output_type: output
  wave: 2
  state: ready
  inputs:
    - agent: account-360
      required: false
      data: account context, available datasets, business goals
    - agent: solution-architect
      required: false
      data: data model, beast modes, dataset relationships
  outputs:
    - name: dashboard-blueprint
      format: markdown
      downstream:
        - agent: card-builder
  data_sources:
    - tool: dataset_search
      required: false
    - tool: dataset_schema
      required: false
    - tool: page_list
      required: false
  phase_gate: true
---

# Dashboard Architect — Science-Driven Dashboard Design

Designs Domo dashboards using principles from cognitive science, information visualization research, and Domo platform best practices. Produces a complete blueprint that a card-builder agent (or human) can execute without guesswork. Every design decision is grounded in research — not aesthetics, not gut feel.

This skill exists because the difference between a dashboard that gets used daily and one that gets ignored is design, not data.

## How It Works

```
User says: "build me a fulfillment dashboard for Jet's"
                    |
         Clarify audience & questions
         (who looks at this? what decisions?)
                    |
    +-------+-------+-------+-------+
    |       |       |       |       |
  Audience  Business Available  Current
  Profile   Questions Datasets  State
    |       |       |       |       |
    +-------+-------+-------+-------+
                    |
         Apply Design Science
         (layout, charts, color, hierarchy)
                    |
         Produce Dashboard Blueprint
         (page map, card specs, KPI cards,
          color system, drill paths)
                    |
         Hand off to card-builder
```

## Triggers

- "design a dashboard"
- "dashboard blueprint"
- "build me a dashboard"
- "plan the dashboard"
- "dashboard layout"
- "how should I visualize this"
- "redesign this dashboard"
- "make this dashboard better"
- "what charts should I use"
- "dashboard for [stakeholder/role]"

## Tools Required

| Tool | MCP Server | Required For |
|------|-----------|-------------|
| `dataset_search` | domo-datasets | Optional: Discover available datasets |
| `dataset_schema` | domo-datasets | Optional: Column names, types, sample values |
| `page_list` | domo-pages | Optional: Existing page state |

**Pre-flight:** Before starting, verify these tools are available. If any tool returns "unknown tool" or is not in the allowed tools list, fall back to Manual Mode (see Connecting MCP Tools section) and ask the user to provide dataset information directly.

## If Tools Are Unavailable

If any required tool is not available (returns "unknown tool" error or is missing from allowed tools):

1. **Check credentials**: The customer's Domo instance may not be configured. Ask the user to verify their Domo connection.
2. **Continuation mode**: If you're in a continuation turn, read-only tools (dataset_list, dataset_query, search) are stripped. Use data from the checkpoint context instead of re-querying.
3. **Report the gap**: Tell the user which specific tool is unavailable and why the workflow can't proceed without it.
4. **Never guess**: Do not attempt to call tools that aren't available. Do not try alternative endpoints or raw API calls.

---

## Execution Flow

### Step 1: Audience & Intent Discovery

Before touching layout or charts, establish WHO, WHY, and WHERE (output type). The entire design flows from this.

#### Output Type Input

This skill receives an `output_type` from the dashboard-builder orchestration (Step 0.5). The output type constrains what the blueprint can specify:

| Constraint | v1 Dashboard | v2 Page | App Studio |
|---|---|---|---|
| Layout control | Card sizing only (medium/large/full) | **Automated 60-unit grid** (`layout_set`) | **Automated positioning on staging page** → Import into App Studio |
| Text blocks / headers | No (card titles only) | Yes (HEADER type in layout) | Yes (add text blocks, section headers) |
| Images / branding | No | No | Yes (logos, background images) |
| Custom filter bar | No (top-right page filter only) | No (top-right page filter only) | Yes (place filter controls anywhere) |
| Card embedding | Automatic (created on page) | Automatic (created on page) | Automatic (created on staging page, imported into App Studio) |
| Collections / grouping | No | Possible (v2 collections in UI) | Yes (row/section containers) |

**Design implications by output type:**
- **v1 Dashboard:** Blueprint specifies card sizes (medium/large/full via `card_size_set`). User manually arranges position in Domo UI.
- **v2 Page:** Blueprint specifies exact grid positions on 60-unit grid (`layout_convert` + `layout_set`). Automated positioning — include `{x, y, width, height}` for each card. Can add section headers as HEADER elements. Collections still manual.
- **App Studio:** Same as v2 Page (automated positioning on staging page), then user clicks "Import → Dashboard" in App Studio. Blueprint can specify richer visual elements — branding, custom filter placement — in the Assembly Guide for post-import customization.

If `output_type` is not provided (e.g., skill invoked standalone), default to `v1_dashboard` constraints.

#### Component Type Selection (App Studio Only)

For App Studio output, every element in the blueprint MUST specify a `component_type`:

| UI Element | component_type | Rationale |
|---|---|---|
| Page header / section banner | `rooster:banner` | Native styled header |
| Filter sidebar / faceted search | `rooster:filterlist` | Interactive filter UX |
| Record detail view | `rooster:details` | Two-panel detail layout |
| Image card grid | `rooster:gallery` | Repeating card gallery |
| Status/item list | `rooster:list` | Interactive list with actions |
| Chart / table / metric | `kpi` | Standard Domo visualization |
| Custom interactive UI | `procode` | Full HTML/CSS/JS |

**Validation rule:** App Studio blueprints MUST include at least one `rooster:banner` component (page header). An all-KPI App Studio app is an architectural smell.

See `build-appstudio/reference/rooster-component-decision-matrix.md` for the full decision tree.

#### Persona Profile Input

When invoked as part of the dashboard-builder symphony, this step receives a **Persona Profile** from the persona-discovery step. If a persona profile exists, use it as the primary source for all audience fields below — do not re-ask questions the persona already answers.

Map persona fields to design constraints:
- **Persona frequency + duration** → audience tier (executive/director/manager/analyst) and card count limits
- **Top 3 Questions** → above-the-fold card selection (each question = a card)
- **Language & Terms** → card titles, axis labels, filter names (use THEIR words)
- **Device** → grid density, font sizes
- **Decision Authority** → what the actionable records tier shows
- **Frustrations** → anti-requirements (what the dashboard MUST solve)
- **Success Metric** → the 5-second test criteria

If no persona profile is provided (standalone invocation), gather audience info via the questions below.

#### Audience & Questions

Ask (or infer from context):

| Question | Why It Matters | Design Impact |
|----------|---------------|---------------|
| Who is the primary audience? | Executives need 5-second status; analysts need drill-down | Chart density, interaction depth, KPI count |
| What decisions does this dashboard support? | Each decision maps to a card | If a card doesn't support a decision, it doesn't belong |
| What are the top 3 questions this should answer? | Forces prioritization — dashboards that try to answer everything answer nothing | Top 3 questions get above-the-fold placement |
| How often will this be viewed? | Daily dashboards need instant clarity; weekly ones can support more exploration | Daily = simpler, fewer cards; weekly = richer |
| What device? | Mobile, laptop, boardroom display | Grid density, font sizes, card count |

**Audience profiles and their constraints:**

| Audience | Max KPIs | Max Cards | Max Drill Levels | Interaction Expected |
|----------|----------|-----------|-------------------|---------------------|
| Executive / C-suite | 4-5 | 3-5 | 1-2 | Near zero — glance and go |
| Director / VP | 5-7 | 5-8 | 2-3 | Light filtering, drill-down |
| Manager / Analyst | 6-8 | 8-12 | 3-4 | Heavy filtering, cross-filtering, export |
| Operations / Frontline | 3-5 | 4-6 | 1-2 | Real-time monitoring, alerts |

### Step 2: Map Business Questions to Visual Answers

For each business question identified in Step 1, determine:

1. **The data relationship** being shown (comparison, composition, distribution, relationship, trend)
2. **The optimal chart type** based on the Cleveland & McGill visual encoding accuracy hierarchy
3. **The priority tier** (above-the-fold vs. below, primary vs. supporting)

**Chart Selection Matrix — use the highest-accuracy encoding that fits the data:**

| Data Relationship | Best Chart | Encoding Used | Accuracy Rank |
|-------------------|-----------|---------------|---------------|
| Compare categories | Horizontal bar chart | Length (position on common scale) | 1-3 |
| Compare over time | Line chart (max 5-7 series) | Position on common scale | 1 |
| Rank items | Sorted horizontal bar chart | Length + continuity | 1-3 |
| Part of whole (2-3 parts) | Stacked bar or donut | Length / angle | 3-4 |
| Part of whole (4+ parts) | Stacked bar or small multiples | Length | 3 |
| Distribution | Histogram (10-20 bins) | Length | 3 |
| Correlation | Scatter plot | Position on common scale | 1 |
| Single KPI + trend | Summary number + sparkline | Position | 1 |
| Geographic | Map | Position (spatial) | 1 |
| Status across many items | Heat map or conditional table | Color intensity | 5 |

**Hard rules from the research:**

- **Never use pie charts with 4+ slices.** The brain cannot accurately compare angles. Use horizontal bar charts.
- **Never use 3D charts.** They distort perception — rear slices of 3D pie charts appear ~30% smaller. Always 2D.
- **Never use dual-axis charts.** The scales are arbitrary and create false correlations. Use indexed charts (% change from baseline) or side-by-side panels. (Stephen Few, "Dual-Scaled Axes in Graphs")
- **Never use gauges.** They consume 4x the space of a KPI card for the same information. Use summary number + sparkline.
- **Never use rainbow color scales.** They have no perceptual ordering. Use single-hue sequential palettes.
- **Never use spaghetti charts** (line chart with 8+ series). Use small multiples or highlight 1-2 series and gray out the rest.
- **Bar chart Y-axes must start at zero.** Truncated axes exaggerate small differences.

### Step 3: Design the Information Hierarchy (Top-Down Decomposition)

The most common dashboard failure is building cards bottom-up — starting with available data and asking "what can we chart?" The correct approach is **top-down**: start with the single highest-level answer the audience needs, then decompose downward.

#### The Hero Card Principle

Every dashboard has ONE hero — the single card (or KPI row) that answers the audience's first question. Everything else on the page exists to explain, decompose, or contextualize the hero.

**Think of it like a newspaper:**
- The **headline** (hero KPI row) tells you the story in one glance
- The **lead paragraph** (primary chart) gives the key supporting evidence
- The **body paragraphs** (supporting charts) break it down by dimension
- The **appendix** (detail table / drill-down) has the raw receipts

**The decomposition thought process:**

```
Step A: What is the ONE number that summarizes this domain?
        → That's your hero KPI (e.g., "Total Fulfillment Rate: 94.2%")

Step B: What 3-4 numbers sit directly beneath it?
        → Those are your supporting KPIs
        (e.g., On-Time %, Fill Rate %, Avg Days to Ship, Orders at Risk)

Step C: For each KPI — what EXPLAINS it? What DRIVES it?
        → Those are your analytical charts
        (e.g., Fulfillment Rate by Region, Trend over Time, by Product Category)

Step D: For each chart — what's the next question someone asks?
        → Those are your drill paths and detail tables
        (e.g., click "Midwest" → see Midwest stores → see individual orders)
```

This creates a natural **question tree**:

```
"How is fulfillment doing?"                          ← Hero KPIs answer this
    │
    ├── "Which regions are dragging it down?"         ← Primary chart answers this
    │       └── "Which stores in that region?"        ← Drill-down answers this
    │               └── "Which orders are late?"      ← Detail table answers this
    │
    ├── "Is it getting better or worse?"              ← Trend chart answers this
    │       └── "When did it start declining?"        ← Annotation answers this
    │
    └── "What product categories have problems?"      ← Breakdown chart answers this
            └── "What's the root cause?"              ← Cross-filter reveals this
```

**The key insight:** Each row of the dashboard answers questions raised by the row above it. If a card doesn't answer a question that the hero row provokes, it doesn't belong on this page.

#### Page Layout: The Vertical Flow

```
┌─────────────────────────────────────────────────────┐
│  TIER 1: THE HEADLINE — "How are we doing?"         │
│  (Above the fold — visible without scrolling)       │
│                                                      │
│  Row 1: Hero KPI Row (3-5 summary number cards)    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │HERO  │ │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │     │
│  │ +Δ%  │ │ +Δ%  │ │ +Δ%  │ │ +Δ%  │ │ +Δ%  │     │
│  │ ▁▂▄▆ │ │ ▆▄▂▁ │ │ ▂▄▆▇ │ │ ▄▄▄▄ │ │ ▂▃▅▇ │     │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│  The leftmost card is the single most important     │
│  number. It should be visually dominant.             │
│                                                      │
│  TIER 2: THE EVIDENCE — "Why?"                      │
│                                                      │
│  Row 2: Primary Analysis (1-2 wide charts)          │
│  ┌────────────────────────┐ ┌──────────────────┐    │
│  │ Primary breakdown      │ │ Trend over time  │    │
│  │ (8 cols)               │ │ (4 cols)         │    │
│  │ Answers: "where is the │ │ Answers: "is it  │    │
│  │ problem/opportunity?"  │ │ getting better?" │    │
│  └────────────────────────┘ └──────────────────┘    │
│                                                      │
├─────────────────────────────────────────────────────┤
│  TIER 3: THE DECOMPOSITION — "What specifically?"   │
│  (Below the fold — scroll for detail)               │
│                                                      │
│  Row 3: Supporting Analysis (2-3 medium charts)     │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │ By Category  │ │ By Segment   │ │ Comparison │  │
│  │ (4 cols)     │ │ (4 cols)     │ │ (4 cols)   │  │
│  │ Decomposes   │ │ Decomposes   │ │ Decomposes │  │
│  │ a Tier 2     │ │ a Tier 2     │ │ a Tier 2   │  │
│  │ chart further│ │ chart further│ │ chart       │  │
│  └──────────────┘ └──────────────┘ └────────────┘  │
│                                                      │
│  TIER 4: THE RECEIPTS — "Show me the records"       │
│                                                      │
│  Row 4: Detail Table (drill-down target)            │
│  ┌─────────────────────────────────────────────┐    │
│  │ Sortable, filterable detail table (12 cols) │    │
│  │ Individual records the user can act on      │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Each tier has a job:**

| Tier | Job | User Question | Time to Answer |
|------|-----|---------------|----------------|
| 1 — Hero KPIs | Status check | "How are we doing?" | 2-3 seconds (glance) |
| 2 — Primary Charts | Explain the headline | "Why? Where?" | 10-15 seconds (scan) |
| 3 — Supporting Charts | Decompose by dimension | "What specifically?" | 30-60 seconds (explore) |
| 4 — Detail Table | Provide actionable records | "Show me the data" | 2-5 minutes (investigate) |

**An executive may never leave Tier 1.** A manager lives in Tier 2-3. An analyst digs into Tier 4. All three audiences use the same dashboard — the top-down structure naturally serves each depth of engagement.

#### Layout Rules

- **60-unit grid** (for v2/App Studio output). Allows halves (30+30), thirds (20+20+20), quarters (15+15+15+15), mixed (40+20). For v1 dashboards, use card sizes (medium/large/full) instead.
- **KPI row is always full-width at the top.** 3-5 summary number cards. Never more than 7.
- **The hero KPI (leftmost) should be visually dominant** — larger font, bolder color, or wider card. The eye lands here first.
- **Primary chart gets 8 columns.** The single most important analytical chart is wider than everything else.
- **Consistent gutter width** of 16-24px between cards.
- **Maximum 3 different card widths per page.** More variety creates visual chaos.
- **Never mix more than 5 Domo collections per page** and 6 cards per collection.

#### Reading Order and Narrative Flow

- **Cause appears left of / above effect.** (Marketing spend chart → Revenue chart, not reversed.)
- **Time flows left-to-right** consistently across all charts on the page.
- **Summary always precedes detail.** Never put a detail table above summary KPIs.
- The dashboard tells a **beginning-middle-end story**: headline status (Tier 1) → supporting evidence (Tier 2) → granular detail (Tier 3-4).
- **Each card should provoke the question that the card below/beside it answers.** If a user looks at the hero KPIs and doesn't naturally want to look at the primary charts, the hierarchy is broken.

### Step 4: Design the KPI Cards

Every KPI card must contain exactly 5 elements. A number without context is meaningless.

```
┌────────────────────────────┐
│  Total Revenue        ← 1. Label (clear, jargon-free)
│                            │
│  $12.4M              ← 2. Current value (large, bold)
│  ▲ 8.2% vs LY       ← 3. Comparison context (vs target, prior period, or benchmark)
│  ▁▂▃▄▅▆▇            ← 4. Trend (sparkline, 6-12 periods)
│  🟢 On Track         ← 5. Status signal (semantic color or icon)
└────────────────────────────┘
```

**KPI design rules:**

- The **current value** is the largest visual element — minimum 2x the font size of the label.
- **Always include comparison context.** At minimum one of: vs. target, vs. prior period, vs. benchmark.
- **Sparklines show 6-12 periods.** Enough for shape recognition. No axes or labels on sparklines.
- **Trend arrows and deltas go directly next to the value**, not in a separate location. Change blindness means users will miss changes in peripheral areas.
- If using **traffic light colors** (red/amber/green), always pair with the actual number and trend — never show color alone. Define thresholds using statistical baselines, not arbitrary cutoffs.
- **Avoid gauges.** A KPI card with number + trend + sparkline conveys the same info in 25% of the space.

### Step 5: Design the Color System

Color is the most misused element in dashboards. Every color must encode meaning.

**The color system for this dashboard:**

| Purpose | Rule | Example |
|---------|------|---------|
| **Primary data series** | Single brand-adjacent color | Blue (#2196F3) for the main metric |
| **Categorical encoding** | Okabe-Ito colorblind-safe palette, max 5 hues | Blue, Orange, Green, Vermilion, Sky Blue |
| **Sequential encoding** | Single-hue gradient, light → dark | Light blue → Dark blue for low → high |
| **Diverging encoding** | Two-hue with neutral center | Blue (positive) — Gray (neutral) — Red (negative) |
| **Semantic alerts** | Red = bad, Amber = warning, Green = good | Used only for status indicators, sparingly |
| **De-emphasis** | Light gray (#E0E0E0) | Grid lines, borders, inactive elements |

**Color rules:**

- **Maximum 5 colors per visualization.** Beyond this, viewers cannot reliably distinguish them (Healey, 1996).
- **Same color = same meaning everywhere on the page.** If blue is revenue in one chart, blue is revenue in all charts.
- **Never use red-green as the only differentiator.** 8% of men are colorblind. Pair color with shape, pattern, or label.
- **WCAG 2.1 AA contrast**: 4.5:1 for text, 3:1 for graphical elements.
- **Maximize the data-ink ratio** (Tufte). Remove: chart borders, background fills, shadows, gradients, 3D effects. Lighten gridlines to 10-15% opacity.
- **Single data series = one neutral color.** Don't use 5 colors when only 1 is needed.
- When in doubt, **use gray** and add color only where it encodes specific meaning.

### Step 6: Design the Interaction Model

**The 80/20 rule of interactivity:** The dashboard must deliver 80% of its value with zero interaction. Interactivity serves the remaining 20% — but that 20% is where dashboards become *powerful* rather than just pretty.

The interaction model is how a static page of cards becomes an **analytical tool**. A well-designed interaction model lets one dashboard answer dozens of follow-up questions without building dozens of cards. A poorly designed one hides critical information behind clicks nobody makes.

#### The Three Layers of Interactivity

Think of interactions as three concentric layers, each answering a different depth of question:

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: PAGE FILTERS                          │
│  "Show me this dashboard, but for ____"         │
│                                                  │
│  Changes the ENTIRE page's context.             │
│  Same dashboard, different slice.               │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  LAYER 2: CROSS-FILTERING (Interactions)  │  │
│  │  "I see something interesting — zoom in"  │  │
│  │                                            │  │
│  │  Click one card, every other card          │  │
│  │  responds. Reveals relationships.          │  │
│  │                                            │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  LAYER 3: DRILL PATHS              │  │  │
│  │  │  "Show me the underlying records"   │  │  │
│  │  │                                     │  │  │
│  │  │  Navigate deeper within ONE card.   │  │  │
│  │  │  Summary → Category → Detail.       │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

#### Layer 1: Page Filters — Reframing the Whole Story

Page filters change the **context** of every card simultaneously. They turn one dashboard into many dashboards without duplicating a single card.

**When to use page filters:**

The test is: *"Would someone need to see this exact dashboard for different values of X?"* If yes, X is a page filter. Common examples:

| Filter Dimension | Why It's a Page Filter | Business Question It Answers |
|-----------------|----------------------|------------------------------|
| Date range | Every metric is time-bound; users need to compare periods | "How did we do last quarter vs. this quarter?" |
| Region / Territory | Same KPIs, different geography | "How is the West doing vs. the East?" |
| Product line / Category | Same operational metrics, different product | "How is fulfillment for frozen vs. fresh?" |
| Store / Location | Roll up vs. single-site view | "What does this look like for Store #142?" |
| Customer segment | Same health metrics, different cohort | "How are our Enterprise accounts vs. SMB?" |

**Page filter design rules:**

- **Maximum 3-4 visible filters.** More = decision paralysis and an implicit admission that the dashboard isn't focused enough. If you need 6 filters, you need 2 dashboards.
- **Always set smart defaults.** A filter set to "All" with 500 options is not helpful. Default to the most common view (current month, user's region, all products).
- **Date filters go top-left or top-right.** They are the most frequently changed filter and users expect them there.
- **Filters should be independent.** Avoid cascading dependencies (where Filter A changes Filter B's options) — they confuse users and break mental models. If dependencies are unavoidable, make the hierarchy obvious (Region → then City).
- **The dashboard title or subtitle should reflect the active filter state.** Users forget what they've filtered to. A card showing "Revenue: $2.1M" means nothing if the user doesn't realize they're filtered to one region.

**The multiplier effect:** A dashboard with 3 page filters (Date: 4 options, Region: 5 options, Category: 3 options) effectively creates 4 × 5 × 3 = **60 different views** from one page. This is why page filters are the highest-leverage interaction.

#### Layer 2: Cross-Filtering (Domo Interactions) — Asking Follow-Up Questions

Cross-filtering is the most underused and most powerful interaction in Domo. When a user clicks a bar, slice, or data point in one card, every other card on the page filters to that selection. This turns a static page into a **conversation with the data.**

**The mental model:** Cross-filtering answers the question *"When I see something interesting in Chart A, what does the rest of the dashboard look like for just that segment?"*

**Example — Fulfillment Dashboard:**

```
WITHOUT cross-filtering:
  User sees "Midwest has 87% fulfillment" in the bar chart.
  User thinks: "Which products are driving that? What's the trend?"
  User has NO WAY to answer this without a separate card or drill path for every region.

WITH cross-filtering:
  User CLICKS the "Midwest" bar.
  → The trend chart now shows Midwest-only trend line
  → The product breakdown now shows only Midwest products
  → The detail table now shows only Midwest orders
  → The KPI cards now show Midwest-only numbers

  The user just asked and answered a complex multi-dimensional question
  with a SINGLE CLICK. No new cards needed.
```

**How to design cross-filtering:**

1. **Identify the "exploration dimensions."** These are the fields users will want to isolate. Typically: a geographic dimension, a categorical dimension, and a time dimension.

2. **Designate "source cards" and "target cards."** Source cards are the ones users will click on — typically bar charts, maps, or tables with clear clickable elements. Target cards are the ones that respond — typically trends, breakdowns, and KPIs.

3. **Map the interaction flow:**

```
Source Card (click)          Target Cards (respond)
─────────────────            ──────────────────────
Region bar chart      →      Trend line, Product breakdown, Detail table, KPI row
Product bar chart     →      Trend line, Region breakdown, Detail table, KPI row
Trend line (point)    →      Region breakdown, Product breakdown, Detail table
```

4. **Every card on the page should be either a source, a target, or both.** A card that neither drives nor responds to cross-filtering is an island — it doesn't participate in the analytical conversation and should be questioned.

**Cross-filtering design rules:**

- **The hero KPI row should respond to cross-filters.** When a user clicks "Midwest" in a bar chart, the KPIs at the top should recalculate for Midwest. This is the highest-impact interaction — it lets users see the headline numbers for any segment instantly.
- **Source cards should have obvious clickable elements.** Bar charts and tables are ideal. Line charts are poor sources (clicking a point on a line is imprecise). Scatter plots work if points are large enough.
- **Show the active filter state visually.** When "Midwest" is selected, the Midwest bar should be highlighted and all other bars dimmed. The user must always know what's filtered.
- **Provide a clear way to reset.** In Domo, clicking the same element again deselects. But also consider a visible "Reset" or "Clear All" action.
- **Don't cross-filter cards that lose meaning when filtered.** A "Total Revenue" KPI card is useful cross-filtered. A "Revenue by Region" bar chart that cross-filters FROM region becomes confusing when it's also being filtered BY region.
- **Test the interaction stories.** Walk through 3-5 realistic analytical paths: "I see X, I click Y, I expect to see Z." If any path leads to confusion or a dead end, the interaction model needs adjustment.

**The compounding power of layers 1 + 2 together:**

Page filters set the broad context. Cross-filtering drills into specifics within that context. Together:

```
Page filter: "Q1 2025"  +  Cross-filter click: "Frozen Products"
= Every card on the page now shows Q1 2025 Frozen Products performance

The user has sliced a complex dataset down to a precise question
("How did frozen fulfillment perform in Q1?") using exactly two clicks.
No custom card needed. No analyst request. Self-service in seconds.
```

#### Layer 3: Drill Paths — Going Deeper Within a Single Card

Drill paths navigate **vertically through a hierarchy** within one card. Where cross-filtering shows the same metric across different cards, drill paths show **progressive levels of detail** within one card.

**The thought process for drill path design:**

```
Each drill level answers: "Which specific [child] within [parent] is responsible?"

Level 0 (landing):  Fulfillment Rate by Region          ← "Where?"
Level 1 (drill):    Fulfillment Rate by Store            ← "Which store?"
Level 2 (drill):    Individual Late Orders               ← "Which orders?"
```

**Drill path design rules:**

- Each drill level follows a **logical hierarchy** (Region → Store → Order). Never skip levels or drill into unrelated dimensions.
- Every drill level must have **strong information scent** — the user knows what they'll see before clicking.
- Maximum drill levels: **2 for executives, 3-4 for analysts.** More than 4 and users get lost.
- **Never hide alerts behind drill paths.** If a metric is in crisis, it must be visible on the landing view without drilling.
- **The drill path should follow the question tree from Step 3.** If the top-down decomposition says the next question after "Which region?" is "Which store?", that's your drill hierarchy.

#### Choosing the Right Layer for Each Question

| User's Follow-Up Question | Best Interaction Layer | Why |
|--------------------------|----------------------|-----|
| "Show me this for a different time period" | Page Filter | Changes entire context, not just one card |
| "Show me this for my region only" | Page Filter | Persistent scope change across all cards |
| "That bar looks bad — what's driving it?" | Cross-Filter (click the bar) | Need to see how OTHER cards react to this selection |
| "What does the trend look like for just that category?" | Cross-Filter | Trend card responds to category selection |
| "Which specific stores have the problem?" | Drill Path | Going deeper within the same dimension |
| "Show me the actual order records" | Drill Path (bottom level) or Detail Table | Need individual records to act on |
| "What's the exact value of that data point?" | Tooltip | Supplementary precision, not a new question |

#### Interaction Anti-Patterns

- **Hiding critical status behind ANY interaction.** If a KPI is red, it must be red on page load. Never require a click to discover a crisis.
- **Cross-filtering that creates empty states.** If clicking "Region A" in one chart results in a blank chart elsewhere (because that combo has no data), the interaction confuses rather than enlightens. Test edge cases.
- **Drill paths as the only way to see breakdowns.** If 80% of users need to see "by Region," that's a card on the page — not a drill level. Drill paths are for the 20% who need to go deeper.
- **Too many filter controls visible at once.** 5+ visible filters signal that the dashboard doesn't know its audience. If a filter is used less than 20% of sessions, hide it behind "More Filters" or remove it.
- **Tooltips as a crutch.** If a tooltip contains information essential to understanding the chart, that information should be a label, annotation, or separate card. Tooltips are for supplementary precision only.

### Step 7: Produce the Blueprint

Compile all decisions into the output template below.

---

## Output Template

```markdown
# Dashboard Blueprint: [Dashboard Name]

**Client:** [Customer Name]
**Output Type:** [v1 Dashboard / v2 Page / App Studio]
**Audience:** [Role/persona — e.g., VP Operations, Executive Team]
**Primary Questions:**
1. [Top business question]
2. [Second question]
3. [Third question]
**Decision Cadence:** [Daily / Weekly / Monthly]
**Viewing Device:** [Laptop / Mobile / Boardroom]

---

## Page Map

[Number of pages, purpose of each, navigation between them]

### Page 1: [Page Name — e.g., "Executive Overview"]

**Purpose:** [What decisions this page supports]
**Collections:** [N]

---

## KPI Summary Row

| Position | KPI Name | Metric | Comparison | Source Dataset | Beast Mode? |
|----------|----------|--------|------------|---------------|-------------|
| 1 (leftmost) | [Name] | [Field/calculation] | [vs. target / vs. LY / vs. benchmark] | [Dataset] | [Yes/No — formula if yes] |
| 2 | [Name] | [Field/calculation] | [Comparison] | [Dataset] | [Y/N] |
| 3 | [Name] | [Field/calculation] | [Comparison] | [Dataset] | [Y/N] |
| 4 | [Name] | [Field/calculation] | [Comparison] | [Dataset] | [Y/N] |
| 5 | [Name] | [Field/calculation] | [Comparison] | [Dataset] | [Y/N] |

---

## Card Specifications

### Card 1: [Card Title — must state the business question]

| Property | Value |
|----------|-------|
| **Grid position** | Row [N], Columns [X-Y] of 12 |
| **Chart type** | [Type] |
| **Why this chart** | [Data relationship → encoding rationale] |
| **Dataset** | [Name] |
| **X-axis / Dimension** | [Field] |
| **Y-axis / Measure** | [Field + aggregation] |
| **Series / Color** | [Field — or "single series, use [color]"] |
| **Sort** | [Ascending/Descending by value / Chronological] |
| **Filters** | [Any card-level filters] |
| **Beast modes** | [Name: formula, if any] |
| **Drill path** | [Level 1 → Level 2 → ...] or "None" |
| **component_type** | `kpi`, `rooster:banner`, `rooster:filterlist`, `rooster:details`, `rooster:gallery`, `rooster:list`, or `procode` |
| **Cross-filter role** | [Source (users click this) / Target (responds to clicks) / Both / None] |
| **Cross-filter targets** | [Which cards respond when this card is clicked, or "N/A"] |
| **Design notes** | [Specific formatting: axis labels, number format, annotations] |

[Repeat for each card]

---

## Color System

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | [Name] | [#hex] | [Main data series, primary metric] |
| Secondary | [Name] | [#hex] | [Secondary data series] |
| Accent 1 | [Name] | [#hex] | [Category 1 / Tertiary series] |
| Accent 2 | [Name] | [#hex] | [Category 2] |
| Accent 3 | [Name] | [#hex] | [Category 3] |
| Positive | Green | #4CAF50 | [Above target / growth] |
| Warning | Amber | #FF9800 | [Approaching threshold] |
| Negative | Red | #F44336 | [Below target / decline] |
| Neutral | Gray | #9E9E9E | [De-emphasis, gridlines, inactive] |

**Accessibility:** Palette tested for deuteranopia and protanopia. All color encodings paired with [shape/label/pattern] as secondary channel.

---

## Interaction Model

### Page Filters

| Filter | Type | Default | Why This Filter | Position |
|--------|------|---------|-----------------|----------|
| [Date Range] | Date picker | [Last 12 months] | [Business reason — e.g., "Users compare monthly/quarterly"] | Top-right |
| [Segment/Category] | Dropdown | [All] | [Business reason — e.g., "Same KPIs needed per product line"] | Top-right |
| [Region/Location] | Dropdown | [All] | [Business reason — e.g., "Regional VPs need their own view"] | Top-right |

**Multiplier:** These [N] filters create [X × Y × Z] = [total] distinct views from one page.

### Cross-Filter Map (Domo Interactions)

| Source Card (click) | Target Cards (respond) | Analytical Question Answered |
|--------------------|-----------------------|------------------------------|
| [Card name — e.g., "Fulfillment by Region" bar chart] | [KPI row, Trend chart, Product breakdown, Detail table] | "When I see a problem region, what does everything else look like for just that region?" |
| [Card name — e.g., "Product Category" bar chart] | [KPI row, Trend chart, Region breakdown, Detail table] | "When I see a problem category, which regions and time periods are affected?" |
| [Card name — e.g., "Detail table" row click] | [KPI row, Trend chart] | "What does the full picture look like for this specific item?" |

**Interaction stories (test these):**
1. User sees [observation] → clicks [element] → expects to see [result across other cards]
2. User sets page filter to [X] → clicks [element] → sees [narrowed result] — this is the power of layers 1+2 combined
3. User resets all filters → confirms KPIs return to [baseline values]

### Drill Path Map

```
[Page 1: Overview]
    └── Hero KPI Card → [Drill to filtered trend by time period]
    └── Card 1: [Name] → [Drill to breakdown by child dimension]
        └── [Drill to individual records / detail table]
    └── Card 2: [Name] → [Drill to time series by sub-period]
```

**Drill hierarchy follows the question tree:**
- Level 0: "[High-level where/what?]" → Level 1: "[Which specific child?]" → Level 2: "[Show me the records]"

---

## Anti-Patterns Avoided

- [ ] No pie charts with 4+ slices (using horizontal bar instead)
- [ ] No 3D effects
- [ ] No dual-axis charts (using indexed or side-by-side instead)
- [ ] No gauges (using KPI cards with sparklines instead)
- [ ] No rainbow color scales (using single-hue sequential)
- [ ] No truncated bar chart Y-axes (starting at zero)
- [ ] No spaghetti charts (max 5-7 lines, or small multiples)
- [ ] Chart borders and backgrounds removed (maximizing data-ink ratio)
- [ ] All KPIs have comparison context (not raw numbers alone)
- [ ] Above-the-fold answers the top 3 questions without scrolling

---

## 5-Second Test

Show this dashboard for 5 seconds. The viewer should be able to answer:
1. **"What is the overall status?"** → [Expected answer from KPI row]
2. **"What needs attention?"** → [Expected answer from alert colors / attention section]

If they cannot, redesign.

---

**Prepared by:** Dashboard Architect
**Design principles:** Tufte (data-ink ratio), Few (dashboard layout), Knaflic (storytelling with data), Cleveland & McGill (encoding accuracy), Shneiderman (overview-zoom-detail), Gestalt (proximity, similarity, continuity), Cowan (working memory 3-5 chunks)
```

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"dashboard"`
- `target_description`: a concise phrase describing what is being built (the result of Step 1)

This returns SOW scope items, named datasets, business rules, recent discussions, decisions, assumptions, risks, stakeholders, and prior work — all keyed to your build target, with confidence scores per section.

**Step 3 — Human review of memory hits.** Present the returned context to the user. For each section that has results:
- Show the section title and what was found (a 1-2 line summary per item)
- Show the confidence score
- Ask the user: "Are these relevant to what you're building? Reject anything that's about a different build, an older version, or a different engagement."

If a section returned 0 items, mention it explicitly so the user knows there's no prior context for that area.

**Step 4 — Plan with confirmed context.** Once the user confirms which items are relevant, use ONLY those confirmed items as inputs to your build plan. If the user rejected key context (e.g., no SOW scope was relevant), confirm with them whether to proceed greenfield or pause to gather more requirements.

If `memory_build_context` returns 0 total items, explicitly tell the user: "I found no prior memory context for this build. This will be a greenfield build — please confirm the requirements before I proceed."

### After executing
- Call `memory_store_artifact` for **DashboardBlueprint**; `memory_remember` with KPI row, interaction model, and open design questions.

---

## Guardrails

- **Always start with audience and questions.** Never jump to chart types. A dashboard designed for the wrong audience or the wrong questions is a waste of cards.
- **Enforce the hard limits.** 5-7 KPIs, 5-8 cards, 5 colors per viz, 5 collections per Domo page, 6 cards per collection. Push back if the user asks for more — cognitive overload destroys usability.
- **Every card must justify its existence.** Ask: "What decision does this card support?" If there is no answer, the card does not belong.
- **Above the fold is sacred.** The top 600-800px must contain all KPIs and the primary analytical chart. Everything needed for a status check must be visible without scrolling.
- **A number without context is meaningless.** Every KPI must have comparison (vs. target, vs. prior, vs. benchmark). Never show raw numbers alone.
- **Chart type is not a preference — it's a science.** Use the Cleveland & McGill hierarchy. Bar beats pie. Position beats area. 2D beats 3D. Always.
- **Color is not decoration — it's data encoding.** Every color must mean something. Same meaning = same color across all cards. Don't use 5 colors when 1 will do.
- **Hero KPI row is NOT optional.** Every blueprint MUST start with a KPI summary row (3-5 cards). A blueprint without a hero row fails the 5-second test by definition. If the LLM skips the hero row, the blueprint is invalid and must be revised before presenting to the user.
- **Pre-calculated averages must never use AVG().** If a column is already an average (e.g., AvgTicket), using `AVG()` on it produces a mathematically wrong unweighted mean. Design a beast mode from raw components instead (e.g., `SUM(numerator) / NULLIF(SUM(denominator), 0)`).
- **Do not build cards until the blueprint is approved.** This skill produces the plan; card-builder executes it. Design errors are 10x cheaper to fix in a blueprint than in built cards.
- **Test the 5-second rule.** If an executive can't determine status in 5 seconds, the dashboard has failed.
- **Persist the blueprint to the knowledgebase** so card-builder and future sessions can reference it.

---

## Connecting MCP Tools

| Tool | Required | What It Provides |
|------|----------|------------------|
| dataset_search | Optional | Discover available datasets for the dashboard |
| dataset_schema | Optional | Column names, types, and sample values for chart specifications |
| page_list | Optional | Existing Domo pages to understand current dashboard state |

### Manual Mode

If MCP tools aren't connected, ask the user to provide:

1. A list of available datasets and their key columns
2. The business questions the dashboard should answer
3. The target audience and their analytical sophistication
4. Any existing dashboards to redesign or replace

The blueprint structure stays the same — card specifications just reference user-provided dataset info.

---

## Design Science Reference

This skill's decisions are grounded in published research. When questioned on a design choice, cite:

| Principle | Source | Key Insight |
|-----------|--------|-------------|
| Visual encoding accuracy | Cleveland & McGill, 1984 | Position > Length > Angle > Area > Volume. Bar charts beat pie charts because length encoding is 2x more accurate than angle. |
| Data-ink ratio | Tufte, 1983 | Maximize the proportion of ink that represents data. Remove all non-data ink (borders, backgrounds, shadows, 3D). |
| Working memory limits | Cowan, 2001 | Humans hold 3-5 chunks in working memory. Every chart, KPI, filter, and color is a chunk. |
| Overview-zoom-detail | Shneiderman, 1996 | Always show the overview first (KPIs), then allow zoom/filter (charts), then details-on-demand (drill-down). |
| Pre-attentive processing | Healey, 1996 | Color, size, orientation are processed in <500ms. Use them to draw attention to what matters most. Max 1-2 pre-attentive attributes per chart. |
| Gestalt proximity | Wertheimer et al., 1920s | Items within ~30px are perceived as grouped. Place labels within 8-12px of their chart. |
| Storytelling structure | Knaflic, 2015 | Dashboards are stories: context (top), evidence (middle), detail (bottom). Left = cause, right = effect. |
| Dual-axis critique | Few, 2008 | Dual axes create false correlations because scales are arbitrary. Use indexed charts or side-by-side instead. |
| Colorblind safety | Okabe & Ito, 2002 | 8% of men have color vision deficiency. Never rely on red-green alone. Always pair color with a second encoding. |
| 5-second rule | Industry standard | Executive must determine overall status within 5 seconds of looking, with zero interaction. |

---

## Related Skills

- **Card Builder** — Executes this blueprint by creating actual Domo cards with correct chart types, beast modes, and formatting
- **Solution Architect** — Designs the data model (datasets, DataFlows, beast modes) that feeds the dashboard
- **Account 360** — Provides account context and business goals that inform dashboard questions
- **Portfolio Health Dashboard** — Example of this skill's principles applied to a portfolio-level view
- **Executive Briefing** — Narrative complement to visual dashboards; references the same data
