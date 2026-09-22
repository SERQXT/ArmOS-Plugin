---
name: advanced-app-studio
tier: 0
description: "Advanced Domo App Studio reference — navigation icons, pro-code card instances, custom app icons, UX gotchas, and component skill directory. Trigger with 'app studio navigation', 'app studio icons', 'pro-code card', 'app studio advanced'."
maturity: alpha
audience: [code]
---


# Domo App Studio — Advanced (CLI Edition)

This skill covers advanced App Studio topics NOT handled by the component-specific skills:
navigation configuration, pro-code card instances, custom app icons, and UX gotchas/debugging.

For authentication and CLI conventions, see `basic-app-studio`.

> **Status**: Reverse-engineered from live testing, March 2026
> **Verified against**: `aeroateam-partner.domo.com` (app `453445400`), `csibas.domo.com` (apps `1400847176`, `2061524048`), `modocorp.domo.com`

---

## Component Skills

For detailed API payloads and workflows, use the component-specific skill:

| Need | Skill |
|---|---|
| KPI chart cards (207 chart types) | `card-creation` |
| Banner component | `appstudio-banner` |
| Details / record view | `appstudio-details` |
| Filter list | `appstudio-filter-list` |
| Gallery / card grid | `appstudio-gallery` |
| List component | `appstudio-list` |
| Action buttons | `appstudio-action-button` |
| Tab container | `appstudio-tab` |
| Pages & navigation | `appstudio-pages` |
| Layout grid system | `appstudio-layouts` |
| Header / text divider | `appstudio-header` |
| Static image | `appstudio-image` |
| Dashboard design rules | `appstudio-dashboard-design` |
| Themes & colors | `domo-app-theme` |
| Beast modes / calculated fields | `beast-mode-creation` |
| Card variables & controls | `variable-creation` |
| Pro-code custom apps in App Studio | `app-studio-pro-code` |

---

## Reusable Helper Scripts

Use these paired helpers to avoid rewriting card/layout boilerplate every run:

- `references/card_templates.py` — native card body builders:
  - hero cards (`badge_pop_multi_value` with `main` + `time_period` subscriptions)
  - filter cards (`badge_dropdown_selector`, date filter selectors)
  - chart cards (`badge_` chart family; uses `AVG` not `AVERAGE`)
- `references/layout_assembler.py` — composable layout assembly:
  - card/content key tracking
  - standard + compact template generation
  - template-only entry preservation
  - finalize safety checks before `layout-set`

Use these helpers in automation flows before issuing `cards create` and `app-studio layout-set`.

---

## Navigation

Navigation cannot be updated via `app-studio update` — changes to `navigations[]` in the PUT
body are silently ignored. Use the `pages` CLI commands below.

> **Endpoint note**: The CLI `pages` commands use global Domo page navigation endpoints. For App Studio apps they are useful for **reading** nav state and **reordering** page order only. They do **not** set nav icons or icon labels for App Studio (see **Navigation Icons**).

### Read Navigation

```bash
community-domo-cli --output json pages nav-get > nav.json
```

Returns all navigation entries across the instance. Filter to your app's views by matching
`entityId` values against your `views[]` from `app-studio get`.

Entity types: `HOME`, `VIEW`, `AI_ASSISTANT`, `CONTROLS`, `DISTRIBUTE`, `MORE`

**CRITICAL**: The `navigations` array is separate from the `views` array. Renaming a view title via the app PUT does NOT rename the nav label. Always GET the full navigation first, modify only the fields you need, and PUT the complete array back — missing system items causes `400`.

### Reorder Pages

```bash
# Build ordered comma-separated page ID string, then:
community-domo-cli --output json -y pages nav-reorder \
  --body '{"pageOrderMap": {"0": "VIEW_ID_1,VIEW_ID_2,VIEW_ID_3"}}'
```

The `pageOrderMap` key `"0"` is the root level. Value is a comma-separated string of page/view
IDs in the desired order. Send only the IDs you want reordered.

**Icons:** `nav-reorder` does **not** assign or change left-nav page icons — only sort order. Set icons in the App Studio UI (see **Navigation Icons**).

### Navigation Icons

> **Programmatic icon updates are not supported.** Navigation icon updates are **not** available through current `community-domo-cli` commands. There is no CLI subcommand and no REST path exposed via the CLI that reliably sets App Studio left-nav icons. Attempted routes (`PUT /content/v1/dataapps/{id}/navigations`, full app `PUT` with `navigations` embedded, `PUT /content/v1/pages/{id}` with an icon body) have been observed to **404**, **405**, or **silently ignore** icon fields.
>
> **Set icons in the UI:** open the app -> left nav -> hover a page -> click the icon to change it.
>
> The name catalog below remains valid **as a picker reference** for icon values you choose in the UI.

**HOME icon (when editing in UI):** use `home` for the HOME item.

**WARNING:** Google Material icon names (`monetization_on`, `trending_up`, `inventory_2`, `assignment_return`) do **not** render in Domo's left nav. Domo uses its own icon set. **Only** use names from the catalog below. Wrong names show as blank space.

#### Recommended icons by page type


| Page type                | Recommended icons (pick one)                                                          |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Overview / Dashboard     | `analytics`, `pop-chart`, `chart-bar-vertical`, `select-chart`, `badge-layout-8`      |
| Production / Operations  | `gauge`, `dataflow`, `cube-filled`, `completed-submissions`                           |
| Quality / Compliance     | `certified`, `checkbox-marked-outline`, `check-in-icon`, `approval-center`            |
| Supply Chain / Logistics | `globe`, `data-app`, `local_shipping`, `warehouse`, `shopping_cart`                   |
| Retail / Store           | `store`, `cube-filled`, `numbers`, `toolbox`                                          |
| Financial                | `money-universal`, `money`, `benchmark`, `books`, `calculator`                        |
| People / HR / Patients   | `people`, `person`, `person-card`, `person-plus`, `people-plus`, `heart`              |
| Time / Scheduling        | `clock`, `calendar-simple`, `calendar-time`, `alarm`, `interrupting-timer`            |
| Documents / Reports      | `document`, `document-outline`, `books`, `newspaper`, `clipboard-copy`                |
| AI / ML / Intelligence   | `ai-chat`, `magic`, `wand`, `lightbulb`, `lightning-bolt`, `sciency-data`, `analyzer` |
| Marketing / Campaigns    | `area-chart`, `funnel`, `bell-outline`, `video`, `image`                              |
| Settings / Admin         | `controls`, `pages-gear`, `code-tags`, `pencil-box`, `lock-closed`                    |
| Geography / Location     | `globe`, `map-marker`, `building`                                                     |
| Forecasting / Goals      | `forecast`, `goals`, `trophy`, `exclamation-triangle`                                 |
| Education                | `graduation-cap`, `domo-university`                                                   |
| Health / Safety          | `heart`, `glasses`, `adc`                                                             |
| Inventory / Products     | `cube-filled`, `domobox`, `table`, `tag-multiple`, `badge-layout-small`               |


#### Complete Domo icon catalog (133 verified names)

Scanned from 100+ live App Studio apps. Every name below is confirmed to render correctly:

```
abc                    adc                    ai-chat                airplane
alarm                  align-center-icon      align-left-icon        analytics
analyzer               approval-center        approval-center-alt    appstore
area-chart             arrow-box              arrow-merge            arrow-right-circle
arrow-up-circle        avatar                 axis                   badge-layout-8
badge-layout-medium    badge-layout-mixed     badge-layout-small     bell-outline
benchmark              beta                   books                  building
calculator             calendar-simple        calendar-time          camera
card-notebook          card-poll              cell-phone             certified
certified-company      chart-bar-vertical     chart-line             chart-properties
check-in-icon          checkbox-marked-outline clipboard-copy        clock
code-tags              color                  completed-submissions  controls
cube-filled            dashboard              data-app               data-science
database               dataflow               document               document-outline
domo                   domo-university        domobox                dot-plot-chart
dots-vertical          drill                  exclamation-triangle   flag
forecast               format-list-checks     funnel                 funnel-strike
gauge                  glasses                globe                  goals
graduation-cap         handshake              heart                  home
image                  inbox-full             interrupting-timer     lightbulb
lightning-bolt         link                   local_shipping         lock-closed
magic                  map-marker             marker                 money
money-universal        newspaper              non-interrupting-timer numbers
pages                  pages-bars             pages-chart            pages-gear
paperclip              pencil                 pencil-box             people
people-plus            person                 person-card            person-plus
phone                  play-circle-outline    pop-chart              presentation
question-circle        ringing-bell           sandcastle             sciency-data
search                 seeding                select-chart           shopping_cart
smile                  store                  sync                   table
table-column           tag-multiple           tag-vertical           toolbox
trophy                 variable               video                  wand
warehouse              workflow               workspace              x-circle
your-submissions
```

---

## Custom App Icon

Every App Studio app **must** have a custom icon. Never leave the default placeholder.

**Step 1 — Generate a 256x256 PNG icon** using Pillow (or accept a user-provided image). The icon should visually represent the app's domain using the app's custom brand color palette.

```python
from PIL import Image, ImageDraw
import math, io

def generate_app_icon(brand_hex='#3B82C8', dark_hex='#23272E', size=256):
    """Generate a modern app icon with brand-colored gear and mini bar chart."""
    brand = tuple(int(brand_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
    dark  = tuple(int(dark_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))

    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Background circle
    draw.ellipse([8, 8, size - 8, size - 8], fill=dark)

    # Gear teeth
    r_outer, teeth = 90, 8
    for i in range(teeth):
        a = i * (2 * math.pi / teeth)
        a1, a2 = a - 0.15, a + 0.15
        pts = [(cx + r * math.cos(ang), cy + r * math.sin(ang))
               for ang in (a1, a2) for r in (r_outer, r_outer + 18)]
        draw.polygon([pts[0], pts[1], pts[3], pts[2]], fill=brand)

    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=brand)
    draw.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=dark)
    draw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], fill=brand)

    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()
```

**Step 2 — Upload via CLI**

```bash
community-domo-cli --output json -y files upload --file-path icon.png > icon_response.json
DATA_FILE_ID=$(python3 -c "import json; print(json.load(open('icon_response.json'))['dataFileId'])")
```

**Step 3 — Set on the app** (include in the GET->modify->PUT flow):

```python
app['iconDataFileId']    = data_file_id
app['navIconDataFileId'] = data_file_id  # same file for both
```

**Note**: The CLI uses `mimetypes.guess_type()` for content type. PNG files are correctly
detected as `image/png`. The CLI does not send `?name=&public=true` query params — the
`dataFileId` is still returned and works for icon assignment.

**Gotchas:**

- `Content-Type` must be `image/png` (not `application/octet-stream`) or the upload returns `415`.
- The PUT must send the **full app object** — partial payloads cause `400 Bad Request`.
- Icon should be 256x256 PNG with transparency for best rendering across Domo surfaces.

---

## Creating Custom App Card Instances (Pro-Code)

Custom app card instances (from published designs) are created via a two-step CLI flow: create a context, then create the card from that context.

### Step 1: Create a Context

A context defines the dataset mappings, collections, and resource bindings for a card instance.

```bash
python3 -c "
import json
body = {
    'designId': '$DESIGN_ID',
    'mapping': [{'alias': 'sales', 'dataSetId': '$DATASET_ID', 'fields': [], 'dql': None}],
    'collections': [], 'accountMapping': [], 'actionMapping': [],
    'workflowMapping': [], 'packageMapping': [],
    'isDisabled': False
}
json.dump(body, open('context.json', 'w'))
"

community-domo-cli --output json -y domoapps context-create \
  --body-file context.json > context_response.json

CONTEXT_ID=$(python3 -c "import json; d=json.load(open('context_response.json')); print(d[0]['id'])")
```

Response: `[context, []]` — the context object contains the generated `id`.

For apps with no datasets (e.g., banners), use `"mapping": []`.

### Step 2: Create the Card from the Context

```bash
community-domo-cli --output json -y domoapps card-create \
  --page-id $VIEW_ID \
  --body "{\"contextId\": \"$CONTEXT_ID\", \"id\": \"$CONTEXT_ID\"}" \
  > domoapps_card_response.json
```

**Critical**: The `id` field must be the **context ID** from Step 1, NOT the design ID. Using the design ID causes 500 errors when datasets differ from the original.

| Param       | Description                                         |
| ----------- | --------------------------------------------------- |
| `fullpage`  | `false` for standard card, `true` for full-page app |
| `pageId`    | Target page ID, or `-100000` for asset library only |
| `cardTitle` | URL-encoded title for the card                      |

### Updating a Context (Rewire Dataset)

Use the CLI's context update command with the full context object and updated `mapping`.

### Design Caching Gotcha

If a pro-code card renders a blank `#app` div (HTML loads correctly, `ryuu.js` loads, but ESM imports never fire), the design's files may be cached/corrupted from a prior publish. **Fix**: Create a NEW design (`domo publish` from a directory without an existing `id` in manifest.json) instead of republishing the old design ID. The new design ID will get fresh CDN cache entries.

### Pro-Code & App Studio Integration Notes

- Pro-code cards can interact with native page filters via `domo.onFiltersUpdated` and variables via `domo.onVariablesUpdated`. Set `acceptFilters: true` on the content entry.
- Pro-code cards can write variables via `domo.requestVariablesUpdate([{ functionId, value }], onAck, onReply)`.
- Pro-code apps render in iframes and do NOT inherit App Studio theme colors. When the theme palette changes, every pro-code component must be manually updated and republished.
- Pro-code apps should set `background: transparent` and no `box-shadow` — the App Studio card style provides the chrome.
- For the full build workflow, filter/variable patterns, and layout sizing guidance, use `app-studio-pro-code`.

---

## Gotchas and Known Issues


| Issue                                             | Detail |
| ------------------------------------------------- | ------ |
| **Write lock handled by CLI**                     | The CLI's `layout-set` command automatically acquires and releases write locks. No manual lock management needed. |
| **Cards go to appendix by default**               | When you add a card via `pages add-card` or `cards create --page-id`, it goes to the appendix. You must update the layout via `layout-set` to move it to the canvas. |
| **layoutId != pageId**                            | Each page has its own `layoutId` (a different numeric ID). Get it from `layout-get`. The `layout-set` body **must contain `layoutId`** or the CLI raises an error. |
| **viewId = pageId**                               | In App Studio, the `viewId` from the app structure IS the `pageId` for card and layout operations. |
| **Template must account for ALL content keys**    | Every `contentKey` present in the `content` array MUST have a corresponding entry in BOTH `standard.template` AND `compact.template`. Missing keys cause `400 Bad Request`. |
| **Appendix artifacts MUST be preserved**          | Template-only `PAGE_BREAK` and `SEPARATOR` entries with `contentKey` values NOT in the `content` array MUST be preserved as `virtualAppendix: true, virtual: true`. |
| **Content keys may have gaps**                    | Domo assigns `contentKey` values incrementally but gaps occur. Never assume sequential keys. Always read the layout to get actual keys. |
| **LEFT nav requires `showDomoNavigation: false`** | Setting `navOrientation` to `LEFT` while `showDomoNavigation` is `true` causes `400 Bad Request`. |
| **View creation body format**                     | `create-view` requires the `view` sub-object directly — NOT wrapped in `{"view": {...}}`. Must include `type: "dataappview"`, `title`, `pageName`, and `owners` array. |
| **App update requires full body**                 | `app-studio update` rejects partial bodies with `400 Bad Request`. Send the complete app object from `app-studio get`. |
| **Nav reorder requires full array**               | Navigation reorder requires the complete array. Missing items causes `400`. **Preserve all default system nav items** (HOME, AI_ASSISTANT, CONTROLS, DISTRIBUTE, MORE/Details). |
| **No card duplication**                           | Adding the same card to multiple pages does not duplicate it — same card rendered on each page. Filter interactions are shared. |
| **Overview page is `-100000`**                    | The Domo overview/home page has the special page ID `-100000`. Use `pages add-card -- -100000 $CARD_ID`. |
| **Cards from different datasets on same page**    | An App Studio page can contain cards powered by different datasets. No restriction. |
| **Hex values MUST be uppercase**                  | Color hex values in the theme must use uppercase letters. Lowercase hex causes `400 Bad Request`. |
| **Nav icons: use only catalog names**             | Domo uses its own internal icon set (133 verified names). Google Material icon names render as blank/invisible. See the icon catalog above. |
| **Chart types require `badge_` prefix**           | All native chart type names use the `badge_` prefix. See `card-creation` for the full catalog. |
| **`badge_line` always returns 400**               | Use `badge_two_trendline` or `badge_spark_line` instead. |
| **`badge_area` is not a valid type**              | Use `badge_vert_area_overlay` for area charts. |
| **Pro-code colors are NOT inherited**             | Pro-code components render in iframes with their own CSS. Theme changes require manual pro-code updates and republish. |
| **Font family must match across all surfaces**    | Theme `fonts[].family` must match pro-code CSS `font-family`. Mixing families looks broken. |
| **Design caching: blank `#app` div**              | If a pro-code card renders blank, create a NEW design ID instead of republishing the old one. |
| **Daily tick density**                            | Time-series pro-code charts with >30 data points must thin ticks. Target ~18 visible labels. See `app-studio-pro-code`. |


### Layout Update Debugging Checklist

If a layout update returns `400 Bad Request`, check these in order:

1. **Missing template entries**: Compare content keys (from `content` array) with template keys (from `standard.template`). Every content key must appear in both `standard` and `compact` templates.
2. **Missing appendix artifacts**: Check for `PAGE_BREAK` and `SEPARATOR` entries in the existing template that have `contentKey` values NOT in the `content` array. These must be preserved.
3. **Template key mismatch**: Ensure the same set of `contentKey` values appears in `standard.template` and `compact.template`.
4. **Children field**: Every template entry must include `"children": null` (or be omitted).
5. **Missing layoutId in body**: The CLI requires `layoutId` in the body JSON to build the lock/PUT/unlock URLs.

```python
# Debugging helper — run this before any layout update
content_keys = {c["contentKey"] for c in layout["content"]}
std_keys = {t["contentKey"] for t in layout["standard"]["template"]}
cmp_keys = {t["contentKey"] for t in layout["compact"]["template"]}

in_content_not_std = content_keys - std_keys
in_std_not_content = std_keys - content_keys  # May include PAGE_BREAK, SEPARATOR
in_std_not_cmp = std_keys - cmp_keys

if in_content_not_std:
    print(f"ERROR: content keys missing from standard template: {in_content_not_std}")
if in_std_not_cmp:
    print(f"ERROR: standard keys missing from compact template: {in_std_not_cmp}")
# in_std_not_content is OK — these are SEPARATOR/PAGE_BREAK appendix artifacts
```

---

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) — Riley Stahura's Domo AI skills collection.
