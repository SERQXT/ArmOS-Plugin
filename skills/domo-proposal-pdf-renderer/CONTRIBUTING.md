# Contributing to the Domo Proposal PDF Renderer Skill

Short guide for Domo team members extending or fixing the `domo-proposal-pdf-renderer` skill.

---

## Quick orientation

This skill renders the engagement content payload (produced by `domo-interactive-proposal-builder`) into a polished, signature-quality PDF using headless Chromium via Playwright.

- **`SKILL.md`** is the brain. Read before changing anything else.
- **`render.py`** is the renderer. It re-uses the proposal-builder's `generate.py` and `template.html` — **there is no parallel HTML template in this skill**, by design. Visual fidelity to the interactive proposal is the guarantee.
- **`examples/pha-2026.pdf`** is the canonical reference render.

There is no `template.html`, no `schema.json`, and no `generate.py` in this skill. The shared assets live in `../../../domo-interactive-proposal-builder/skills/domo-interactive-proposal-builder/`.

---

## The most important rule

**Do not duplicate the HTML template here.**

If a visual change is needed, edit `template.html` in the proposal-builder skill. That single change flows to both renderers (HTML and PDF) because they share the template. Duplicating the template here would create drift; any future change to the interactive proposal would not appear in the polished PDF, and the "single source of truth" guarantee would break.

If the change is **PDF-specific** (footer formatting, margins, page-break tuning, metadata), make it in `render.py` here. The print stylesheet itself lives in `template.html` under `@media print { … }` — that's shared with the browser-print path the Export to PDF button uses, so any change there affects both.

---

## Common contributions

### Tweaking the footer

The footer template is built in `build_footer_template()` in `render.py`. It's rendered by Playwright on every page (not by the HTML), so it stays fixed at the bottom regardless of content flow. Constraints from Chromium's footer rendering:

- **External stylesheets do not load.** All styling must be inline.
- **Default font size is very small** unless explicitly set. Use `font-size: 8.5pt` (or larger) — anything smaller renders unreadably.
- **Colors are reset between pages** unless `-webkit-print-color-adjust: exact` is set inline.
- **`<span class="pageNumber">` and `<span class="totalPages">`** are recognized placeholders that Chromium fills in.

Test footer changes by rendering the canonical example and opening the PDF in Preview, Acrobat, *and* a couple of webmail previews (Gmail, Outlook web) — they each have slightly different PDF preview engines and surface different issues.

### Adjusting margins or paper size

`render.py` calls `page.pdf()` with explicit margin and format. Defaults are Letter / 12 mm sides / 12 mm top / 16 mm bottom. The bottom margin is intentionally larger to give the footer breathing room.

If you change the page format (e.g. to A4 for European customers), keep the bottom margin extra-large so the footer doesn't crowd content.

### Adding a cover page (planned v0.2.0)

Two implementation paths to consider:

1. **HTML-side cover page in `template.html`** with a `cover` flag in the engagement content JSON. The cover renders as the first `.sow-panel` in the document (full-bleed, screen-hidden via CSS, print-only). This keeps everything in the single template and means the cover renders for the browser-print path too if a client wants it. Trade-off: complicates the proposal-builder template for a feature that's mostly PDF-specific.
2. **PDF-side cover via a second-page render**. Render the cover as its own HTML, generate a separate single-page PDF, then merge with `pypdf`. Keeps the proposal-builder template clean. Trade-off: adds a code path that diverges from the interactive proposal.

Option 1 is preferred. It keeps the single-source-of-truth principle. Add a `meta.cover_page: true|false` flag to the JSON schema, gate the cover panel in `template.html` with `{% if meta.cover_page %}`, and document it in the proposal-builder's CHANGELOG as well as this one.

### Adding watermark presets (planned v0.2.0)

Watermarks (DRAFT, CONFIDENTIAL — DO NOT DISTRIBUTE, REDLINE) should be PDF-only — they make sense for in-flight review artifacts but should not appear in the interactive proposal. Implement here in `render.py` rather than in the shared template:

- Use Playwright's `addStyleTag` after the page loads to inject a `body::before` pseudo-element with `position: fixed`, large rotated text, low opacity. The print rendering picks it up.
- Or generate a watermark SVG and overlay using `pypdf`'s page merge APIs after the initial render. More reliable across PDF readers but adds a post-processing step.

Pick one approach and document it. Don't ship both.

### Adding bookmarks/outline (planned v0.3.0)

PDF outlines are added at the document level after rendering. Use `pypdf`'s `add_outline_item` to map each `.sow-panel` heading to a top-level outline entry and each major section heading inside the panel to a nested entry. Probe the rendered HTML's headings via `page.evaluate()` before generating the PDF to capture their on-page Y coordinates, then map those to PDF page numbers using the bookmark API.

### Bumping Playwright

Pin a Playwright version in `SKILL.md`'s setup section if it ever drifts in a way that breaks renders. Currently we don't pin — Playwright maintains backward compatibility on its `pdf()` API and the install command (`pip install playwright; playwright install chromium`) handles the matched-Chromium-binary problem on its own.

If a Playwright upgrade breaks something, the failure surface is usually:

- Footer rendering (template behavior changes between Chromium versions; verify by rendering the example)
- Print-media emulation (rare but happens; verify the `@media print` stylesheet is still honored)
- Color rendering (the `print-color-adjust: exact` directive should always work, but Chromium has had bugs in this area; verify Pacific Drift palette is intact in the rendered PDF)

When in doubt, render `examples/pha-2026.json` and diff against the committed `examples/pha-2026.pdf`.

---

## Testing

There is no unit test suite. The canonical reference is `examples/pha-2026.pdf`, rendered from `../../../domo-interactive-proposal-builder/skills/domo-interactive-proposal-builder/examples/pha-2026.json`. After any change to `render.py`, re-render the example and visually verify:

- All eight tabs are present and in order
- Every phase card is expanded
- Every deliverable shows its three labeled detail blocks
- Pacific Drift palette is preserved (no color washouts)
- Footer reads `Domo Confidential · Prepared for Pacific Healthcare Association · April 24, 2026` on the left and `Page N of M` on the right
- No browser-imposed URL/timestamp chrome
- Document metadata reads cleanly when you Cmd-I the PDF in Finder (Title, Author, Subject set)

If anything looks off, fix it before committing.

---

## Versioning and release

Same convention as the other plugins in this marketplace:

- **MAJOR** — schema breaks
- **MINOR** — additive renderer features
- **PATCH** — tuning fixes

Bump `plugin.json` `version`, add a `CHANGELOG.md` entry, and (if the version bump is a release) bump `meta.version` in `../../../../.claude-plugin/marketplace.json` for the entry under this plugin's name.
