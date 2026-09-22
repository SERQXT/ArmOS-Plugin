# Tab Widget Reference

Tab components organize cards into labelled tab panels within a layout section. The tab strip (`TAB_BAR`) sits at the top; each `TAB_CONTENT` panel holds its own card grid. All tab structure lives in the `PUT /api/content/v4/pages/layouts/{layoutId}` body.

## Content array types

| Type | In content[]? | Has `text`? | Has `cardId`? | Purpose |
|---|---|---|---|---|
| `TABS` | yes | no | no | Outer tab container |
| `TAB_CONTENT` | yes | yes (tab label) | no | One tab panel |
| `TAB_BAR` | NO | no | no | Tab strip — template only |
| `CARD` | yes | no | yes | Card inside a tab panel |

**Critical:** `TAB_BAR` never appears in the `content` array — only in the template tree as a child of `TABS`.

## Content item shapes

### TABS container

```json
{
  "type": "TABS",
  "contentKey": 1,
  "acceptDateFilter": true,
  "acceptFilters": true,
  "acceptSegments": true,
  "hideFooter": true,
  "hideDescription": true,
  "editInAppViewer": true,
  "compactInteractionDefault": true
}
```

### TAB_CONTENT (one per tab)

```json
{
  "type": "TAB_CONTENT",
  "contentKey": 4,
  "text": "Tab 1",
  "acceptDateFilter": true,
  "editInAppViewer": true,
  "compactInteractionDefault": true
}
```

### CARD inside tab

Same shape as regular CARD content items, with `cardId` and `cardType`.

## Template structure (nested)

```json
{
  "type": "TABS",
  "contentKey": 1,
  "x": 0, "y": 0, "width": 60, "height": 66,
  "virtual": false, "virtualAppendix": false,
  "children": [
    { "type": "TAB_BAR", "contentKey": 2, "x": 0, "y": 0, "width": 60, "height": 5, "virtual": false, "virtualAppendix": false },
    {
      "type": "TAB_CONTENT",
      "contentKey": 4,
      "x": 0, "y": 5, "width": 60, "height": 61,
      "virtual": false, "virtualAppendix": false,
      "children": [
        { "type": "CARD", "contentKey": 8, "x": 0, "y": 0, "width": 30, "height": 30, "virtual": false, "virtualAppendix": false }
      ]
    },
    { "type": "TAB_CONTENT", "contentKey": 5, "x": 0, "y": 5, "width": 60, "height": 61, "virtual": false, "virtualAppendix": false, "children": [] },
    { "type": "TAB_CONTENT", "contentKey": 6, "x": 0, "y": 5, "width": 60, "height": 61, "virtual": false, "virtualAppendix": false, "children": [] }
  ]
}
```

## Coordinate rules

- `TAB_BAR` height: standard=5, compact=2
- `TAB_CONTENT` y offset = TAB_BAR height
- `TAB_CONTENT` height = TABS.height − TAB_BAR.height
- All `TAB_CONTENT` siblings share the same x, y, width, height — only the active one shows
- Cards inside `TAB_CONTENT` are positioned relative to the `TAB_CONTENT` (not the page), starting at x=0, y=0
- `PAGE_BREAK` y = TABS.height

## contentKey convention

```
1  = TABS container
2  = TAB_BAR (template only)
3  = (reserved)
4  = TAB_CONTENT[0]
5  = TAB_CONTENT[1]
6  = TAB_CONTENT[2]
8+ = cards
14 = PAGE_BREAK (template only)
```

## Compact template dimensions

| Element | width | height | y |
|---|---|---|---|
| TABS | 12 | 26 | 0 |
| TAB_BAR | 12 | 2 | 0 |
| TAB_CONTENT | 12 | 24 | 2 |
| Cards | 12 | 6 | stacked |
| PAGE_BREAK | 12 | 0 | 26 |

## Common mistakes

- Including `TAB_BAR` in the content array — it belongs only in the template tree.
- Using flat (non-nested) template for cards inside tabs — cards must be `children` of their `TAB_CONTENT`.
- Setting `hasPageBreaks: true` when tabs span full height — leave it `false`.
- Wrong card y positions — cards inside `TAB_CONTENT` start at y=0 (relative), not y=tabBarHeight.
- `TAB_CONTENT` siblings at different y values — they must all share the same y.
