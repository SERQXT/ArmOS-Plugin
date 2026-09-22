# Rooster DML Templates — Consolidated Reference

Working DML structures for all Rooster component types. Each section includes the templateType/templateKey, minimal working DML JSON, widget group structure, column binding rules, and type-specific gotchas.

## Component Type Disambiguation

App Studio has five kinds of card content on the canvas — only rooster components use DML:

| Kind | `type` field | Created via | Data config |
|------|-------------|-------------|-------------|
| **KPI Cards** (charts, tables, controls) | `kpi` | `POST /api/content/v1/cards` with `metadata.chartType` | `subscriptions[]` with column mappings |
| **Rooster Components** (Gallery, List, Card, Banner, Details, FilterList, Queue) | `rooster` | `POST /api/content/v1/cards` with `metadata.dml` | DML `@dataSource` param + `@groups` widget bindings |
| **Notebooks** (text/rich text) | `Text` | `POST /api/content/v1/cards/notebook` | N/A |
| **Images** | `document` | `POST /api/content/v1/cards` | File reference |
| **DDX Bricks** (custom code) | `domoapp` | Different flow | Client code in datastores |

## Critical: Double-Encoded DML Format

The `metadata.dml` field is **double-encoded**: a JSON string containing an object with a `dml` key whose value is XML.

```
metadata.dml = JSON.stringify({ dml: "<dml version=\"1\">...</dml>" })
```

Do NOT pass raw XML or a parsed object — it must be this exact double-encoded format. Getting this wrong is the #1 cause of rooster card creation failures.

## Querying Rooster Component Data

```
PUT /api/content/v1/cards/rooster/query
```

Executes data queries for rooster components. This endpoint has **no card ID in the path** — it updates the most recently created rooster card. Always call it immediately after POST creation.

## Universal Rules (All Rooster Components)

1. **`templateType` + `templateKey` REQUIRED** in the DML JSON params -- missing causes 403 on app load
2. **Column binding requires TWO updates**: `columns[].name/id` in the widget AND the `richTextDML` path
3. **JSoQL dataset UUID needs backticks**: `` `<uuid>` ``
4. **`useSampleData: false`** -- default is true which embeds sample CSV, hiding real data
5. **Strip sample `<csv>` blocks** from DML XML for production
6. **`___dmlEditorID___` and `___dmlEditorParent___`** required in every group/widget for the editor to work
7. **Image columns must be STRING type** containing URLs -- non-URL columns render as blank

## Card Creation API (All Types)

```
POST /api/content/v1/cards
```

```json
{
  "title": "<card title>",
  "type": "rooster",
  "metadata": {
    "dml": "<JSON-stringified DML object>",
    "dmlXml": ""
  },
  "subscriptions": []
}
```

**Tool shortcut:** `rooster_card_create(title, dml)` then `rooster_card_bind(card_id, title, dml)` after data binding.

## Data Binding Flow (All Types)

1. **Bind dataset:** `PUT /api/content/v1/cards/rooster/query`
2. **Update card with subscription:** `PUT /api/content/v1/cards/<cardId>`

The `rooster/query` endpoint has no card ID in the path -- it updates the most recently created rooster card. Always call it immediately after POST.

---

## 1. Banner

**templateType:** `banner`
**templateKey:** `banner-image-left`

### Top-Level DML JSON

```json
{
  "dml": "<xml string -- see DML XML below>",
  "templateType": "banner",
  "templateKey": "banner-image-left",
  "useSampleData": false,
  "params": {
    "groups": [],
    "rowHeight": 152,
    "itemPadding": 12,
    "gap": 8,
    "hiddenColumns": [],
    "dataSource": "<dataset-id>"
  }
}
```

### DML XML

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>

  <query id="data" data-source-id="@dataSource">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>column,
      @groups=>widgets=>hiddenColumns
    FROM @dataSource
    LIMIT 150;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <list source="#data" height="fill" width="fill" item="@row" row-height="@rowHeight" item-style="component_item">
      <hstack width="fill" height="fill" on-press="#on-component-clicked: @row">
        <spacer size="@itemPadding" />
        <vstack width="fill" height="fill">
          <spacer size="@itemPadding" />
            <hblock groups="@groups" row="@row" gap="@gap"/>
          <spacer size="@itemPadding" />
        </vstack>
        <spacer size="@itemPadding" />
      </hstack>
    </list>
  </vstack>
</dml>
```

### Widget Group Structure (`banner-image-left`)

```
groups[0]  vgroup  w=192 (fixed)  image-widget     <- thumbnail (left)
groups[1]  vgroup  w=fill (flex)  text-widget2     <- title + body (center)
groups[2]  vgroup  w=fixed        button-widget    <- action (right)
```

Uses `<hblock>` -- groups are arranged horizontally across the row (not `<vblock>` like Gallery).

### Column Binding

Banner uses `text-widget2` which has BOTH `richTextTitle` and `richText` in a single widget:
- **Title (richTextTitle):** Update `columns[0].name/id` AND `children[0].children[0].text` (static label)
- **Body (richText):** Update `columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName` (dynamic data binding)

### Gotchas

- `text-widget2` requires updating TWO column references per field (title + body)
- `hblock` layout -- groups are horizontal columns, not vertical stacks
- Group 2 (button) has no explicit `width` -- auto-sizes to button label
- Banner rows are full-width; no `widgetWidth` param (unlike Gallery)

---

## 2. FilterList

**templateType:** `filter-list`
**templateKey:** `filter-list-image`

### Top-Level DML JSON

```json
{
  "dml": "<xml string -- see DML XML below>",
  "templateType": "filter-list",
  "templateKey": "filter-list-image",
  "useSampleData": false,
  "params": {
    "sort": {
      "columns": [], "enabled": false, "menuLabel": "Sort",
      "name": "sort-widget", "style": "b2", "width": "fill",
      "___dmlEditorID___": "root/sort", "___dmlEditorParent___": "root"
    },
    "search": {
      "columns": [], "enabled": false, "name": "search-widget",
      "placeholder": "Search", "style": "b2", "width": "fill",
      "___dmlEditorID___": "root/search", "___dmlEditorParent___": "root"
    },
    "queryOverrides": {
      "filters": [], "orderBy": [],
      "search": { "columns": [], "searchString": "" }
    },
    "groups": [],
    "rowHeight": 85,
    "itemPadding": 0,
    "gap": 8,
    "listWidth": 400,
    "listGap": 16,
    "noResultsMessage": "No results",
    "hiddenColumns": [],
    "offset": 0,
    "limit": 100,
    "dataSource": "<dataset-id>"
  }
}
```

### DML XML

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@listWidth" type="number" i18n-label="common/listWidth" />
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <param name="@listGap" type="number" i18n-label="common/listGapSpacing"/>
  <param name="@sort" hidden="true" />
  <param name="@search" hidden="true" />
  <param name="@noResultsMessage" type="string" hidden=true label=" No Results Message"/>

  <query id="data" data-source-id="@dataSource" query-overrides="@queryOverrides">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>column,
      @hiddenColumns
    FROM @dataSource
    LIMIT 150;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <vstack width="@listWidth" align="end">
      <if is="@sort.enabled">
        <sort-widget source="@sort" config="@sort" menuLabel="Sort" width="@sort.width" query-overrides="@queryOverrides" />
      </if>
      <if is="@sort.enabled">
        <if is="@search.enabled">
          <spacer size="10"/>
        </if>
      </if>
      <if is="@search.enabled">
        <search-widget source="@search" config="@search" placeholder="Search" width="@search.width" query-overrides="@queryOverrides" />
      </if>
    </vstack>
    <list source="#data" item="@row" height="fill" width="@listWidth" gap="@listGap" direction="vertical" pagination="scroll" no-results-message="@noResultsMessage" item-style="component_item">
      <vstack width="fill" height="@rowHeight" on-press="#on-component-clicked: @row">
        <spacer size="@itemPadding"/>
        <hstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
            <hblock groups="@groups" row="@row" gap="@gap"/>
          <spacer size="@itemPadding"/>
        </hstack>
        <spacer size="@itemPadding"/>
      </vstack>
    </list>
  </vstack>
</dml>
```

### Widget Group Structure (`filter-list-image`)

```
groups[0]  vgroup  w=128 (fixed)  image-widget     <- thumbnail (fixed-width left panel)
groups[1]  vgroup  flex=1          title-widget     <- primary heading
                                   text-widget      <- secondary text / metadata
groups[2]  vgroup  fixed           button-widget    <- action button
```

Uses `<hblock>` -- groups sit as horizontal columns within each row.

### Column Binding

- **title-widget (richTextTitle):** Update `columns[0].name/id` AND `richTextDML.children[0].children[0].text` (static label with style `f4`)
- **text-widget (richText):** Update `columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName`

### Gotchas

- **`listWidth` is critical** -- unlike List (fill-width), FilterList renders in a fixed-pixel container. If your app layout allocates more space, increase `listWidth` to match.
- `itemPadding` defaults to `0` (not 12 like other types)
- `offset` and `limit` params control scroll pagination
- `direction="vertical"` and `pagination="scroll"` in the DML XML (unlike Gallery's `horizontal-wrap`)
- Button group has `"widthType": "fixed"` but no explicit pixel width -- auto-sizes to button label

---

## 3. Details

**templateType:** `details`
**templateKey:** `details-image-left`

### Top-Level DML JSON

```json
{
  "dml": "<xml string -- see DML XML below>",
  "templateType": "details",
  "templateKey": "details-image-left",
  "params": {
    "groups": [],
    "otherGroups": [],
    "rowHeight": 1000,
    "itemPadding": 12,
    "gap": 8,
    "hiddenColumns": [],
    "dataSource": "<dataset-id>"
  }
}
```

### DML XML

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@otherGroups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <param name="@dateColumn" type="datecolumn" label="Date Field" data-source="@dataSource"/>
  <param name="@queryOverrides" type="query-overrides"/>
  <param name="@hiddenColumns" type="column" list="true" hidden="true" />
  <query id="data" data-source-id="@dataSource" date-column="@dateColumn" query-overrides="@queryOverrides">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>richTextSmImg=>columns,
      @groups=>widgets=>column,
      @otherGroups=>widgets=>richText=>columns,
      @otherGroups=>widgets=>richTextTitle=>columns,
      @otherGroups=>widgets=>richTextSmImg=>columns,
      @otherGroups=>widgets=>column,
      @hiddenColumns
    FROM @dataSource
    LIMIT 100;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <list source="#data" item="@row" height="fill" width="fill" gap="32" direction="horizontal-wrap" item-style="component_item">
      <vstack height="@rowHeight" width="fill" on-press="#on-component-clicked: @row">
        <hstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
          <hstack width="fill" height="fill">
            <vstack width="fill" height="fill" flex="1">
              <spacer size="@itemPadding"/>
                <vblock groups="@groups" row="@row" gap="@gap"/>
              <spacer size="@itemPadding"/>
            </vstack>
            <spacer size="48"/>
            <vstack width="fill" height="fill" flex="1">
              <spacer size="@itemPadding"/>
                <vblock groups="@otherGroups" row="@row" gap="@gap"/>
              <spacer size="@itemPadding"/>
            </vstack>
          </hstack>
          <spacer size="@itemPadding"/>
        </hstack>
      </vstack>
    </list>
  </vstack>
</dml>
```

### Widget Group Structure (`details-image-left`)

**Left Panel (`params.groups`):**
```
groups[0]  hgroup  h=500 (fixed)  image-widget     <- hero image
groups[1]  hgroup  h=50  (fixed)  title-widget     <- primary heading
groups[2]  hgroup  flex=1          text-widget      <- primary body text
groups[3]  hgroup  flex=1          text-widget      <- secondary body text
```

**Right Panel (`params.otherGroups`):**
```
otherGroups[0]  hgroup  h=60  (fixed)  pill-list-widget               <- tag/badge row
otherGroups[1]  hgroup  flex=1          text-widget + sm-image-text    <- labeled field + avatar
otherGroups[2]  hgroup  flex=1          text-widget + sm-image-text    <- labeled field + avatar
otherGroups[3]  hgroup  flex=1          text-widget + sm-image-text    <- labeled field + avatar
otherGroups[4-8] hgroup flex=1          text-widget + text-widget      <- two stats side-by-side
```

Two `<vblock>` elements side-by-side (50/50 split with 48px gutter).

### Column Binding

Same as Gallery -- `title-widget` uses `richTextTitle`, `text-widget` uses `richText`. Both require updating `columns[0].name/id` AND the `propertyName` in `richTextDML`.

### Gotchas

- **Two group arrays required:** `params.groups` (left panel) AND `params.otherGroups` (right panel). Omitting either causes half the card to render blank.
- **Missing `<query>` = blank white card.** The `<list source="#data">` requires `<query id="data">` in the XML even though the subscription handles actual data binding.
- `rowHeight: 1000` is intentionally large -- Details fills the full page height
- The `<query>` column selectors must cover BOTH `@groups` AND `@otherGroups`
- If no image URL column exists, replace `groups[0]` with a `title-widget` and reduce `rowHeight` to 600

---

## 4. Gallery

**templateType:** `gallery`
**templateKey:** `gallery-image-button` | `gallery-full-image` | `gallery-circle-images` | `gallery-no-image`

### Top-Level DML JSON

```json
{
  "dml": "<xml string -- see DML XML below>",
  "templateType": "gallery",
  "templateKey": "gallery-image-button",
  "params": {
    "widgetWidth": 280,
    "rowHeight": 400,
    "listDirection": "horizontal-wrap",
    "itemPadding": 12,
    "listGap": 32,
    "gap": 8,
    "noResultsMessage": "No results",
    "hiddenColumns": [],
    "sort": { "columns": [], "enabled": false },
    "search": { "columns": [], "enabled": false },
    "queryOverrides": { "filters": [], "orderBy": [], "search": { "columns": [], "searchString": "" } },
    "groups": [],
    "___dmlEditorID___": "root",
    "dataSource": "<dataset-id>"
  }
}
```

### DML XML

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@widgetWidth" type="number" label="Card Width"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@listDirection" type="string" i18n-label="common/listDirection" />
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <param name="@listGap" type="number" i18n-label="common/listGapSpacing"/>
  <param name="@sort" hidden="true" />
  <param name="@search" hidden="true" />
  <param name="@noResultsMessage" type="string" hidden=true label=" No Results Message"/>

  <param name="@dateColumn" type="datecolumn" label="Date Field" data-source="@dataSource"/>
  <param name="@queryOverrides" type="query-overrides"/>
  <param name="@hiddenColumns" type="column" list="true" hidden="true" />
  <query id="data" data-source-id="@dataSource" date-column="@dateColumn" query-overrides="@queryOverrides">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>richTextSmImg=>columns,
      @groups=>widgets=>richTextDescription=>columns,
      @groups=>widgets=>column,
      @groups=>widgets=>hiddenColumns,
      @hiddenColumns
    FROM @dataSource
    LIMIT 150;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <hstack width="fill" align="end">
      <if is="@sort.enabled">
        <sort-widget source="@sort" config="@sort" menuLabel="Sort" width="@sort.width" query-overrides="@queryOverrides" />
      </if>
      <if is="@sort.enabled">
        <if is="@search.enabled">
          <spacer size="10"/>
        </if>
      </if>
      <if is="@search.enabled">
        <search-widget source="@search" config="@search" placeholder="Search" width="@search.width" query-overrides="@queryOverrides" />
      </if>
    </hstack>
    <list source="#data" item="@row" height="fill" width="fill" gap="@listGap" direction="@listDirection" align="center" overflow="scroll" no-results-message="@noResultsMessage" item-style="component_item">
      <vstack height="@rowHeight" width="@widgetWidth" on-press="#on-component-clicked: @row">
        <hstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
          <vstack width="fill" height="fill">
            <spacer size="@itemPadding"/>
            <vblock groups="@groups" row="@row" gap="@gap"/>
            <spacer size="@itemPadding"/>
          </vstack>
          <spacer size="@itemPadding"/>
        </hstack>
      </vstack>
    </list>
  </vstack>
</dml>
```

### Widget Group Structure (`gallery-image-button`)

```
groups[0]  hgroup  h=150          image-widget          <- hero image (rounded, rect)
groups[1]  hgroup  h=35           title-widget           <- primary heading
groups[2]  hgroup  flex=1         text-widget            <- body text
groups[3]  hgroup  h=60           sm-image-text-widget   <- avatar + metadata
groups[4]  hgroup  h=44           button-widget          <- action button
```

Uses `<vblock>` -- groups stack vertically inside each card (opposite of Banner's `<hblock>`).

### Template Variants

| templateKey | Image Style | Group Count | Default Dimensions |
|---|---|---|---|
| `gallery-image-button` | Rectangular hero (top, rounded) | 5 | 280x400 |
| `gallery-full-image` | Full-bleed background (uses `topGroup`) | 4 content + topGroup | 280x400 |
| `gallery-circle-images` | Circular avatar (80x80) | 6 | 280x390 |
| `gallery-no-image` | No image | 5 | 280x300 |

### Column Binding

- **title-widget (richTextTitle):** Update `columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName`
- **text-widget (richText):** Update `columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName`
- **image-widget:** Update `column.name` and `column.id` to the dataset column containing image URLs

### Gotchas

- `gallery-full-image` uses `params.topGroup` (not `groups[0]`) for the background image
- `sm-image-text-widget` commonly reuses the same image column as the hero image
- `gallery-no-image` is the right starting point when no image column exists -- don't use a placeholder
- Default `widgetWidth`/`rowHeight` rarely match your content -- tune to actual image dimensions
- Gallery groups use `hgroup` (not `vgroup` like FilterList/Banner)

---

## 5. List

**templateType:** `list`
**templateKey:** `list-title-description` | `list-with-avatar-tags-buttons` | `list-rectangle-image` | `list-square-image-tags`

### Top-Level DML JSON

```json
{
  "dml": "<xml string -- same structure as Gallery XML but with vertical list rendering>",
  "templateType": "list",
  "templateKey": "list-title-description",
  "params": {
    "sort": { "columns": [], "enabled": false },
    "search": { "columns": [], "enabled": false },
    "queryOverrides": { "filters": [], "orderBy": [] },
    "groups": [],
    "rowHeight": 85,
    "itemPadding": 12,
    "gap": 8,
    "listGap": 16,
    "noResultsMessage": "No results",
    "hiddenColumns": [],
    "dataSource": "<dataset-id>"
  }
}
```

### DML XML

The List component uses the same XML structure as Gallery. The key difference is in the `params` -- no `widgetWidth` (rows are full-width) and `listDirection` is not explicitly set (defaults to vertical).

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@listWidth" type="number" i18n-label="common/listWidth"/>
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <param name="@listGap" type="number" i18n-label="common/listGapSpacing"/>
  <param name="@sort" hidden="true" />
  <param name="@search" hidden="true" />
  <param name="@noResultsMessage" type="string" hidden=true label=" No Results Message"/>

  <param name="@dateColumn" type="datecolumn" label="Date Field" data-source="@dataSource"/>
  <param name="@queryOverrides" type="query-overrides"/>
  <param name="@hiddenColumns" type="column" list="true" hidden="true" />
  <query id="data" data-source-id="@dataSource" date-column="@dateColumn" query-overrides="@queryOverrides">
    SELECT
      @groups=>widgets=>richText=>columns,
      @groups=>widgets=>richTextTitle=>columns,
      @groups=>widgets=>richTextSmImg=>columns,
      @groups=>widgets=>richTextDescription=>columns,
      @groups=>widgets=>column,
      @groups=>widgets=>hiddenColumns,
      @hiddenColumns
    FROM @dataSource
    LIMIT 150;
  </query>

  <function id="on-component-clicked" input="@row">
    <forward-action payload="@row"/>
  </function>

  <vstack height="fill" width="fill">
    <hstack width="fill" align="end">
      <if is="@sort.enabled">
        <sort-widget source="@sort" config="@sort" menuLabel="Sort" width="@sort.width" query-overrides="@queryOverrides" />
      </if>
      <if is="@sort.enabled">
        <if is="@search.enabled">
          <spacer size="10"/>
        </if>
      </if>
      <if is="@search.enabled">
        <search-widget source="@search" config="@search" placeholder="Search" width="@search.width" query-overrides="@queryOverrides" />
      </if>
    </hstack>
    <list source="#data" item="@row" height="fill" width="fill" gap="@listGap" direction="vertical" overflow="scroll" no-results-message="@noResultsMessage" item-style="component_item">
      <vstack width="fill" height="@rowHeight" on-press="#on-component-clicked: @row">
        <hstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
          <vstack width="fill" height="fill">
            <spacer size="@itemPadding"/>
            <hblock groups="@groups" row="@row" gap="@gap"/>
            <spacer size="@itemPadding"/>
          </vstack>
          <spacer size="@itemPadding"/>
        </hstack>
      </vstack>
    </list>
  </vstack>
</dml>
```

### Widget Group Structure

**`list-title-description` (simple text rows):**
```
groups[0]  title-widget           <- primary heading
groups[1]  text-widget            <- body text
groups[2]  text-widget            <- secondary text
```

**`list-with-avatar-tags-buttons` (rich rows):**
```
groups[0]  image-widget (circle)  <- avatar
groups[1]  title-widget           <- primary heading
groups[2]  text-widget            <- body text
groups[3]  pill-list-widget       <- tag pills
groups[4]  button-widget          <- action button
```

**`list-rectangle-image`:**
```
groups[0]  image-widget (rect)    <- rectangle thumbnail
groups[1]  title-widget           <- primary heading
groups[2]  text-widget            <- body text
groups[3]  button-widget          <- action button
```

**`list-square-image-tags`:**
```
groups[0]  image-widget (square)  <- square thumbnail
groups[1]  title-widget           <- primary heading
groups[2]  text-widget            <- body text
groups[3]  pill-list-widget       <- tag pills
```

### Column Binding

Same as Gallery -- `title-widget` uses `richTextTitle`, `text-widget` uses `richText`.

### Gotchas

- `rooster/query` has no card ID in the path -- call it immediately after creating each card
- `templateType` and `templateKey` are REQUIRED in the DML JSON -- without them the app 403s on load
- The full DML JSON is 30-60KB when serialized -- always source from a recording of a working card
- Button widgets can be nested deep in `params.groups[n].widgets` -- filter ALL button-widgets from every group
- `editInAppViewer` must be `false` in the layout content array -- `true` adds a broken "Edit" button
- Row clicks and button widgets both require a navigation target configured -- strip `on-press` and `forward-action` if no drill-through page exists
