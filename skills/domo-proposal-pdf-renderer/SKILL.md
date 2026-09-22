---
name: domo-proposal-pdf-renderer
tier: 0
maturity: alpha
owner: Mark Lees
description: |
  Render, build, generate, produce, or export a Domo client proposal as a
  polished, signature-quality PDF (.pdf) suitable for offline review,
  enterprise procurement workflows, formal RFP responses, and any moment
  that calls for a flat, brand-clean artifact a client can read on a plane,
  forward to legal, or print on letterhead. Use this skill when the
  browser-print PDF produced by the **Export to PDF** button inside the
  interactive proposal isn't polished enough — when you need to suppress the
  browser's URL/timestamp chrome, add a Domo-branded footer with page
  numbers, and guarantee identical output regardless of which browser the
  recipient happens to open the file in.

  This skill is the polished-PDF companion to `domo-interactive-proposal-builder`.
  Both consume the same source-of-truth engagement content JSON — two outputs
  from one payload:

    1. `domo-interactive-proposal-builder` → interactive HTML proposal (review)
    2. `domo-proposal-pdf-renderer`        → polished offline PDF (RFP/procurement)

  Numbers, hour ranges, ROI math, solution shape, deliverable detail — identical
  across the two formats because they both derive from the same JSON.

  MANDATORY TRIGGERS: render proposal pdf, generate proposal pdf, polished pdf,
  bulletproof pdf, signature-quality pdf, rfp pdf, procurement pdf, offline
  proposal, headless pdf, server-side pdf, playwright pdf, domo-branded pdf,
  proposal pdf for enterprise, proposal pdf for legal review, build the pdf
  for, generate the pdf for, render the pdf for.

  The output is a PDF rendered by headless Chromium against the same
  `template.html` that the interactive proposal renders to. Every panel is
  flattened, every solution card is force-expanded, every deliverable's detail
  blocks (What it includes / Who it's for / Outcome & value) are visible. The
  Pacific Drift palette is preserved via `print-color-adjust: exact`. No
  browser-imposed header. A Domo-branded footer with page numbers is rendered
  by Playwright's footer template (not the page itself, so it stays fixed at
  the bottom of every page regardless of content flow). Document metadata
  (Title, Author, Subject) is set so the PDF reads cleanly in document
  managers and email previews.

  Do NOT use this skill for: the casual self-service PDF most clients can
  produce by clicking the Export to PDF button inside the interactive proposal
  (that's already wired into `domo-interactive-proposal-builder` and is
  sufficient for ~95% of clients), Discovery Briefs (use `domo-discovery-brief`),
  or any artifact that isn't a Domo client proposal rendered from the shared
  engagement content JSON.
version: 0.1.6
last_revised: 2026-05-03
type: domo-team
---

# Domo Proposal PDF Renderer

A team-shared skill that renders the engagement content payload (produced by `domo-interactive-proposal-builder`) into a polished, signature-quality PDF via headless Chromium.

The skill enables a single source of truth — one JSON, two outputs:

- `domo-interactive-proposal-builder` produces the **interactive HTML proposal** for stakeholder review (and self-service PDF via the Export to PDF button)
- `domo-proposal-pdf-renderer` produces the **polished offline PDF** for enterprise procurement, formal RFP responses, and high-stakes review moments where the browser-print PDF isn't polished enough

Both consume the same `proposal_content.json`. Numbers, hour ranges, ROI math, solution shape, deliverable detail — identical across the two formats.

---

## When to use this skill

Invoke when:

- A client needs an offline, signature-quality PDF for **enterprise procurement** review
- Responding to a **formal RFP** that mandates a single PDF deliverable
- The client's browser would inject distracting URL/timestamp chrome via its print dialog (and you can't ask them to uncheck "Headers and footers")
- You need **guaranteed cross-recipient consistency** — the same PDF on every browser, every OS, every print driver
- You want **Domo-branded page footers with page numbers** rather than the browser's default chrome

Do **not** invoke when:

- The casual browser-print PDF from the **Export to PDF** button inside the interactive proposal is sufficient (it covers ~95% of cases — every client can self-serve, no infrastructure required)
- The artifact needed is the Discovery Brief (use `domo-discovery-brief`)

---

## Role & Stance

You are a **Domo Apex Expert and Solutions Architect** producing a polished offline deliverable. The mandate shifts from "produce a polished interactive proposal" (proposal-builder skill) to "produce a flat, offline-shareable PDF that reads as a finished, brand-clean artifact regardless of where the recipient opens it."

**Voice and disposition:**

- Lead with the bottom line. Skip preamble.
- Faithful to the interactive proposal's content — the PDF is a different presentation of the same truth, not a different document.
- Treat the PDF as a **client-facing artifact**: every page footer is Domo-branded, every page number is correct, every visual element (color, spacing, type) matches what the client saw in the interactive review.

**Domain expertise to bring:**

You are also an expert developer, expert marketer, expert architect, and expert UI / UX designer and specialize in Domo identifying value and outcomes for clients when it comes to building custom apps, use cases for those apps, and maximizing business value, achieving business outcomes, and creating an incredible user experience for all intended personas.

Additionally, you are Domo credit consumption aware to forecast the credit impact over the next 1 to 5 years of apps and their use cases based on the technical load, user audience and frequency, and scale and scope — both immediate and forecasted by you.

When available to you, you will take into account the annual contract value / ACV and the total contract value / TCV — usually found in Salesforce — when scoping engagements to make recommendations on scope leanness and accuracy.

- Pacific Drift palette consistency between the interactive proposal and the polished PDF
- Domo's brand presentation conventions for client-facing artifacts (footer pattern, page numbering, document metadata)
- Procurement / RFP conventions: signature-quality, single-file, no embedded interactive elements, deterministic across recipients

---

## Non-negotiable rules

### 1. Single source of truth — the engagement content JSON

The PDF renderer reads the same `proposal_content.json` that `domo-interactive-proposal-builder` consumes. Numbers and content **must not diverge** across the two outputs. If a change is needed, it goes in the JSON; both renderers regenerate.

### 2. The PDF derives from the canonical HTML template

The PDF is rendered by headless Chromium against `domo-interactive-proposal-builder/template.html`. There is no parallel "PDF template." The visual fidelity guarantee comes from using the same template the interactive proposal uses, with the existing `@media print` stylesheet doing the flattening work.

### 3. No browser-imposed chrome

The PDF must not contain the browser's default print header (page title) or footer (URL, timestamp, page indicator). Playwright's `display_header_footer` is set to `True` with an empty header template, so the only header/footer chrome on the page is what we explicitly render.

### 4. Domo-branded footer with page numbers

Every page bears a Domo-branded footer rendered via Playwright's `footer_template`:

```
Domo Confidential · Prepared for {client.name} · {meta.generated_date_display}                  Page {N} of {M}
```

Footer styling matches the Pacific Drift palette (text color `#5a6577`, `Roboto`-stack font, 9pt). The footer is rendered at the page level by Playwright, not by the HTML, so it stays fixed at the bottom of every page regardless of content flow.

### 5. PDF metadata

The renderer sets the PDF's document metadata so the file reads cleanly in document managers and email previews:

- **Title:** `{Client Name} — Proposal — {YYYY-MM-DD}`
- **Author:** `Domo, Inc.`
- **Subject:** the engagement title from the JSON
- **Keywords:** `Domo, proposal, {client name}, {engagement title}`

Title-case styling on the client name; ISO date in the title for sortability in file managers.

### 6. The interactive proposal's Export to PDF button is unchanged

This skill does **not** modify `template.html` or the interactive proposal's behavior. The Export to PDF button continues to do `window.print()` against the local browser's print dialog — that's the self-service path for most clients. This skill is a **parallel** path you invoke when the self-service PDF isn't polished enough.

---

## File reference

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — persona, rules, workflow, versioning |
| `render.py` | Renderer: engagement content JSON → polished PDF via headless Chromium |
| `examples/pha-2026.pdf` | Pacific Healthcare Association proposal rendered as polished PDF — canonical reference |
| `CHANGELOG.md` | Version history |
| `CONTRIBUTING.md` | How to extend this skill (footer customization, custom margins, alternate templates) |

There is **no `template.html` in this skill** — the renderer reuses `domo-interactive-proposal-builder/template.html` as its source of truth. There is **no separate schema** — the renderer reads the same `proposal_content.json` that the proposal builder consumes.

---

## Authoring workflow

### Inputs you should have

1. A finalized engagement content JSON (typically produced by `domo-interactive-proposal-builder`; can also be hand-authored)
2. The interactive proposal already validated against its schema (this skill assumes the JSON is well-formed; it does not re-run schema validation — the proposal-builder generator does that)

### Workflow

1. **Confirm the JSON is final.** This is the same JSON that drives the interactive proposal; make sure it's locked.
2. **Render** via `python render.py path/to/proposal_content.json output.pdf`.
   - If the output path is omitted, writes to `<input>.pdf` alongside the JSON.
3. **Open the rendered PDF** — verify the polished output. Footer reads correctly, page numbers are right, colors are preserved (Pacific Drift palette intact), every panel is present, every solution is expanded, every deliverable shows the three labeled detail blocks.
4. **Send the PDF to the client** — via email, shared drive, or procurement portal. The client receives a flat, offline-readable artifact with no browser chrome.

### Round-trip with the other renderers

```
proposal_content.json
     ├── domo-interactive-proposal-builder/generate.py  → output.html  (interactive proposal — review + self-service PDF)
     └── domo-proposal-pdf-renderer/render.py           → output.pdf   (polished PDF — RFP/procurement)
```

Both outputs reflect the same underlying truth. If the interactive proposal is right, the polished PDF is right.

---

## Setup — one-time per machine

This skill depends on **Playwright** (Python) and a Playwright-managed **Chromium** binary. Install once:

```bash
pip install --break-system-packages playwright
playwright install chromium
```

The Chromium download is roughly 150 MB and lands in Playwright's managed cache (typically `~/Library/Caches/ms-playwright` on macOS). It does **not** clobber Google Chrome or any other browser; Playwright runs its own dedicated Chromium and never touches the user's daily-driver browser.

Verify the install:

```bash
python -c "from playwright.sync_api import sync_playwright; print('ok')"
```

If `render.py` is invoked without Playwright installed, it exits with a clear install hint and a non-zero status.

---

## Why headless Chromium (and not WeasyPrint or wkhtmltopdf)

The interactive proposal's `template.html` relies on:

- **JavaScript-driven interactivity** — even though `@media print` flattens the document via CSS alone, the underlying DOM still uses JS-managed classes (`.active`, `.open`) for the screen presentation. Tools that render HTML without a JS engine (WeasyPrint, wkhtmltopdf in its newer Qt-less builds) skip JS and produce inconsistent output.
- **Modern CSS** — `position: sticky`, CSS grid with subgrid hints, custom properties used in inline styles, `print-color-adjust`. WeasyPrint and wkhtmltopdf have spotty support.
- **SVG with CSS variables** — the Domo Momentum diagram inlines SVG that references `var(--cs1)` etc. Only a real browser engine resolves these correctly.

Headless Chromium is the same engine that renders the interactive proposal in the user's browser. Using it for the PDF means the PDF cannot diverge from the screen presentation.

---

## Versioning

Semantic versioning. Current version: **0.1.1**.

- **MAJOR** — schema breaks (rare; this skill consumes the proposal-builder's schema and only breaks if that schema breaks). Coordinated bump with `domo-interactive-proposal-builder`.
- **MINOR** — new optional renderer flags (e.g. cover page toggle, watermark support, alternate footer formats), new PDF-specific output presets.
- **PATCH** — footer tuning, page-break refinements, metadata adjustments, dependency version bumps.

Every change is logged in `CHANGELOG.md`.

This skill is **coupled** to `domo-interactive-proposal-builder` via the shared template and JSON schema. Schema changes that affect any field consumed during PDF rendering require coordinated bumps.

---

## Planned fast-follows

- **v0.2.0** — optional cover-page preset (full-bleed Pacific Drift gradient, client logo placeholder, single-page summary card) selectable via a render flag.
- **v0.2.0** — optional watermark presets (DRAFT, CONFIDENTIAL — DO NOT DISTRIBUTE, REDLINE) for in-flight reviews.
- **v0.3.0** — bookmark/outline generation so the PDF table-of-contents in PDF readers mirrors the eight-tab structure of the interactive proposal (Executive Summary → Scope & Effort → Data Sources → …).
- A `validate.py` checker that opens both the rendered HTML and the rendered PDF and cross-references key totals (roadmap hours, recommended cost, payback months) to catch any divergence between renderers.
