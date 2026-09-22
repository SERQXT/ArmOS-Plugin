# Stage G2 / J2 — UX expert iteration → v2

**Maps to pipeline stages:** **G2** (pre-discovery) and **J2** (post-discovery rebuild track) — same **critique → revise** pattern; inputs differ.

## Preconditions

- **G2:** MVP v1 exists (G1). **Do not** skip to discovery handoff on v1 alone.
- **J2:** A **post-discovery build** exists (revised spec after transcript/SOW). **Do not** ship consultant pack (K) before this pass.

**Global output rules (see SKILL.md):** No emojis in UI or artifacts (use icon libraries). No stage codes (G1, J2, etc.) in any human-visible text.

## Core method: critique, then revise (not a greenfield redraw)

1. **Critique first** — Fully assess **both** deliverables: (a) context app — first impression, zero assumed knowledge; (b) MVP1 — functional demo. Document what fails, what works, and **why**, before writing replacement code.
2. **Revise second** — Implement changes **informed by that critique**. Carry forward validated interaction and data patterns. Avoid blind reskins; avoid throwing away working flows without cause.
3. **Anchor to outcomes** — Every revision traces to **`NORTHSTAR.md`**, **`BUILD-SPEC.md`**, and (post-discovery) transcript/SOW themes.

## Inputs

- **Engagement context app** + **MVP1 app**: URLs, version, design ids.
- `artifacts/deploy-result.json` — definitive source of page/card/design IDs from G1.
- `objective/NORTHSTAR.md`, `spec/BUILD-SPEC.md` — outcome alignment.
- **Post-discovery (J2):** Gong transcript, SOW, structured discovery IDs.
- Modular prompts under `../modules/` (use as checklists).

## Outputs

- **Next version** — published iteration with UX release notes.
- **`artifacts/UX-V2-REPORT.md`** (exact filename — do not rename) containing:
  - **Screen coverage** — every shipped surface (`built` vs `mock-teaser`); per `screen-coverage-checklist.md`.
  - **Critique summary** — five pillars + 11-dimension audit + journey + interactive state tests.
  - **Revision summary** — what changed, grouped by pillar, and what was kept on purpose.
  - **Outcome alignment** — north-star / spec / discovery theme → evidence in UI.
  - **Residual debt** — gaps for human polish in ArmOS (L/M).

## Five pillars (mandatory critique)

1. **Usability** — learnability, efficiency, affordances, cognitive load.
2. **Accessibility** — contrast, keyboard, SR-friendly patterns, inclusive copy.
3. **Information architecture** — labels, hierarchy, findability.
4. **Interaction design** — feedback, transitions, predictable flows.
5. **Visual design** — hierarchy, type, color, spacing; aesthetics in service of trust.

## Composition order (from modules)

1. `modules/screen-coverage-checklist.md`
2. **Viewport audit** — screenshot each built surface at 1440x900; annotate what is above the fold. Compare to the viewport blueprint in BUILD-SPEC if available. If hero metric or primary CTA is below the fold, flag as a priority fix.
3. `modules/ui-quality-audit.md` (13 dimensions) — **score against the 5-to-9 lift table from BUILD-SPEC** if it exists. For each surface, note whether the current build matches the "9/10" column or the "5/10" column and what specific changes would close the gap.
4. `modules/enterprise-prompt-patterns.md` §8–10
5. `modules/user-journey-test.md` — includes **dual-persona walkthrough** (power user + first-timer) and **happy-path timing** (count clicks, target 3 or fewer for primary task)
6. `modules/interactive-state-testing.md`
7. Optionally `modules/design-refinement-phases.md`
8. `modules/design-system-check.md` — includes playbook compliance check (shadows, radius, easing, animations)
9. `modules/upgrade-to-nine.md` (if time-boxed) — uses priority framework: viewport > CTA > signal-noise > happy-path > brand

## Instructions

1. Do not skip the written critique — implement only after critique artifacts exist.
2. Meaningful revision pass — not only tiny CSS tweaks, unless critique shows no major gaps.
3. After implementing, re-run screen coverage, audit, and interactive tests.
4. For J2, reconcile with SOW/transcript.
5. Interactive states are not optional — drawers/modals, empty states, multiple data contexts.
6. Full screen coverage — no `built` surface may be unaudited.
7. Engagement context app: skimmable in under one minute, no jargon.

---

## Stale artifact cleanup (follow existing skill patterns)

The UX pass revises code and re-publishes. Follow the same patterns from **`procode-app-builder`** and **`dashboard-builder`** — do not create duplicates.

### Before re-publishing:

1. **Read `artifacts/deploy-result.json`** from G1 — get the existing `design_id`, `page_id`, `card_id`.
2. **Publish as new version of existing design.** Keep the `id` field in `manifest.json`. Bump `version`. This updates the design in-place — no new design created.
3. **Reuse the page from G1.** Do NOT create a new page. The card references the design — publishing a new version updates card content automatically.
4. **Verify with `page_cards`.** Same number of cards as G1. Delete duplicates via `card_delete` if any appeared.

### After revision:

1. `procode_design_list(searchTerm: "500Apps|{customer}")` — if more than 2 designs exist, delete extras with `procode_design_delete`.
2. Verify dashboard layout with `layout_get` — re-apply `layout_set` if layout was lost (per `dashboard-builder` patterns).
3. Update `deploy-result.json` with new version numbers and cleanup actions.

---

## Checkpoint

**G2 complete:**

```
@500apps-pipeline checkpoint=stage-g2 status=complete
```

**J2 complete:**

```
@500apps-pipeline checkpoint=stage-j2 status=complete
```
