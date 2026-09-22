# Dashboard & Card Lessons Learned

Shared reference for **dashboard-builder**, **card-builder**, **card-spec-designer**, and **dashboard-auditor**. Read before building any card or diagnosing any rendering failure.

These are the most frequent causes of card creation or rendering failures, distilled from production builds. When diagnosing a broken card, check these in order.

---

## 1. Double Aggregation

**Symptom:** Card renders but shows wildly inflated numbers (e.g., revenue shows 10x the actual value).

**Cause:** A beast mode formula contains `SUM(`Revenue`)` and the card column referencing that beast mode also has `aggregation: "SUM"`. Domo applies SUM on top of the beast mode's SUM, producing `SUM(SUM(Revenue))`.

**Fix:** When a card column references a beast mode that already contains an aggregation function (SUM, AVG, COUNT, MIN, MAX), set the card column's `aggregation` to `null` or omit it entirely. The beast mode handles the aggregation.

**Detection rule:** Before setting aggregation on ANY column that uses a `formulaId`:
1. Look up the beast mode formula
2. If the formula contains ANY of: `SUM(`, `AVG(`, `COUNT(`, `MIN(`, `MAX(` → the beast mode is **aggregate**
3. Aggregate beast modes: set `mapping` to `VALUE`, do NOT set `aggregation`
4. Row-level beast modes (no agg functions): set `mapping` to `VALUE`, DO set `aggregation`

**Severity:** This is the #1 cause of card failures. Check it first.

---

## 2. Wrong Column Names

**Symptom:** Card fails to create or renders with "No data" / errors.

**Cause:** Column names in the card spec don't match the dataset schema exactly. Column names are case-sensitive — `revenue` is not `Revenue`, `Order Date` is not `order_date`.

**Fix:** Always copy column names exactly from the `dataset_schema` output. Never type them from memory or abbreviate them.

---

## 3. Wrong Filter Values

**Symptom:** Card renders but shows "No data in filtered range" or shows zero rows.

**Cause:** Filter values in the spec don't match actual values in the data. Common examples:
- Using `"CY"` when the data contains `"Current Year"`
- Using `"Completed"` when the data contains `"Complete"`
- Using `"Y"` when the data contains `"Yes"`

**Fix:** Always use the exact values discovered by `SELECT DISTINCT <col> FROM table` in data discovery. Never guess or abbreviate filter values.

---

## 4. Empty Date Ranges

**Symptom:** Card shows "No data in filtered range" even though the dataset has data.

**Cause:** Date filters specify a range outside the dataset's actual date boundaries. E.g., filtering for "Last 30 days" when the most recent data is from 6 months ago.

**Fix:** Check the MIN/MAX dates from data discovery. Ensure all date filters and date-based comparisons fall within the actual data range.

---

## 5. Pre-Calculated Average (Double-Averaging)

**Symptom:** Average metric shows a lower/different number than expected (e.g., avg ticket shows $28 when the real weighted average is $31).

**Cause:** Dataset has a pre-calculated average column (row-level). Using `AVG(AvgTicket)` gives equal weight to every row regardless of volume.

**Fix:** Create a beast mode: `SUM(`NetSales`) / NULLIF(SUM(`OrderCount`), 0)`. Never `AVG()` a column that's already an average.

---

## 6. Pivoted Dataset Overcounting

**Symptom:** Measure shows N times the actual number (e.g., customer count shows 5x actual).

**Cause:** Dataset is pivoted — each entity-date has one row per pivot value. Columns shared across all pivot rows get counted N times when grouped by the pivot dimension.

**Fix:** Either (a) filter to a single pivot value: `SUM(CASE WHEN ServiceType = 'Delivery' THEN CustomerCount ELSE 0 END)`, or (b) use `MAX` per entity-date instead of `SUM`, or (c) note the measure is only valid when NOT grouped by the pivot dimension.

---

## 7. Filter Combination Produces Zero Rows

**Symptom:** Individual filters return data, but the combination of multiple filters returns zero rows.

**Cause:** The specific combination of filter values produces an empty result set. E.g., filtering for Region = "West" AND Product = "Widget X" when Widget X is only sold in the East region.

**Fix:** Before using a multi-filter combination in a card spec, test it with `dataset_query`: `SELECT COUNT(*) FROM table WHERE region = 'West' AND product = 'Widget X'`. If it returns 0, the filter combination is invalid — adjust or remove one of the filters.

---

## 8. Beast Mode Name Conflicts

**Symptom:** "Rename Beast Modes to avoid conflict" error, or cards break after beast mode creation.

**Cause:** Beast mode name duplicates an existing dataset column name or another beast mode on the same dataset.

**Fix:** Before creating, check the dataset schema (`dataset_schema`) for column names and `beast_mode_list` for existing beast modes. If a conflict exists, prefix the name (e.g., "Calc: Delivery %" instead of "Delivery %").

---

## 9. Ghost Slots on v1 Pages

**Symptom:** After deleting cards from a v1 page, empty placeholder positions remain that cannot be removed via API.

**Cause:** v1 pages use flow layout. Deleting a card leaves a gap that only manual drag-and-drop in the Domo UI can fix. There is no API to compact the layout.

**Fix:** For redesigns with many deletions on v1 pages: create a fresh page with `page_create`, migrate KEEP cards, and build new cards on the fresh page. For v2 pages: delete freely, then use `layout_set` to reflow.

---

## 10. Card Preview Succeeds but Render Check Fails

**Symptom:** `card_preview` returns a valid image, but after creation, `card_render_check` fails.

**Cause:** Preview uses a simplified rendering path. The full card render engine has stricter validation — especially around beast mode references, complex filters, and date grains.

**Fix:** After creation, always run `card_render_check`. If it fails, pull the card definition with `card_definition(card_id)`, compare against the intended spec, and look for the issues in items 1–7 above.

---

## 11. virtualAppendix Pages Silently Ignore Layout API Writes

**Symptom:** `layout_set` reports `positions_applied: N` and returns 200, but card positions don't change. `header_create` also fails silently or errors on these pages.

**Cause:** The page has `virtualAppendix: true` in its layout template items. This is a Domo internal flag on pages that were imported into App Studio or have certain legacy configurations. The v4 layout PUT endpoint accepts the payload and returns 200, but **does not apply any changes**. There is no error message — it's a silent no-op.

**Detection:** Before ANY layout operation, call `layout_get` and check:
```
layout_get(page_id) → check if items[0].virtualAppendix === true
```
If `virtualAppendix` is true, **do not attempt layout_set or header_create on this page**. They will silently fail.

**Fix:** Create a fresh page with `page_create`, then use `layout_convert` on the fresh page. Fresh pages do NOT have `virtualAppendix` and layout operations work correctly on them.

---

## 12. The Only Working Layout Flow: Fresh Page + Single PUT

**Symptom:** `layout_set` and `header_create` fail on most existing pages, even non-virtualAppendix ones. Incremental layout operations are unreliable.

**Cause:** The v4 layout API is designed for full-payload writes, not incremental updates. Adding new content items (headers) or repositioning cards one at a time triggers inconsistencies.

**Working flow (verified in production):**
1. `page_create` → create a fresh page
2. Add cards to the page via `card_create_full` with `page_id`
3. `layout_convert` → enables the 60-unit grid on the fresh page
4. `layout_get` → read the full layout (get layoutId, all contentKeys)
5. Acquire writelock: `PUT /api/content/v4/pages/layouts/{layoutId}/writelock`
6. Build the COMPLETE layout payload with ALL headers + ALL card positions in a single object, setting `virtual: false` and `virtualAppendix: false` on every template item
7. `PUT /api/content/v4/pages/layouts/{layoutId}` with the full payload
8. Release writelock: `DELETE /api/content/v4/pages/layouts/{layoutId}/writelock`

**Critical:** The PUT body must include everything — all section headers AND all cards together. Do not try to add headers first and reposition cards later. The single-payload approach is the only reliable method.

---

## 13. Verify Cards Are on Page Before Layout Operations

**Symptom:** `layout_set` called with card IDs that aren't on the page. Layout reports success but nothing is positioned.

**Cause:** Cards were created but not yet associated with the page, or the card_id doesn't match what's in the layout's content array (cardId vs cardUrn mismatch).

**Fix:** Before ANY layout operation, call `page_cards(page_id)` and verify every card ID you plan to position is actually on the page. Compare against the layout's `content` array from `layout_get`.

---

## 14. App Studio Direct Build — No Staging Page or Import Needed

**Old approach (DEPRECATED):** Create cards on a staging page → layout_convert → layout_set → appstudio_import. This was fragile: the synchronous import endpoint returns 400 on many instances, and the async endpoint often doesn't complete.

**New approach (VERIFIED):** Build directly on the App Studio view page:
1. `appstudio_create(title)` → returns `data_app_id` and `view_page_id`
2. `card_create_full(page_id=view_page_id, ...)` for each card
3. `appstudio_layout(view_page_id, positions)` → positions cards and sets `virtualAppendix=false`

**Key discovery:** App Studio view pages already have a layout (no `layout_convert` needed). Setting `virtualAppendix=false` on template items via the layout PUT API **actually works** — it unlocks full positioning control. `layout_convert` fails with 400 on view pages, but you don't need it.

**`appstudio_create` gotcha:** Do NOT pass `description: ""` (empty string) — it causes 400. Omit the field or pass null.

---

## 15. date_grain Causes 400 on card_create_full — Use Plain ITEM Mapping Instead

**Symptom:** `card_create_full` returns 400 for every trendline/time-series card when `date_grain` is provided as a string (e.g., `"MONTH"`).

**Cause:** The v1 card creation API expects `dateGrain` as an object `{ column: "DateCol", dateTimeElement: "MONTH" }`, not a bare string. Passing a string causes the API to reject the entire payload with 400 and no further detail.

**Fix (two options):**
1. **Drop `date_grain` entirely.** Map the date column as a plain ITEM column with `calendar: true`. The card will auto-detect the appropriate date grain from the data. This works for most trendline charts.
2. **Pass the object format** if you need explicit grain control: `{ column: "Order Date", dateTimeElement: "MONTH" }`.

Option 1 is simpler and works in all tested cases.

---

## 16. Orphan Content Items Cause Ghost Boxes and Stray Text

**Symptom:** After `layout_set`, the page shows empty grey boxes at the bottom and/or random text characters (like a lone "r") between or below the real cards.

**Cause:** `layout_convert` creates content items for ALL cards and headers already on the page. When `layout_set` only positions the cards you specify, any pre-existing items NOT in your `positions` array remain at their default positions and render as ghost elements. Common sources:
- Pre-existing cards on the staging page before the build started
- Page titles or section headers that converted to HEADER content items
- Cards added then removed during iterative build attempts

**Fix (now automated in `layout_set` tool):** The `layout_set` tool automatically hides orphan content items by collapsing them to `x:0 y:0 width:0 height:0`. Any content item not explicitly listed in the `positions` array (for cards) or `headers` array (for headers) is treated as an orphan and hidden. The tool reports how many orphans were hidden in its warnings.

**Verification:** After `layout_set`, check the response `positions_applied` — any item with `width:0 height:0` is a hidden orphan. If you see more items than expected, the page had extra content before the build.

**Prevention:** Always build on a fresh page (`page_create`) rather than reusing an existing page. This minimizes orphan content items from the start.

---

## Applying These Lessons by Skill

| Skill | How to Apply |
|-------|-------------|
| **dashboard-builder** | Check every card against patterns 1–10 in Step 9.5 (PDCA verification loop). For layout operations: check #11 (virtualAppendix) FIRST in Step 7.5 before any layout_set call. Follow #12 (fresh page + single PUT) as the default layout flow. Verify cards on page (#13) before layout ops. Check #15 (date_grain) if trendline cards fail with 400. Orphan cleanup (#16) is now automatic in `layout_set` — verify via response warnings. |
| **card-builder** | Check before card preview (Step 5). If preview fails, walk patterns 1–7. Especially check #1 (double aggregation) on beast mode columns. |
| **card-spec-designer** | Validate every spec against patterns 1–7 before handing off. Especially: #2 (column name case-sensitivity), #3 (filter value exactness), #5 (pre-calculated average detection). |
| **dashboard-auditor** | When evaluating existing cards, score against these failure patterns. A card exhibiting any of #1, #5, or #6 is a REBUILD candidate. |
| **build-appstudio** | Note #14: App Studio import creates virtualAppendix pages. ALL layout positioning must be done on the staging page BEFORE import. Do not attempt API layout changes after import. |
