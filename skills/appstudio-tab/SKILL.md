---
name: appstudio-tab
tier: 0
description: "Domo App Studio Tab component — TABS/TAB_BAR/TAB_CONTENT types, nested card placement, layout integration, compact/standard templates, and full API payload reference. Trigger with 'tab component', 'app studio tab', 'tab container', 'tabbed layout'."
maturity: alpha
deprecated: true
deprecation_note: "Folded into appstudio-page-build/references/widgets/tab.md"
audience: [code]
---


# App Studio Tab Component

## CLI Quick Start

Tab components are configured through the layout API. Use `community-domo-cli` to get and set layouts with tab structures:

```bash
# 1. Get the current layout for the page
community-domo-cli --output json app-studio layout-get $APP_ID $VIEW_ID > layout.json

# 2. Modify layout.json to add TABS/TAB_CONTENT/TAB_BAR in template
#    and TABS/TAB_CONTENT in content (see structure below)
# ... build tab layout ...

# 3. Apply layout — CLI handles write lock automatically
community-domo-cli --output json -y app-studio layout-set $APP_ID $VIEW_ID \
  --body-file layout_modified.json
```

For the full CLI workflow (app creation, card operations, layout operations), see `basic-app-studio`.

---

## Overview

Tab components let you organize cards into labelled tab panels within a single layout section. The tab strip (TAB_BAR) appears at the top; each TAB_CONTENT panel holds its own card grid.

---

## Content Array Types

The `content` array of a layout PUT uses three new types for tabs:

| Type | In content array? | Has `text`? | Has `cardId`? | Purpose |
|---|---|---|---|---|
| `TABS` | yes | no | no | Outer tab container |
| `TAB_CONTENT` | yes | **yes** (tab label) | no | One tab panel |
| `TAB_BAR` | **NO** | no | no | Tab strip — template only |
| `CARD` | yes | no | yes | Card inside a tab panel |

> **Critical:** `TAB_BAR` never appears in the `content` array — only in the template tree as a child of `TABS`.

---

## Content Item Shapes

### TABS container

```json
{
  "type": "TABS",
  "contentKey": 1,
  "acceptDateFilter": true,
  "acceptFilters": true,
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
  "background": null,
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
  "acceptFilters": true,
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
  "background": null,
  "editInAppViewer": true,
  "compactInteractionDefault": true
}
```

### CARD inside a tab (same as regular cards)

```json
{
  "type": "CARD",
  "contentKey": 8,
  "cardId": 4068294,
  "cardUrn": "4068294",
  "cardType": "kpi",
  "acceptDateFilter": true,
  "acceptFilters": true,
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
  "background": null,
  "editInAppViewer": true,
  "compactInteractionDefault": true
}
```

---

## Template Structure

Templates use **nested `children`** arrays — not flat positioning like regular card layouts.

### Standard template (60-col grid)

```json
{
  "type": "TABS",
  "contentKey": 1,
  "x": 0, "y": 0, "width": 60, "height": 66,
  "virtual": false, "virtualAppendix": false,
  "children": [
    {
      "type": "TAB_BAR",
      "contentKey": 2,
      "x": 0, "y": 0, "width": 60, "height": 5,
      "virtual": false, "virtualAppendix": false
    },
    {
      "type": "TAB_CONTENT",
      "contentKey": 4,
      "x": 0, "y": 5, "width": 60, "height": 61,
      "virtual": false, "virtualAppendix": false,
      "children": [
        { "type": "CARD", "contentKey": 8,  "x": 0,  "y": 0,  "width": 30, "height": 30, "virtual": false, "virtualAppendix": false },
        { "type": "CARD", "contentKey": 9,  "x": 30, "y": 0,  "width": 30, "height": 30, "virtual": false, "virtualAppendix": false },
        { "type": "CARD", "contentKey": 10, "x": 0,  "y": 30, "width": 30, "height": 31, "virtual": false, "virtualAppendix": false },
        { "type": "CARD", "contentKey": 11, "x": 30, "y": 30, "width": 30, "height": 31, "virtual": false, "virtualAppendix": false }
      ]
    },
    {
      "type": "TAB_CONTENT",
      "contentKey": 5,
      "x": 0, "y": 5, "width": 60, "height": 61,
      "virtual": false, "virtualAppendix": false,
      "children": []
    },
    {
      "type": "TAB_CONTENT",
      "contentKey": 6,
      "x": 0, "y": 5, "width": 60, "height": 61,
      "virtual": false, "virtualAppendix": false,
      "children": []
    }
  ]
}
```

Followed by a PAGE_BREAK at y = TABS height:

```json
{ "type": "PAGE_BREAK", "contentKey": 14, "x": 0, "y": 66, "width": 60, "height": 0, "virtual": false, "virtualAppendix": false }
```

### Compact template (12-col grid)

Same nested structure, different dimensions:

| Element | width | height | y |
|---|---|---|---|
| TABS container | 12 | 26 | 0 |
| TAB_BAR | 12 | 2 | 0 |
| TAB_CONTENT | 12 | 24 | 2 |
| Cards (each) | 12 | 6 | stacked from 0 |
| PAGE_BREAK | 12 | 0 | 26 |

Cards in compact stacked vertically (single column), y incremented by 6 each.

---

## Key Coordinate Rules

1. **TAB_BAR height**: standard=5, compact=2
2. **TAB_CONTENT y offset** = TAB_BAR height (cards start at y=0 within their TAB_CONTENT)
3. **TAB_CONTENT height** = TABS.height - TAB_BAR.height
4. **TABS total height** = TAB_BAR.height + content_area_height
5. **All TAB_CONTENT siblings share the same x, y, width, height** — only the active one is shown
6. **Cards inside TAB_CONTENT are positioned relative to the TAB_CONTENT** (not to the page). Their x,y start at 0,0.
7. **PAGE_BREAK y** = TABS.height (placed after the entire TABS block)

---

## contentKey Assignment Convention

```
1  = TABS container      (content + template)
2  = TAB_BAR             (template ONLY — never in content array)
3  = (reserved / skipped)
4  = TAB_CONTENT[0]      (content + template)
5  = TAB_CONTENT[1]      (content + template)
6  = TAB_CONTENT[2]      (content + template)
...= more tabs if needed
8  = first card          (content + template children)
9  = second card
...
14 = PAGE_BREAK          (template only — not in content array)
```

---

## Full App Creation Flow (8 steps)

```
POST /api/content/v1/dataapps          -> appId, landingViewId, layoutId
PUT  /api/content/v1/dataapps/:id/persistSettings
PUT  /api/content/v1/dataapps/:id
PUT  /api/content/v1/dataapps/:id/navigation/reorder
PUT  /api/content/v1/cards/bulk/pages  { cardIds, destinationPageIds }
PUT  /api/content/v4/pages/layouts/:layoutId/writelock
PUT  /api/content/v4/pages/layouts/:layoutId   <- tab layout body
DELETE /api/content/v4/pages/layouts/:layoutId/writelock
```

No separate card-creation step needed — assign existing cards from the instance.

---

## Layout PUT Body (top level)

```json
{
  "layoutId": 32377595,
  "pageUrn": "1076322165",
  "printFriendly": false,
  "background": null,
  "isDynamic": true,
  "hasPageBreaks": false,
  "style": null,
  "content": [ ... ],
  "standard": {
    "aspectRatio": 1.67,
    "width": 60,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "STANDARD",
    "template": [ ... ]
  },
  "compact": {
    "aspectRatio": 1,
    "width": 12,
    "frameMargin": 4,
    "framePadding": 8,
    "type": "COMPACT",
    "template": [ ... ]
  }
}
```

---

## Minimal 3-Tab Example (2 cards in Tab 1, empty Tab 2 & 3)

### Content array

```typescript
const content = [
  tabsContent(1),
  tabContent(4, 'Overview'),
  tabContent(5, 'Details'),
  tabContent(6, 'Settings'),
  cardContent(8, CARD_A),
  cardContent(9, CARD_B),
];
```

### Standard template

```typescript
{
  type: 'TABS', contentKey: 1, x: 0, y: 0, width: 60, height: 35,
  virtual: false, virtualAppendix: false,
  children: [
    { type: 'TAB_BAR', contentKey: 2, x: 0, y: 0, width: 60, height: 5, virtual: false, virtualAppendix: false },
    { type: 'TAB_CONTENT', contentKey: 4, x: 0, y: 5, width: 60, height: 30, virtual: false, virtualAppendix: false,
      children: [
        { type: 'CARD', contentKey: 8, x: 0,  y: 0, width: 30, height: 30, virtual: false, virtualAppendix: false },
        { type: 'CARD', contentKey: 9, x: 30, y: 0, width: 30, height: 30, virtual: false, virtualAppendix: false },
      ]
    },
    { type: 'TAB_CONTENT', contentKey: 5, x: 0, y: 5, width: 60, height: 30, virtual: false, virtualAppendix: false, children: [] },
    { type: 'TAB_CONTENT', contentKey: 6, x: 0, y: 5, width: 60, height: 30, virtual: false, virtualAppendix: false, children: [] },
  ]
}
```

---

## Builder Functions

```typescript
function tabsContent(contentKey: number) {
  return {
    type: 'TABS', contentKey,
    acceptDateFilter: true, acceptFilters: true, acceptSegments: true,
    fitToFrame: false, hasSummary: false, hideBorder: false,
    hideFooter: true, hideMargins: false, hideSummary: false,
    hideTimeframe: false, hideTitle: false, hideDescription: true,
    hideWrench: false, summaryNumberOnly: false,
    background: null, editInAppViewer: true, compactInteractionDefault: true,
  };
}

function tabContent(contentKey: number, text: string) {
  return {
    type: 'TAB_CONTENT', contentKey, text,
    acceptDateFilter: true, acceptFilters: true, acceptSegments: true,
    fitToFrame: false, hasSummary: false, hideBorder: false,
    hideFooter: true, hideMargins: false, hideSummary: false,
    hideTimeframe: false, hideTitle: false, hideDescription: true,
    hideWrench: false, summaryNumberOnly: false,
    background: null, editInAppViewer: true, compactInteractionDefault: true,
  };
}

function cardContent(contentKey: number, cardId: number) {
  return {
    type: 'CARD', contentKey, cardId, cardUrn: String(cardId), cardType: 'kpi',
    acceptDateFilter: true, acceptFilters: true, acceptSegments: true,
    fitToFrame: false, hasSummary: false, hideBorder: false,
    hideFooter: true, hideMargins: false, hideSummary: false,
    hideTimeframe: false, hideTitle: false, hideDescription: true,
    hideWrench: false, summaryNumberOnly: false,
    background: null, editInAppViewer: true, compactInteractionDefault: true,
  };
}

// Standard TABS template node
function tabsTemplate(contentKey: number, height: number, children: any[]) {
  return { type: 'TABS', contentKey, x: 0, y: 0, width: 60, height, virtual: false, virtualAppendix: false, children };
}

// Standard TAB_BAR (template only, contentKey=2)
function tabBarTemplate(contentKey: number) {
  return { type: 'TAB_BAR', contentKey, x: 0, y: 0, width: 60, height: 5, virtual: false, virtualAppendix: false };
}

// Standard TAB_CONTENT template node
function tabContentTemplate(contentKey: number, contentHeight: number, cards: any[]) {
  return { type: 'TAB_CONTENT', contentKey, x: 0, y: 5, width: 60, height: contentHeight, virtual: false, virtualAppendix: false, children: cards };
}

// Card inside a TAB_CONTENT (x,y relative to TAB_CONTENT)
function cardTemplate(contentKey: number, x: number, y: number, w: number, h: number) {
  return { type: 'CARD', contentKey, x, y, width: w, height: h, virtual: false, virtualAppendix: false };
}
```

---

## Common Mistakes

- **Including TAB_BAR in content array** — don't. It only exists in the template tree.
- **Using flat (non-nested) template for cards inside tabs** — cards must be `children` of their TAB_CONTENT, not siblings at the root level.
- **Setting `hasPageBreaks: true`** when tabs span the full height — leave it `false`.
- **Wrong card y positions** — cards inside a TAB_CONTENT start at y=0 (relative to the panel), not y=tabBarHeight.
- **TAB_CONTENT siblings at different y values** — they must all share the same y (= TAB_BAR height), since only one is shown at a time.
