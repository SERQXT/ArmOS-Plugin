# Interactive state testing

Use inside **`05b-ux-expert-iteration.md`** **after** the **screen coverage checklist** and static audit. This module tests states that only appear after user interaction or under specific data conditions — not visible from a single full-page screenshot.

**Scope:** Apply the relevant rows below to **each major surface type** that shipped (see **`screen-coverage-checklist.md`**). If the app has **multiple distinct screens** (e.g. list + settings + admin), repeat **applicable** tests on each — do not only test the “happy path” home surface.

**Integration boundary checks** (when HTML/CSS and JS were produced in separate passes): verify **full** option lists in selects match canonical config/datasets (not a hardcoded subset); **bootstrap order** loads roster/rules before views that need them; **no placeholder** dynamic ids in handlers — see **`enterprise-prompt-patterns.md` §8**.

## Mandatory interaction tests

For each test: **perform the action**, capture the result (screenshot or description), and score **Pass / Partial / Fail** with one-line evidence.

| # | Test | Actions | Pass criteria |
|---|------|---------|----------------|
| 1 | **Drawer / detail panel** | Click a data row (or primary interactive element) **on each list/table surface**. | Panel opens with correct data; close control works; click-outside closes if that is the pattern; content readable without horizontal scroll. |
| 2 | **Drawer content quality** | Open the detail view for **3 different** row types (e.g. Critical vs Low, different categories) **where that pattern exists**. | Content adapts to context; metadata complete; no placeholder text; AI rationale (if present) is specific to the row. |
| 3 | **Filter → empty state** | Apply filters that produce **0** results (e.g. impossible combination) **on surfaces with filters**. | Explicit “No results” message with guidance (clear filters / broaden search); table does **not** show stale data or a blank void. |
| 4 | **Filter → narrow state** | Apply filters that produce **1–3** results. | KPIs reflect filtered set; table renders correctly; counts match visible rows (no “showing 200” when 2 are visible). |
| 5 | **Error state** | Simulate data fetch failure if testable; otherwise document **expected** behavior **per surface** that loads data. | Loading skeleton or spinner during fetch; error message if fetch fails; retry affordance where appropriate. |
| 6 | **Bulk density** | If data supports it, remove filters to show **maximum** rows **on primary list surfaces**. | Table scrolls independently of header; KPIs remain visible; no layout breakage; render acceptable (e.g. under 2s for initial paint — note environment limits). |
| 7 | **Keyboard navigation** | Tab through the **primary flow on each distinct screen layout** (not only the first page). | Focus indicators visible; drawer openable via Enter/Space where applicable; Escape closes overlay; tab order logical. |

## Scoring

Each test: **Pass / Partial / Fail** with one-line evidence. Note **which surface** each result applies to when multiple screens exist.

## Gate rule

If tests **1–3** have any **Fail** on a **built** surface that includes that pattern, the revision **must** address them before the UX pass can be marked complete. These are **blockers**, not suggestions.

## Output

Add an **“Interactive state tests”** section to the UX report, **after** screen coverage + static audit scores and **before** (or alongside) design refinement notes.
