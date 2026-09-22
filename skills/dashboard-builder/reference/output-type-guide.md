# Output Type Guide — v1 Dashboard vs v2 Page vs App Studio

Shared reference for **dashboard-builder**, **card-spec-designer**, and **build-appstudio**. Read when selecting an output type or designing card specs that depend on the output container.

---

## Output Type Comparison

| Capability | v1 Dashboard | v2 Page | App Studio |
|-----------|-------------|---------|-----------|
| Cards via API | Yes (`card_create_full`) | Yes (`card_create_full`) | Yes (directly on view page) |
| Card sizing via API | Yes (`card_size_set`) | Yes (`card_size_set`) | Yes (directly on view page) |
| Card positioning via API | **No** — creation order = visual order | **Yes** — `layout_convert` + `layout_set` (60-unit grid) | **Yes** — `appstudio_layout` on view page (60-unit grid, no staging page needed) |
| Page filters via API | Read only | Read only | No API |
| Cross-filtering via API | No | No | No |
| Collections via API | No | No | N/A |
| Ghost slots on card delete | **Yes** — unfixable | No — use `layout_set` to reflow | No — `appstudio_layout` hides orphans automatically |
| App Studio import | N/A | N/A | Not needed — build directly on view page |

---

## When to Use Each

| Output Type | Best For | Avoid When |
|-------------|----------|-----------|
| **v1 Dashboard** | Quick throwaway prototypes where layout quality doesn't matter | Any build where layout matters (which is nearly every build) |
| **v2 Page** | **Default for everything.** Standard reporting, executive views, any build requiring consistent layout | User explicitly requests App Studio |
| **App Studio** | Highly customized client-facing dashboards with branding, text blocks, images, custom layouts | Quick builds; internal-only dashboards |

**Default to v2 Page** unless the user specifically requests otherwise.

---

## v1 Dashboard Constraints

- Cards appear in **creation order** on the page — there is no reposition API
- You MUST create cards in exact visual order: top-to-bottom, left-to-right (KPI hero row first)
- Deleting cards leaves ghost slots that cannot be removed via API
- For redesigns: create a fresh page instead of deleting from the existing page

---

## v2 Page Layout Recipe

**Use a fresh page.** Existing pages may have `virtualAppendix: true` which silently blocks all layout API writes.

1. `page_create` → fresh page (or verify existing page is NOT `virtualAppendix` via `layout_get`)
2. Create cards on the page via `card_create_full` with `page_id`
3. `layout_convert` → enable the 60-unit grid
4. `page_cards` → verify all card IDs are on the page before layout ops
5. `layout_get` → read full layout to get `layoutId` and contentKey mappings
6. Build the COMPLETE layout payload with all cards positioned:
   - Page is 60 units wide
   - KPI row: 5 cards × 12 units each → `[{x:0,y:0,w:12,h:6}, {x:12,y:0,w:12,h:6}, ...]`
   - 2/3 + 1/3 split: `{x:0,y:6,w:40,h:20}` + `{x:40,y:6,w:20,h:20}`
   - Equal thirds: 3 × `{w:20,h:20}` at x=0, x=20, x=40
   - Full width (standard chart): `{x:0,w:60,h:20}`
   - Full width (app card — DDX/ProCode/iframe): `{x:0,w:60,h:56}` with header hidden (`w:0,h:0`)
   - Headers: hidden (`w:0,h:0`) for app-only pages; `{w:60,h:2}` for multi-card dashboards; never partial width
   - Set `virtual: false` and `virtualAppendix: false` on every template item

   > **⚠️ Single-card pages:** A lone card MUST use `w:60`. The `w:40` value is ONLY for side-by-side layouts. A lone card at `w:40` renders at 67% width and may become uneditable.

7. Writelock → PUT full payload → Release writelock (single-payload approach)
8. Verify with `layout_get` — check: no single card < `w:60` unless multi-column; app cards `h >= 40`; headers hidden (`w:0`) or full-width (`w:60`)

---

## App Studio Build Strategy — Direct API Pipeline

App Studio apps are built directly via REST APIs. No staging page, no import, no browser automation.

**The build strategy is:**
1. `appstudio_create(title)` → creates the app and returns `data_app_id` + `view_page_id`
2. Create cards via `card_create_full(page_id=view_page_id)` directly on the view page
3. `card_render_check` on each card to verify rendering
4. `appstudio_layout(view_page_id, positions)` → positions all cards in a single call

**How it works technically:**
- `appstudio_create` creates an app with an auto-created **view page** that already has a layout
- The view page's layout has `virtualAppendix: true` on all template items by default
- `appstudio_layout` sets `virtualAppendix: false` on all items, which unlocks full positioning control
- Orphan content items are automatically hidden (collapsed to 0×0) to prevent ghost boxes
- No `layout_convert` needed — view pages already have layouts (and `layout_convert` returns 400 on them)

**`appstudio_create` gotcha:** Do NOT pass `description: ""` (empty string) — it causes 400. Omit the field or pass null.

> **OLD APPROACH (DEPRECATED):** The previous strategy was: create a staging page → layout_convert → layout_set → import into App Studio (via browser automation or API). This was fragile — the synchronous import endpoint returns 400 on many instances, and the async endpoint often doesn't complete. The direct build pipeline above replaces it entirely.

---

## Card Size Reference

| Blueprint Size | API Value | Visual Width | Use For |
|---|---|---|---|
| Small / 1-column | *(default — don't set)* | ~200px (1/6 page) | KPI number cards only |
| Medium / 2-column | `"medium"` | ~300px (1/4 page) | KPI cards, small charts |
| Large / 3-column | `"large"` | ~434px (1/3 page) | Standard charts, breakdowns |
| Full width | `"full"` | ~1300px (full page) | Tables, detailed trends, hero charts |

> "medium" is narrower than most people expect — it's still only ~1/4 page width. For most chart cards, use "large" or "full".

---

## Applying This Guide by Skill

| Skill | How to Apply |
|-------|-------------|
| **dashboard-builder** | Select output type in Step 0.5. Branch card creation (Step 7), layout (Step 7.5), and setup guide (Step 8) by output type. For App Studio, hand off to `build-appstudio` in Step 8.5. |
| **card-spec-designer** | Include grid layout metadata (`grid_width`, `grid_height`, `grid_section`) for v2_page and app_studio output types. Not needed for v1. |
| **build-appstudio** | Receives card specs and layout positions from dashboard-builder. Creates app via `appstudio_create`, builds cards directly on view page, positions with `appstudio_layout`. |
