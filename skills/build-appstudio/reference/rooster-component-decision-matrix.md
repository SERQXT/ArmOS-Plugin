# Component Type Decision Matrix

Use this matrix at design time to choose the right component type for each UI element in an App Studio app.

App Studio has three types of cards:
- **App Components** (aka "rooster cards") — Gallery, Banner, List, FilterList, Details. Created with `rooster_card_create`.
- **Data Cards** (aka "KPI cards") — Charts, tables, metrics, trendlines. Created with `card_create_full`.
- **ProCode Cards** — Custom HTML/CSS/JS apps embedded as cards. Created with `app_card_create`.

## Decision Tree

For each planned element in the blueprint:

| UI Element | Component Type | Tool | Why |
|---|---|---|---|
| Page header / section title | **Banner** (rooster) | `rooster_card_create` | Native styled header with optional image + text + button |
| Filter control / faceted search | **FilterList** (rooster) | `rooster_card_create` | Interactive filter UX with scroll pagination |
| Record detail view (full record) | **Details** (rooster) | `rooster_card_create` | Two-panel layout: image/hero left, fields right |
| Card grid with images (products, people) | **Gallery** (rooster) | `rooster_card_create` | Repeating cards with image + title + description + action |
| Status list with conditional styling | **List** (rooster) | `rooster_card_create` | Vertical list with avatar/tags/buttons per row |
| Chart, graph, metric, table | **KPI card** | `card_create_full` | Standard Domo data visualization (128+ chart types) |
| Custom UI beyond native capabilities | **ProCode card** | `app_card_create` | Full HTML/CSS/JS with Domo data integration |
| Data intake / submission form | **Form** (rooster + form API) | `appstudio_form_create` → `rooster_card_create` | FORM_MODAL button with backing dataset; see `appstudio-forms-reference.md` |
| One-click workflow trigger button | **Workflow button** (rooster) | `workflow_widget_create` → `rooster_card_create` | WORKFLOW_START button; see `appstudio-workflows-reference.md` |

## Anti-Patterns (What NOT to Do)

| Don't Do This | Do This Instead | Why |
|---|---|---|
| Use `badge_singlevalue` for styled KPI metrics in App Studio | Use **Details** rooster or **ProCode** card | badge_singlevalue can't be resized in App Studio, looks tiny |
| Use only KPI cards for a multi-page App Studio app | Mix Rooster (structure) + KPI (data viz) + ProCode (custom) | All-KPI apps look like "dashboards stuffed into App Studio" |
| Skip page headers | Add **Banner** rooster component to every page | Without Banner, ghost "Appendix" artifacts appear from default layout |
| Build filters with card interactions only | Use **FilterList** rooster component | Native filter UX with search, scroll pagination, multi-select |

## Mandatory Rule for App Studio

> **Every App Studio app MUST include at least one Rooster component (Banner for page header at minimum).** An all-KPI App Studio app is an architectural smell -- it should be a v2 dashboard instead.

## Template Quick Reference

| Component | templateType | templateKey Options |
|---|---|---|
| Banner | `banner` | `banner-image-left` |
| FilterList | `filter-list` | `filter-list-image` |
| Details | `details` | `details-image-left` |
| Gallery | `gallery` | `gallery-image-button`, `gallery-full-image`, `gallery-circle-images`, `gallery-no-image` |
| List | `list` | `list-title-description`, `list-with-avatar-tags-buttons`, `list-rectangle-image`, `list-square-image-tags` |
