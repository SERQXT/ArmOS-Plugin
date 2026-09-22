# Banner Widget Reference

A Banner component is a `type: "rooster"` card with `templateType: "banner"` and `templateKey: "banner-image-left"`. Groups are arranged **horizontally** via `<hblock>` — unlike Gallery (`<vblock>`). Each row spans the full card width; rows stack vertically.

## Top-level DML params

```json
{
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

| Field | Notes |
|---|---|
| `rowHeight` | Height of each banner row in px. Default 152. |
| `itemPadding` | Inner padding of each row in px. Default 12. |
| `gap` | Gap between widget groups within a row in px. Default 8. |

Banner has a simpler params set than Gallery — no `widgetWidth`, `listDirection`, `listGap`, `sort`, or `search`.

## Template: `banner-image-left`

```
groups[0]  vgroup  widthType: fixed  w=192  image-widget    <- thumbnail (left)
groups[1]  vgroup  widthType: flex   flex=1 text-widget2    <- title + body (center)
groups[2]  vgroup  widthType: fixed         button-widget   <- action (right)
```

## Widget shapes

### `image-widget`

```json
{
  "name": "image-widget",
  "fit": "fillSpace",
  "sourceType": "dataColumn",
  "borderRadius": 8,
  "height": "fill",
  "width": "fill",
  "heightType": "flex",
  "column": {
    "type": "STRING",
    "name": "Image URL",
    "id": "Image URL",
    "dataType": "string"
  }
}
```

### `text-widget2` (dual-field: title + body)

Unique to Banner. Has both `richTextTitle` (static label heading) and `richText` (VARIABLE binding for body value) in a single widget.

- `richTextTitle`: update `columns[0].name/id` AND the inner `text` node (static label).
- `richText`: update `columns[0].name/id` AND `richTextDML.children[0].children[0].source.property.propertyName`.

### `button-widget`

Same `__dmlActions` shape as all rooster components. See `appstudio-action-button` for full action type reference.

## DML XML

```xml
<dml version="1">
  <param name="@groups" type="component" list="true" min-length="3" max-length="10" data-source="@dataSource"/>
  <param name="@dataSource" type="datasource" label="DataSet"/>
  <param name="@rowHeight" type="number" label="Row Height"/>
  <param name="@gap" type="number" label="Widget gap"/>
  <param name="@itemPadding" type="number" label="Item inner padding"/>
  <query id="data" data-source-id="@dataSource">
    SELECT @groups=>widgets=>richText=>columns, @groups=>widgets=>richTextTitle=>columns,
           @groups=>widgets=>column, @groups=>widgets=>hiddenColumns FROM @dataSource LIMIT 150;
  </query>
  <function id="on-component-clicked" input="@row"><forward-action payload="@row"/></function>
  <vstack height="fill" width="fill">
    <list source="#data" height="fill" width="fill" item="@row" row-height="@rowHeight" item-style="component_item">
      <hstack width="fill" height="fill" on-press="#on-component-clicked: @row">
        <spacer size="@itemPadding"/>
        <vstack width="fill" height="fill">
          <spacer size="@itemPadding"/>
          <hblock groups="@groups" row="@row" gap="@gap"/>
          <spacer size="@itemPadding"/>
        </vstack>
        <spacer size="@itemPadding"/>
      </hstack>
    </list>
  </vstack>
</dml>
```

Key: `<hblock>` (not `<vblock>`) makes this a horizontal column layout per row.

## Gotchas

- `useSampleData: false` required for real data — set `true` only for initial preview, remove/false after binding.
- `text-widget2` requires updating TWO column references per field (title and body).
- Image column must be STRING type with URL values.
- Group 2 (button) has no explicit pixel `width` — auto-sizes to button label.
