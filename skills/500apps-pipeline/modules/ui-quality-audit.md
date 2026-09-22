# UI quality audit (13 dimensions)

Use this module inside **`05b-ux-expert-iteration.md`** to score v1 before building v2.

## Dimensions (score 1–10 each)

| # | Dimension | What to check |
|---|-----------|----------------|
| 1 | **Visual hierarchy** | Headlines vs body; primary vs secondary actions; F-pattern readability. |
| 2 | **Signal vs noise** | Chartjunk, redundant labels, decorative clutter. Is the hero metric immediately visible? Are secondary elements visually recessed? Is anything decorative competing with the primary action? Score <=5 if the hero metric is buried among equally-weighted elements. |
| 3 | **Color** | Semantic use; contrast; not relying on color alone for meaning. |
| 4 | **Viewport & density** | Comfortable line length; spacing; mobile breakpoints if in scope. |
| 5 | **Layout & alignment** | Grid consistency; stray pixels; card alignment. |
| 6 | **Precision** | Copy accuracy; units; rounding; stale placeholders. |
| 7 | **Brand fit** | Matches engagement tokens / customer palette (see `design-system-check.md`). |
| 8 | **Actionability** | Obvious next step for the user; empty states show guidance (not blank space); error states offer recovery; filtered-to-zero has explicit messaging. Score ≤4 if any common state (empty, error, loading) is unhandled. |
| 9 | **Scannability** | Can a user find the KPI in under 10 seconds on key surfaces. |
| 10 | **Accessibility** | Focus order, contrast ratios, touch targets, heading structure. |
| 11 | **Row severity contrast** | In list/table views with priority or status: can the user distinguish severity levels **at a glance** without reading text? Color + weight + icon differentiation between levels. Critical rows should feel urgent; Low rows should recede. Score ≤5 if the only differentiator is a small colored badge. |
| 12 | **Viewport priority** | Does the initial viewport (1440x900, no scroll) contain the hero metric, primary CTA, and enough context to act? Score ≤4 if the user must scroll to find the primary action. Score ≤6 if the hero metric is visible but the CTA is below the fold. Compare to the viewport blueprint in BUILD-SPEC if available. |
| 13 | **CTA clarity** | Is the primary CTA visually dominant — distinct background color, sufficient size, action-oriented label? Does it pass 3:1 contrast against its container? Score ≤4 if CTAs blend with surrounding content or if two equally-weighted CTAs compete above the fold. |

## Enterprise production supplement (v2 polish)

Use alongside **`enterprise-prompt-patterns.md` §9–10**. These catch common **AI-generated UI** failure modes:

| Theme | Fail if… |
|-------|----------|
| **Action vs container** | A button or link has the **same** effective background as the card or section it sits on — user cannot see what is clickable. |
| **Border-as-hierarchy** | Thick **left/top/right** borders used as the main visual hierarchy — prefer **shadow / elevation** and spacing. |
| **Monospace noise** | Monospace on random labels or badges (allowed for code, IDs, fixed columns). |
| **Async silence** | A long-running action with no loading state and no confirmation of result. |
| **Off-screen feedback** | Panel or dialog opens outside the viewport with no **scrollIntoView** (user thinks click did nothing). |
| **Happy-path friction** | Any dead-end, unnecessary confirmation dialog, or extra click on the most common workflow. If the primary task takes more than 3 clicks from app open, flag as MAJOR_ISSUE. |
| **Playbook structural violations** | Flat single-source shadows, inconsistent border-radius, no entrance animations on card grids, or missing loading skeletons. See `domo-design-playbook.md` anti-patterns. |
| **CSS duplication** | Same selector defined multiple times — risks cascade overrides and “fixed then broken again” regressions. |

**Triple-zero gate before handoff:** target **zero** unexplained console errors on the happy path, **zero** dead clicks, **zero** invisible interactive elements (see enterprise module).

## Output shape

1. **Scores** — table with one-line evidence per dimension.  
2. **Top 3 fixes** — highest impact, ordered.  
3. **Recommended refinement phase** — map to `design-refinement-phases.md` (e.g. “start at Phase 2 Data clarity”).  
4. **Stop rule** — if average ≥ 8 and no severity-1 issues, note “light pass only.”
