# Changelog

All notable changes to the `domo-interactive-proposal-builder` skill are documented here.

This skill follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — schema breaks. Existing engagement content JSON must be migrated.
- **MINOR** — additive changes (new optional sections, new authoring rules, design system extensions). Existing engagement content JSON continues to render.
- **PATCH** — copy edits, bug fixes, generator improvements.

---

## [0.5.2] — 2026-05-04

### Changed

- **Tab renamed: "Solutions, Scope & Effort" → "Scope & Effort".** The merged tab introduced in v0.5.0 carried the longer label to signal the merge of the prior Phases & Scope and Level of Effort tabs. With the merged structure now familiar, the shorter label reads cleaner in the navigation bar and matches how reviewers refer to it in conversation. No structural change — the tab still contains per-solution collapsible cards with narrative, deliverables, architecture flow, and the (collapsible-as-of-0.5.1) LOE work-item table. Schema, JSON content, KPI tiles, and tab order are unchanged. Prose references in `SKILL.md` and `schema.json` updated to match. The `data-tab="solutions"` attribute and underlying CSS classes are retained — renaming would churn selectors without rendering benefit.

### PHA example

- `examples/pha-2026.html` re-rendered with the new tab label. No JSON or content change.

---

## [0.5.1] — 2026-05-04

### Changed

- **Per-solution Level of Effort table is now collapsible.** Inside an expanded solution card on the merged "Solutions, Scope & Effort" tab, the LOE work-item table previously sat permanently expanded below the deliverables — long, scannable, but rarely the first thing reviewers want to see. The LOE block is now collapsed by default *even when its parent solution is open*. The collapsed header always shows the work-item count and the solution's total hours so the number is visible without expanding the table; clicking the header toggles the work-item detail. Print/PDF rendering forces the LOE table open so flat artifacts still capture every work item.

### PHA example

- `examples/pha-2026.html` re-rendered to demonstrate the collapsible LOE behavior. No JSON or content change.

---

## [0.5.0] — 2026-05-03

### Changed

- **Phases & Scope and Level of Effort tabs merged into "Solutions, Scope & Effort".** The two tabs were both keyed off each engagement chunk and the reader was implicitly joining them in their head. Now each solution renders as a single collapsible card; opening it reveals (1) the narrative description, (2) the deliverables accordion, (3) the optional architecture-flow diagram, and (4) the per-solution LOE work-item table — in that natural reading order. The merged tab carries the prior LOE KPI tile row and closing `loe_note` at the top so engagement-level numbers still read up front. Cards are collapsed by default. Tab count drops 9 → 8.
- **Schema vocabulary: `phases` → `solutions`, `phase_id` → `solution_id`.** Domo's customer-facing language for engagement chunks is *Solutions*. The schema, rendered HTML, and rendered PDF now match. The renderer iterates `solutions[]` rather than `phases[]`, and `data_sources.{data_source_rows,visualization_rows}[].phase_id` plus `credit_impact.drivers[].phase_id` are now `solution_id`. Stable IDs (the `p1`, `p2`, … pattern) are preserved across the rename so existing IDs continue to resolve.
- **All visible "Phase X" copy rewritten in solution language.** "Phase 1 — XYZ" → "Solution 1 — XYZ" everywhere a customer reads it: KPI tiles, table section rows, Timeline labels, ROI cost table, Credit Impact category groupings, narrative prose. "Phase-by-Phase Cost Breakdown" → "Solution-by-Solution Cost Breakdown". "Phased Pilot Approach" → "Sequenced Pilot Approach". Hours-per-phase → Hours-per-solution. Five-phase engagement → five-solution engagement.
- **Internal CSS class names retained.** `.phase-card`, `.phase-header`, `.phase-title`, etc. are styling identifiers, not customer-facing strings. Renaming them would touch every CSS rule with zero rendering benefit and create a large diff that's harder to review. The legacy `executive_summary.phase_one_framing` field name is also retained for handoff compatibility with prior briefs; the rendered title under that field reads "Solution 1 — …".

### Schema

- `meta.schema_version` is now `"0.5.0"` (const-validated). Migration from 0.3.x is mechanical: rename `phases` → `solutions` at the top level, rename `phase_id` → `solution_id` inside `data_sources.data_source_rows[]`, `data_sources.visualization_rows[]`, and `credit_impact.drivers[]`, and bump `meta.schema_version` to `"0.5.0"`. No field shapes change.
- 85% rule fully retired. `solutions[].hours.recommended` is no longer computed; if absent it defaults to `hours.high` for legacy consumers but isn't surfaced in the rendered proposal.

### PHA example

- `examples/pha-2026.json` migrated to schema 0.5.0 with prose rewritten in solution language ("Solution 1 — QHR Intake Portal: The Right First Step", "Solutions 2–5", "five-solution engagement", etc.).
- `examples/pha-2026.html` re-rendered. Math verification: 80 + 158 + 118 + 136 + 98 = 590 hrs · 590 × $275 = $162,250 Total Investment. Solution-by-Solution table, KPI tiles, Timeline column, ROI Total Hours, and ROI Total Investment all show the same numbers.

### Why MINOR (and not MAJOR)

This is the largest pre-1.0 schema rename so far. Per the versioning policy in SKILL.md, a MINOR bump within the pre-1.0 window is acceptable for additive *or* renaming changes; the schema is still in shakedown and the marketplace is a small, internal-team set of users where coordinated migration is straightforward. Existing engagement JSON requires the field-name migration above before re-rendering.

---

## [0.3.5] — 2026-05-03

### Changed (non-breaking)

- **LOE tab redesigned as collapsible per-phase cards.** The single five-phase work-item table has been replaced with one collapsible card per phase, mirroring the Phases & Scope tab pattern but with a different inner body (a per-phase work-item table instead of the deliverable accordion). All cards are collapsed by default — click to expand. Inside each card:
  - **Single Hours column** per work item (was: low–high range). The displayed value is the high end of the row's range. Column header is "Hours" (was: "Est. Hours") — no "Est." or "Estimated" labels anywhere on the tab.
  - **Phase Total Hours footer row** at the bottom of each phase, summing the visible Hours column. The total matches the value in the phase card header for easy at-a-glance verification.
  - **Phase column removed** — redundant inside a per-phase card.
  - **Capability tags** rendered next to the work item name when applicable: `Data Source Connections`, `ETL`, `Visualize`, `AI`. Each tag is a colored badge keyed off a Pacific Drift chart-series color (data: teal, ETL: blue, visualize: green, AI: purple). Generic structural rows (Solution Design, QA/UAT, Rollout, PM) remain untagged.
- **Phases & Scope tab — Phase 1 collapsed by default.** Previously Phase 1 rendered open on initial load; now every phase card opens only on click. Reduces vertical scroll for readers landing on the tab and keeps the visual cadence consistent across phases.
- **Hour reporting unified to high-end across every tab.** The 85%-rule "recommended" hours number — previously displayed on Phases & Scope card headers, the Timeline tab hour column, the LOE tab KPI tiles, and the LOE roadmap total — has been replaced with the high-end value of each phase's range. The ROI & Investment tab already used high-end (since 0.3.4); this change brings the rest of the document onto the same number so every figure reconciles. The LOE / Phases / Timeline / ROI tabs now display the same per-phase hours and the same 590 hr roadmap total. The 85%-rule computation is retained internally for any downstream consumer that still reads `phase.hours.recommended`, but is no longer surfaced in the rendered HTML.
- **Phase totals now derived from `loe_rows` at render time.** `phase.hours.{low, high}` are recomputed in `generate.py` as the sum of their `loe_rows.hours.{low, high}` rather than read from the author's payload. Author-supplied phase totals are overridden by the sum, eliminating any drift between work-item rows and phase summaries. The PHA example already summed correctly under the old logic; this change makes the discipline structural rather than a manual reviewer responsibility.
- **`schema.json`** — adds optional `category` field to `loe_rows[]` items, enum: `["Data Source Connections", "ETL", "Visualize", "AI"]`. Backward-compatible — existing payloads with no `category` field render the same as before, just without capability tags. `loe_rows[]` description updated to state explicitly that the sum of `loe_rows.hours.high` is the canonical phase hour total.
- **`SKILL.md`** — Rule 2 expanded with a "Build sub-item categories — default coverage" subsection explaining when to include and tag work items for each of the four standard categories; Rule 3 rewritten to drop the 85% rule and explain the new high-end-everywhere model with rationale (the previous Phases-vs-ROI split was a frequent source of "why don't these match?" reconciliation overhead in client review). `version` bumped to 0.3.5; `last_revised` updated to 2026-05-03.
- **`examples/pha-2026.json`** — `category` added to 15 of the 38 LOE rows: P1 (Member Portal, Fileset Upload, Submission Tracker), P2 (AI Validation Agent, QHR Taxonomy Engine, EHR Pathway Routing), P3 (QHR Analytics Pipeline, Member QHR Portal, Staff Aggregate View, Historical Data Mapping), P4 (Non-PHI Forms, 50 Chart Migration, Financial & Staffing Dashboards), P5 (Quality Audit Engine, Extended EHR Coverage). The 23 generic rows (Solution Design, Workflow Notifications, Human-in-Loop Workflow, Member Feedback Loop, SSO Planning, QA/UAT, Rollout, PM × 5 phases) intentionally leave `category` unset. Executive Summary KPI row updated: "Phase 1 Est. Hours: 77" → "Phase 1 Hours: 80"; "Full Roadmap Hrs: 564" → "Full Roadmap Hours: 590" — bringing the Exec Summary onto the same numbers as the rest of the document.
- **`examples/pha-2026.html`** — re-rendered. LOE tab now shows the collapsible per-phase structure with capability tags, Phase Total Hours rows summing exactly to phase headers, and a closing 590 hr Total Engagement summary tile. Phases & Scope tab loads with all phases collapsed.

### Schema impact

- Backward-compatible. The optional `category` field is purely additive; payloads that omit it render with no capability tags. Author-supplied `phase.hours.{low, high}` are now overridden by the sum of their `loe_rows`, so payloads where these values disagreed previously will display the recomputed sum (and the totals will reconcile with the LOE table — typically the desired outcome).

---

## [0.3.4] — 2026-05-03

### Changed (non-breaking)

- **ROI & Investments tab — single Total Investment commitment number replaces the Low/Recommended/High pricing menu.** The hourly-rate slider, the four-card investment KPI row (Total Investment Recommended / Investment Low / Investment High / Recommended Hours), and the five-column phase-by-phase breakdown table (Phase / Hour Range / Cost Low / Cost Recommended / Cost High) have all been removed. Replaced with:
  - One **Total Investment** KPI card (no "RECOMMENDED" suffix) showing `roadmap_high × rate_default`.
  - One **Total Hours** KPI card (renamed from "Recommended Hours") showing `roadmap_high`.
  - A three-column phase-by-phase breakdown table: **Phase / Hours / Investment**, where Hours = `phase.hours.high` and Investment = `phase.hours.high × rate_default`. Footer sums match the KPI cards exactly.
- **Payback period, 3-Year Net Value, and 3-Year ROI Multiple now compute against `cost_high` instead of `cost_recommended`** — this keeps every figure on the ROI tab math-consistent with the single Total Investment commitment number. Tile sub-text updated to drop the word "recommended" (now reads "Time to recover the investment from realized annual value" and "Cumulative value over 3 years, net of investment").
- **Dead JS removed.** The 80-line `recalc()` IIFE that recomputed cost cells, KPI totals, payback months, 3-year net, and ROI multiple in real time when the user moved the rate slider has been deleted — there's no rate input to bind to anymore. Static values rendered from `generate.py` are the single source.
- **`generate.py`** — `payback_cons_months`, `payback_stretch_months`, `net_3yr_cons`, `net_3yr_stretch`, `multiple_cons`, `multiple_stretch` now divide / subtract / multiply against `cost_high` (was: `cost_rec`). The validation check `if cost_rec <= 0` was rewritten as `if cost_high <= 0` with a friendlier "Total investment must be positive" error message.
- **`SKILL.md` Rule 3 (hour reporting)** — split into two paragraphs to make the ROI-tab carve-out explicit: the LOE / Phases / Timeline / roadmap-KPI surfaces still use the 85% rule, but the ROI tab uses the high end of every range. Rationale paragraph rewritten so future authors and future-me understand *why* the two surfaces differ (scoping artifacts vs commercial commitment artifact).
- **`examples/pha-2026.json`** — `roi.intro` and `roi.investment_framing` rewritten to match the new tab. `intro` no longer mentions an "interactive hourly rate slider"; `investment_framing` no longer references "Recommended / Low / High columns" because those columns no longer exist. Both fields now position the Total Investment as a full-contingency ceiling against which the AI-accelerated delivery model frequently lands 15–25% below.
- **`examples/pha-2026.html`** — Re-rendered. ROI tab now shows: Total Investment $162,250 (was: Recommended $138,022, Low $89,925, High $162,250), Total Hours 590 (was: Recommended 502 hrs), three-column breakdown summing to $162,250 / 590 hrs, payback 2.7 – 9.5 months (was 2.3 – 8.1 months), 3-Year Net Value and ROI Multiple updated in lockstep.

### Schema impact

- None. The schema is unchanged. Existing engagement content JSON files render against this version with no migration. Authors of `roi.intro` / `roi.investment_framing` may want to revisit prose that referenced the rate slider or the Low/Recommended/High column structure — but anything that still does will just render as slightly stale framing copy, not as a render error.

### Companion-skill impact

- **`domo-proposal-pdf-renderer`** — No code changes. It imports the proposal-builder's `template.html` directly, so the simplified ROI tab flows through automatically. Example PDF re-rendered.

---

## [0.3.3] — 2026-05-01

### Fixed

- **Mojibake characters (`â€"`, `â€™`) throughout the rendered proposal.** `template.html` was a fragment, not a complete HTML document — it began with `<style>` directly with no `<!DOCTYPE html>`, no `<head>`, no `<meta charset="utf-8">`. Browsers opened the file with their fallback encoding (typically Windows-1252), causing valid UTF-8 en-dashes (`–`), em-dashes (`—`), and smart quotes to render as garbled multi-character sequences. This affected hour ranges (`130K–234K` displayed as `130Kâ€"234K`), ROI ranges, and any prose using en/em-dashes.

### Changed (non-breaking)

- **Template now produces a complete HTML5 document.** Wrapped content in `<!DOCTYPE html><html lang="en"><head>…</head><body>…</body></html>`. The `<head>` declares `<meta charset="utf-8">`, `<meta name="viewport">`, and a `<title>` of the form `{{ client.name }} – Domo Proposal`. No layout, sizing, or visual changes — purely document-structure scaffolding so the browser interprets bytes correctly.
- Re-rendered `examples/pha-2026.html` against the updated template.
- Schema, generator, content tabs, all section logic: unchanged.

---

## [0.3.2] — 2026-05-01

### Changed (non-breaking)

- **Header masthead — official Domo brand icon replaces the placeholder tile + wordmark text.** `template.html` now inlines the official Domo brand-icon SVG (sized 40×40px) in the top-left of the dark header and drops the adjacent "Domo" wordmark text. The icon stands alone as the brand signature. Self-contained: SVG is inlined directly into the template, so the proposal HTML stays single-file with no external image dependencies, no CDN beacons, no print/zoom degradation.
- **CSS cleanup.** The unused `.domo-wordmark`, `.domo-tile`, `.domo-tile span`, and `.domo-wordname` rules were deleted from `template.html`. A single new `.domo-logo` rule controls icon sizing and bottom margin. Header layout is otherwise unchanged.
- **Asset archive.** The official SVG is also stored at `assets/domo-icon.svg` alongside the template for traceability and future reuse, even though the rendered template inlines its markup directly.
- **Schema, generator, all other tabs:** unchanged. JSON content payloads continue to render byte-identically except for the two-line difference in the header section.

---

## [0.3.1] — 2026-05-01

### Changed (non-breaking)

- **Cross-references to `domo-sow-docx-renderer` removed across SKILL.md, schema.json, CHANGELOG.md, and CONTRIBUTING.md.** The Word SOW renderer plugin has been removed from this marketplace, so all "the same JSON renders to a Legal Word SOW" / "Pair with `domo-sow-docx-renderer`" / "travels with the contract" cross-references have been deleted or replaced with neutral language pointing to the polished-PDF companion (`domo-proposal-pdf-renderer`) where appropriate. No functional behavior changes; schema, template, and renderer are unchanged.
- **`plugin.json` description** — Removed the trailing "Pair with `domo-sow-docx-renderer`..." clause; added the Credit Impact tab to the feature highlights.
- **`SKILL.md`** — Reframed Rule 9's closing paragraph to drop the "intentionally NOT rendered in the Legal Word SOW" framing (no longer applicable). Companion-skills section now points only at `domo-discovery-brief` (upstream) and `domo-proposal-pdf-renderer` (offline PDF). Tab order, schema rules, and authoring discipline unchanged.

---

## [0.3.0] — 2026-05-01

### Added

- **`schema.json`** — New optional top-level `credit_impact` block. Authors a directional credit consumption forecast for the engagement, structured as: `intro` (one paragraph framing this tab vs the ROI tab), `methodology.items[]` (minimum 3 bullets — user counts, refresh cadences, adoption-curve assumptions, exclusions), `drivers[]` (minimum 3 driver rows enumerated by phase × category × specific activity, with low/high integer credit ranges for `y1`/`y3`/`y5`), optional `current_envelope` (current contracted credits with auto-computed Y1/Y3 percentage comparison), optional `recommendations[]` (efficiency patterns + re-forecast triggers), and `directional_callout` (closing forecast disclaimer — auto-emitted with a sensible default if author omits). Eight category enum values: Data Pipelines, Dashboards & Views, AI Primitives, Code Engine, Workflows, Embed/Everywhere, Storage, Other.
- **`template.html`** — New ninth tab **Credit Impact**, positioned right of ROI & Investment in the nav strip. Panel renders Y1 / Y3 / Y5 KPI tiles (auto-computed from driver totals), an optional current-envelope comparison card with percentage tiles, a methodology block, the per-phase × per-category × per-driver table with annual totals in the footer, an optional efficiency-recommendations grid, and a closing directional-forecast callout. New Pacific Drift styles (`.credit-summary-grid`, `.credit-tile`, `.credit-method-block`, `.credit-envelope`, `.loe-table.credit-table`, `.credit-recs-grid`, `.credit-rec`, `.credit-empty`). Print-stylesheet `break-inside: avoid` extended to cover credit tiles, recs, methodology block, and envelope card so the tab flattens cleanly into the polished PDF. Tab is **always rendered** — when `credit_impact` is omitted from the JSON, the panel shows a "Credit Forecast Not Yet Provided" placeholder rather than disappearing, keeping tab order consistent across proposals.
- **`generate.py`** — Aggregates driver rows into Y1/Y3/Y5 annual totals (low + high), groups drivers by phase × category in canonical category order (Data Pipelines → Dashboards & Views → AI Primitives → Code Engine → Workflows → Embed/Everywhere → Storage → Other), computes envelope-comparison percentages from Y1/Y3 midpoints, formats credits with the new `fmt_credits_short` helper (e.g. `1.29M`, `627K`), and emits a default directional callout when the author omits one. New `credit_totals` block on the rendered context.
- **`SKILL.md`** — New non-negotiable authoring **Rule 9: Credit Impact tab — directional forecast, not a quote.** Drivers must be enumerated by phase × category at the activity level (no category-summary-only shortcut), all values must be ranges (never single numbers, because Domo's credit model has feature/tier/workload variability), methodology block + closing disclaimer cannot be removed. Tab is rendered in the interactive HTML proposal and the polished offline PDF. Tab order updated from 8 to 9 with Credit Impact as the new ninth tab.
- **`examples/pha-2026.json`** — Authored a complete Credit Impact section for the canonical PHA reference: 16 driver rows across all five phases and seven of the eight categories, methodology block (audience scale, refresh cadence, adoption curve, exclusions, what drives variability), current_envelope set to a representative 600K credits/yr (Y1 lands at ~144%, Y3 at ~215% — illustrating the renewal/expansion conversation this tab is designed to anchor), and four efficiency recommendations (incremental ETL, materialized aggregates, AI primitive caching, re-forecast triggers).
- **`examples/pha-2026.html`** — Re-rendered from the updated JSON. Now includes the Credit Impact tab with all 16 drivers grouped by phase/category and Y1/Y3/Y5 totals at 627K–1.09M / 943K–1.63M / 1.29M–2.15M.

### Changed

- **`schema.json`** — `meta.schema_version` const bumped from `"0.1.0"` to `"0.3.0"` to align the schema's declared version with the plugin version. The 0.2.0 BREAKING release (`phases[].deliverables[]` migrated from strings to 4-field objects) and the 0.3.0 additive release (optional `credit_impact` block) both shipped without bumping `meta.schema_version` — this entry corrects that. The `$id` URL was bumped in lockstep. **Existing engagement content JSON files must update `meta.schema_version` to `"0.3.0"`.**
- **`examples/pha-2026.json`** — `meta.schema_version` updated to `"0.3.0"`. `phases[0].title` cleaned: was `"QHR PHI Intake Portal — Immediate Priority"`, now `"QHR PHI Intake Portal"`. The trailing `— Immediate Priority` suffix was redundant with the existing `is_priority: true` flag on the phase, and several template paths (Data Sources, Visualizations, Credit Impact cat-rows) appended `· Immediate Priority` themselves when `is_priority` was true — producing the literal duplication `Immediate Priority · Immediate Priority` in those rows. Authors should keep phase titles concise; the priority flag drives the visible label.
- **`template.html`** — Two row-rendering paths that previously used the bare phase title without the priority append (LOE table section-row at line 549, ROI cost table row at line 601) now also conditionally append `· Immediate Priority` when `phase.is_priority` is true. All five tabular references to a priority phase (LOE table, Data Sources, Visualizations, ROI cost table, Credit Impact) now read identically: `Phase 1 — QHR PHI Intake Portal · Immediate Priority`. The phase card in the Phases & Scope tab continues to show only the bare title with the existing `Now` badge — that visual already conveys priority and the textual append would be redundant.
- **`examples/pha-2026.html`** and **`domo-proposal-pdf-renderer/examples/pha-2026.pdf`** — re-rendered. PDF: 37 pages, metadata intact, no Immediate-Priority duplication anywhere.

### Companion-skill impact

- **`domo-proposal-pdf-renderer`** — No code changes required. Re-renders the new Credit Impact tab automatically because it consumes the same JSON and reuses the proposal-builder's `template.html`. Example PDF (`examples/pha-2026.pdf`) re-rendered: 33 pages → 37 pages, all metadata intact.

---

## [0.2.0] — 2026-05-01

### Changed (BREAKING)

- **`schema.json`** — `phases[].deliverables[]` now contains **objects** (was: array of strings). Each deliverable requires four fields: `title`, `description`, `audience` (array), `outcome_value`. The new fields populate the click-to-expand detail panel under each deliverable in the rendered proposal. Existing `0.1.0` engagement content JSON files must be migrated — replace each deliverable string with a 4-field object before rendering.

### Added

- **`template.html`** — Level 3 expand UI for deliverables. Each deliverable in the Phases & Scope tab is now itself click-expandable, revealing **What it includes** / **Who it's for** / **Outcome & value**. Visual treatment matches the existing phase-card chevron and 150ms ease-out transition; Pacific Drift palette throughout. Click bubbling is suppressed at the deliverable level so expanding a deliverable does not collapse its parent phase card.
- **`template.html`** — **Export to PDF** button in the nav strip (right-aligned via `margin-left: auto`, bordered-pill treatment in Pacific Drift accent so it reads as an action rather than a tab). Triggers the browser's native print dialog; companion `@media print` stylesheet flattens the document by force-displaying every panel, expanding every phase card, and expanding every deliverable so a single PDF captures all eight tabs with full Level 3 detail. `document.title` is set to `{client}-proposal-{date}` immediately before `window.print()` so the default save-as filename is sensible, and restored on `afterprint`. Print rules preserve the Pacific Drift palette via `print-color-adjust: exact`, suppress hover/chevron affordances, and apply `break-inside: avoid` to logical units (phase cards, deliverables, KPI/ROI tiles, callouts, pillar cards) to prevent awkward mid-card page breaks.
- **`SKILL.md`** — New non-negotiable authoring rule **2a: Deliverable detail is required for every deliverable.** Field-by-field tone guidance (customer-facing, no internal jargon, audience by customer's role labels, outcome anchored to the customer's own goals from discovery), worked example expanding a thin deliverable to its full object form, explicit "all four fields required, no exceptions" language.
- **`examples/pha-2026.json`** — All 33 deliverables across the five phases migrated to the object form, with `description` / `audience` / `outcome_value` authored from the surrounding proposal context (executive summary, phase descriptions, ROI drivers).
- **`examples/pha-2026.html`** — Re-rendered from the migrated JSON.

### Migration note

The `domo-discovery-brief` schema is unchanged. The brief continues to capture `key_deliverables` as short hint strings; expansion to the four-field object form is the proposal builder's responsibility per Rule 2a.

---

## [0.1.0] — 2026-04-28

Initial release. Skill foundation built from the Pacific Healthcare Association proposal (the canonical reference example bundled in `examples/`).

### Added

- **`SKILL.md`** — Persona (Domo Apex Expert and Solutions Architect), voice (sharp, efficient, bottom-line first), and the eight non-negotiable authoring rules: AI-accelerated delivery factor, fixed phase LOE row structure, 85% Recommended Hours rule, Pacific Drift design system, full-persona Custom App coverage, mandatory Domo Momentum Methodology, mandatory ROI tab, fixed tab order. Mandatory trigger phrases included in the description block for skill matcher invocation.
- **`schema.json`** — JSON content payload schema (Draft 7). Multi-renderer-ready: hours stored as numbers (computable), stable IDs on phases and ROI drivers, prose fields support limited inline HTML (`<strong>`, `<em>`, `<br>`).
- **`template.html`** — Jinja2-parameterized template covering all eight tabs: Executive Summary, Phases & Scope, Level of Effort, Data Sources & Visualizations, Implementation Strategy, Timeline, Assumptions, ROI & Investment. CSS, JS, and the Domo Momentum SVG remain verbatim from the master file.
- **`generate.py`** — Renderer that takes an engagement content JSON and produces final HTML. Pre-computes all derived values (85% Recommended Hours, roadmap totals, per-phase costs at default rate, payback period, 3-year net value, 3-year ROI multiple, timeline bar geometry) so the template stays focused on layout. Best-effort schema validation if `jsonschema` is installed; minimal structural check otherwise.
- **`examples/pha-2026.json`** — Pacific Healthcare Association proposal captured as data, conforming to schema. Canonical reference example.
- **`examples/pha-2026.html`** — Rendered output of the PHA JSON.
- **Versioning** — `version` and `last_revised` fields in SKILL.md frontmatter.

### Authoring rules locked in

- AI-accelerated delivery: 40–50% leaner than traditional estimates, must be cited explicitly in the LOE note and the "Why Domo Consulting" callout.
- Fixed phase LOE structure: Solution Design + Build sub-items + QA/UAT + Rollout & Enablement + Project Management (10–15%).
- 85% rule for summary hour displays (KPI tiles, phase card summaries, timeline bars, ROI cost-recommended). LOE table preserves full ranges as source of truth.
- Pacific Drift palette only — `--cs1` through `--cs6` for charts, `--accent`, status tokens, badge conventions.
- Custom App scoping must address all intended user personas, business outcomes, UX quality bar, and adoption considerations.
- Domo Momentum 9-stage methodology rendered in the Implementation Strategy panel of every interactive proposal.
- ROI tab is mandatory; minimum 5 quantifiable value drivers anchored to the project context.
- Tab order is fixed: Executive Summary → Phases & Scope → LOE → Data Sources & Visualizations → Implementation Strategy → Timeline → Assumptions → ROI & Investment.

### Known limitations

- PDF export not yet planned at v0.1.0. (Added in a later release as the `domo-proposal-pdf-renderer` companion skill.)
- Discovery Brief intake handled by companion `domo-discovery-brief` skill.
- Visual fidelity to the original PHA master file is ~99%; minor formatting differences in derived value presentation (e.g. `$2M` vs `$2.00M`) are acceptable for v0.1.0 and may be tuned in patch releases.
