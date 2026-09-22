# Hybrid App Architecture -- Mixing Rooster + KPI + ProCode

## The Three-Track Creation Flow

For App Studio apps, components are created in this order:

### Track 1: Structural Components (Rooster)
- Banners for page headers
- FilterLists for interactive filtering
- Created FIRST because they define the page structure

### Track 2: Data Visualization (KPI Cards)
- Charts, tables, metrics, trendlines
- Created SECOND -- the core analytical content

### Track 3: Custom Components (ProCode Cards)
- Custom HTML/CSS/JS for UI beyond native capabilities
- Created LAST -- fills gaps where Rooster and KPI fall short
- Embedded via `app_card_create` after ProCode app is deployed

## Layout Patterns for Mixed-Component Pages

All three component types use the same 60-unit grid layout system.
`appstudio_layout` handles Rooster, KPI, and ProCode cards identically.

### Typical Page Layout

| Row | Component | Type | Grid Position |
|---|---|---|---|
| Header (top) | Page Banner | Banner (rooster) | x:0, y:0, w:60, h:8 |
| Filter bar | Location Filter | FilterList (rooster) | x:0, y:8, w:20, h:30 |
| Main chart | Trend Analysis | KPI (badge_trendline) | x:20, y:8, w:40, h:30 |
| Detail cards | KPI metrics | KPI (badge_singlevalue) | x:20, y:38, w:20, h:15 each |
| Custom widget | Interactive Table | ProCode card | x:0, y:53, w:60, h:25 |

### Two-Page Master-Detail Pattern

**Page 1 (Browse):**
| Row | Component | Type | Grid Position |
|---|---|---|---|
| Header | Page Banner | Banner (rooster) | x:0, y:0, w:60, h:8 |
| Sidebar | Category Filter | FilterList (rooster) | x:0, y:8, w:20, h:50 |
| Main | Product Gallery | Gallery (rooster) | x:20, y:8, w:40, h:50 |

**Page 2 (Detail):**
| Row | Component | Type | Grid Position |
|---|---|---|---|
| Header | Page Banner | Banner (rooster) | x:0, y:0, w:60, h:8 |
| Main | Record Details | Details (rooster) | x:0, y:8, w:60, h:50 |

## When to Use Each Type

| Need | Best Choice | Why Not the Others |
|---|---|---|
| Styled page header with image | Banner (rooster) | KPI has no image+text combo; ProCode is overkill |
| Interactive filter sidebar | FilterList (rooster) | KPI can't do interactive filtering; ProCode can but is complex |
| Standard bar/line/pie chart | KPI card | Rooster has no chart rendering; ProCode is overkill |
| Conditional KPI with colors + deltas | ProCode card | KPI badge_singlevalue too small in AppStudio; Details rooster works for simple cases |
| Full record detail view | Details (rooster) | KPI can't show multi-field records; ProCode can but Rooster is simpler |
| Product/person gallery grid | Gallery (rooster) | KPI has no card-grid layout; ProCode can but Rooster is native |
| Status list with work queue | List (rooster) | KPI has no row-list layout; ProCode is overkill for simple lists |
| Complex interactive table | ProCode card | Rooster has no table widget; KPI tables lack interactivity |

## Component Type Proportions (Rules of Thumb)

| App Type | Rooster % | KPI % | ProCode % |
|---|---|---|---|
| Executive dashboard | 20% (banner + filters) | 70% (charts + metrics) | 10% (custom KPIs) |
| Operational app | 40% (lists + filters + details) | 40% (charts) | 20% (custom widgets) |
| Browse/catalog app | 70% (gallery + filters + details) | 20% (summary metrics) | 10% (custom search) |
| Data entry app | 30% (banner + lists) | 10% (status metrics) | 60% (forms + custom UI) |

## Integration Patterns

### Rooster + KPI on Same Page
- Banner at top for page identity
- KPI cards for data visualization
- FilterList or List for browsing/filtering alongside charts

### Rooster + ProCode
- Gallery or List as navigation layer (row click sets variable)
- ProCode card reads variable and renders custom detail view
- Combines native Rooster browsing with custom rendering

### All Three Together
- Banner (page header) + FilterList (sidebar) + KPI (charts) + ProCode (custom widget)
- The most capable pattern -- use when the app genuinely needs all three capabilities
- Avoid this complexity if Rooster + KPI alone can satisfy the requirements
