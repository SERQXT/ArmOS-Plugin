# Changelog

All notable changes to the `domo-proposal-pdf-renderer` skill are documented here.

This skill follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — schema breaks (rare; this skill consumes the proposal-builder's schema). Coordinated bump with `domo-interactive-proposal-builder`.
- **MINOR** — additive renderer features (cover page presets, watermark presets, alternate footer formats, bookmark/outline generation).
- **PATCH** — footer tuning, page-break refinements, metadata adjustments, dependency version bumps.

---

## [0.1.6] — 2026-05-03

### Changed (non-breaking)

- **Re-rendered example PDF (`examples/pha-2026.pdf`) to pick up the merged "Solutions, Scope & Effort" tab and the Phase → Solution rename in `domo-interactive-proposal-builder` 0.5.0.** The upstream proposal builder merged its prior Phases & Scope and Level of Effort tabs into a single Solutions, Scope & Effort tab and renamed `phases` → `solutions`, `phase_id` → `solution_id` everywhere. This skill consumes the proposal builder's `template.html` directly, so the change flows through automatically — `render.py`, footer, metadata, and Playwright invocation are unchanged.

---

## [0.1.5] — 2026-05-03

### Changed (non-breaking)

- **Re-rendered example PDF (`examples/pha-2026.pdf`) to pick up the LOE tab redesign in `domo-interactive-proposal-builder` 0.3.5.** The upstream Level of Effort tab now renders as collapsible per-phase cards (collapsed by default, like Phases & Scope), with a single Hours column per work item, optional capability tags (Data Source Connections / ETL / Visualize / AI), a Phase Total Hours footer per phase, and a closing Total Engagement summary tile. Phase hours now display the high end of each range across the Phases & Scope, LOE, Timeline, and ROI tabs so every figure reconciles to the same source-of-truth number. This skill consumes the proposal-builder's `template.html` directly, so the change flows through automatically — `render.py`, footer, metadata, and Playwright invocation are unchanged.

---

## [0.1.4] — 2026-05-03

### Changed (non-breaking)

- **Re-rendered example PDF (`examples/pha-2026.pdf`) to pick up the simplified ROI & Investments tab in `domo-interactive-proposal-builder` 0.3.4.** The upstream tab now shows a single Total Investment commitment number instead of the Low/Recommended/High pricing menu, with the hourly-rate slider removed. This skill consumes the proposal-builder's `template.html` directly, so the change flows through automatically — `render.py`, footer, metadata, and Playwright invocation are unchanged.

---

## [0.1.3] — 2026-05-01

### Changed (non-breaking)

- **Re-rendered example PDF (`examples/pha-2026.pdf`) to pick up the upstream HTML5 document wrap fix in `domo-interactive-proposal-builder` 0.3.3.** The proposal-builder's `template.html` now declares `<meta charset="utf-8">`, eliminating the mojibake that affected hour ranges, ROI ranges, and any en/em-dash content. PDFs rendered through Playwright were less prone to the issue than browser-opened HTML, but the fixed template is now the canonical source — re-rendered for consistency. `render.py`, footer, metadata, and Playwright invocation: unchanged.

---

## [0.1.2] — 2026-05-01

### Changed (non-breaking)

- **Re-rendered example PDF (`examples/pha-2026.pdf`) to pick up the official Domo brand-icon swap in the proposal-builder's header masthead.** This skill renders against `domo-interactive-proposal-builder`'s `template.html`, so the brand-icon change in the upstream template (proposal-builder 0.3.2) flows through automatically — the renderer itself is unchanged. No code edits to `render.py`, footer, metadata, or Playwright invocation. Existing JSON content payloads continue to render identically except for the new branded icon in the header.

---

## [0.1.1] — 2026-05-01

### Changed (non-breaking)

- **Cross-references to `domo-sow-docx-renderer` removed across SKILL.md, render.py, plugin.json, CHANGELOG.md, and CONTRIBUTING.md.** The Word SOW renderer plugin has been removed from this marketplace. The "three outputs from one payload" architecture narrative is now framed as "two outputs from one payload" (interactive HTML + polished PDF). No code changes — `render.py`'s rendering logic, footer template, metadata patching, and Playwright invocation are unchanged.

---

## [0.1.0] — 2026-05-01

Initial release. Polished, signature-quality PDF renderer for the Domo client proposal — produced by headless Chromium via Playwright against the same `template.html` that `domo-interactive-proposal-builder` uses.

### Why this skill exists

The interactive proposal already ships with an **Export to PDF** button (added in proposal-builder v0.2.0) that triggers the browser's native print dialog. That self-service path covers ~95% of cases and requires zero infrastructure on the client side. But it carries two limitations:

1. **Browser-imposed chrome.** Most browsers inject a URL/timestamp header and a page-indicator footer into print output by default. The recipient can disable this in their print dialog (Chrome: More settings → uncheck "Headers and footers"), but it's an extra step that not every client will take.
2. **Cross-browser variance.** Chrome and Edge produce near-identical PDFs from the print stylesheet; Safari and Firefox differ slightly on color rendering and font fallbacks.

For high-stakes review moments — enterprise procurement, formal RFP responses, signature-quality offline artifacts — the browser-print PDF isn't polished enough. This skill is the parallel path: invoke it from a Claude session, get back a flat PDF with no browser chrome, a Domo-branded footer, and guaranteed cross-recipient consistency. Email it to the client.

### Added

- **`SKILL.md`** — Persona, voice, and the six non-negotiable rules: shared JSON source of truth, derives from the canonical HTML template, no browser-imposed chrome, Domo-branded footer with page numbers, PDF metadata (Title/Author/Subject/Keywords), and the explicit rule that the Export to PDF button in the interactive proposal stays unchanged. Mandatory trigger phrases for skill matcher invocation. Setup instructions for the one-time Playwright + Chromium install.
- **`render.py`** — Renderer that takes an engagement content JSON and produces a polished PDF via headless Chromium (Playwright). Reuses `domo-interactive-proposal-builder/generate.py` to render the source HTML (single source of truth — no parallel template). Force-emulates print media so the existing `@media print` stylesheet flattens the document (every panel visible, every phase expanded, every deliverable's three labeled detail blocks visible, Pacific Drift palette preserved via `print-color-adjust: exact`). Sets PDF metadata (Title, Author, Subject, Keywords, Producer) so the file reads cleanly in document managers and email previews. Builds a Domo-branded footer template (Pacific Drift text color, `Roboto`-stack font, 8.5pt) rendered by Playwright on every page with `Page N of M`. Letter format, 12 mm margins (16 mm bottom for footer clearance), `print_background=True`. Exits with a clear install hint if Playwright is not present; metadata patching via `pypdf` is graceful-fallback (skipped silently if `pypdf` isn't installed — the PDF still renders cleanly).
- **`CONTRIBUTING.md`** — Short guide for extending this skill (footer customization, page format presets, alternate templates).
- **`examples/pha-2026.pdf`** — Pacific Healthcare Association proposal rendered as a polished PDF — canonical reference.

### Authoring rules locked in

- Single source of truth: the engagement content JSON. No parallel PDF template, no parallel schema. Numbers must not diverge across the two outputs (HTML, PDF).
- The PDF derives from the proposal-builder's `template.html` — visual fidelity to the interactive review is the guarantee.
- No browser-imposed chrome. Playwright's `display_header_footer=True` with empty header_template and our explicit footer_template means the only chrome on the page is what we render.
- Domo-branded footer: `Domo Confidential · Prepared for {client.name} · {generated_date_display}` on the left, `Page N of M` on the right.
- PDF metadata set explicitly: Title (`{Client} — Proposal — {YYYY-MM-DD}`), Author (`Domo, Inc.`), Subject (engagement title), Keywords (`Domo, proposal, {client}, {engagement title}`).
- The interactive proposal's Export to PDF button is **not** changed by this skill. The button continues to do `window.print()` for self-service. This skill is the parallel path for high-stakes moments.

### Known limitations / planned fast-follows

- No cover page yet. Planned for v0.2.0 (full-bleed Pacific Drift gradient, client logo placeholder, single-page summary card).
- No watermark support yet (DRAFT, CONFIDENTIAL — DO NOT DISTRIBUTE, REDLINE). Planned for v0.2.0 for in-flight reviews.
- No PDF outline/bookmarks yet. Planned for v0.3.0 — the eight-tab structure of the interactive proposal will mirror as a clickable outline in PDF readers.
- No automated divergence-check between renderers. Planned: a `validate.py` that opens the rendered HTML and the rendered PDF and cross-references roadmap hours, recommended cost, and payback months to catch any divergence.
