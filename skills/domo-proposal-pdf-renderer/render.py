#!/usr/bin/env python3
"""
domo-proposal-pdf-renderer — engagement content JSON → polished PDF
====================================================================

Reads an engagement content JSON payload (the same payload consumed by
`domo-interactive-proposal-builder`) and produces a polished,
signature-quality PDF using headless Chromium via Playwright.

Single source of truth: the engagement content JSON. The interactive
proposal (HTML) and this polished PDF must never disagree on numbers. The
PDF is rendered against the same `template.html` that
`domo-interactive-proposal-builder` uses, so visual fidelity to the
interactive review is guaranteed.

Output features:
    - No browser-imposed URL/timestamp chrome
    - Domo-branded footer with page numbers on every page
    - PDF metadata set (Title, Author, Subject) for clean document-manager rendering
    - Pacific Drift palette preserved via `print-color-adjust: exact`
    - Every tab/panel/phase/deliverable flattened and force-expanded

Usage:
    python render.py path/to/proposal_content.json [output.pdf]

If output.pdf is omitted, writes to <input>.pdf alongside the JSON.

Setup (one-time per machine):
    pip install --break-system-packages playwright
    playwright install chromium
"""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict


# ---------------------------------------------------------------------------
# Locate the proposal-builder skill (sibling plugin within this marketplace)
# ---------------------------------------------------------------------------

def find_proposal_builder() -> Path:
    """
    Locate `domo-interactive-proposal-builder` so we can reuse its
    `generate.py` and `template.html`. The renderer assumes the standard
    marketplace layout:

        plugins/domo-proposal-pdf-renderer/skills/domo-proposal-pdf-renderer/render.py
        plugins/domo-interactive-proposal-builder/skills/domo-interactive-proposal-builder/

    Both iteration mode (symlinks under ~/.claude/skills) and marketplace
    install mode produce the same relative layout, so this resolution works
    in both setups.
    """
    here = Path(__file__).resolve().parent  # .../skills/domo-proposal-pdf-renderer
    # Walk up to find the `plugins` directory
    for parent in [here] + list(here.parents):
        if parent.name == "plugins":
            sibling = parent / "domo-interactive-proposal-builder" / "skills" / "domo-interactive-proposal-builder"
            if sibling.exists():
                return sibling
            break
    raise FileNotFoundError(
        "Could not locate the `domo-interactive-proposal-builder` skill. "
        "This skill expects to live as a sibling plugin in the same marketplace clone. "
        "Verify your plugin install or iteration symlink layout."
    )


def load_proposal_builder_module(skill_dir: Path):
    """
    Import the proposal-builder's generate.py as a Python module so we can
    call its render() and enrich_context() functions directly. Subprocess
    would also work but importing keeps error messages cleaner and avoids
    interpreter-version surprises.
    """
    generate_py = skill_dir / "generate.py"
    if not generate_py.exists():
        raise FileNotFoundError(f"Expected proposal-builder generator at {generate_py}")
    spec = importlib.util.spec_from_file_location("_proposal_builder_generate", generate_py)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["_proposal_builder_generate"] = mod
    spec.loader.exec_module(mod)  # type: ignore
    return mod


# ---------------------------------------------------------------------------
# Footer template — rendered by Playwright on every page
# ---------------------------------------------------------------------------

def build_footer_template(client_name: str, generated_date_display: str) -> str:
    """
    Build the HTML used as Playwright's footer_template. Playwright renders
    this on every page; `<span class="pageNumber">` and `<span class="totalPages">`
    are recognized placeholders that Chromium fills in.

    Constraints (from Chromium's pdf footer rendering):
      - Default font size is very small unless we set it explicitly
      - Colors must be inline; external stylesheets do not load
      - Width spans the page; we use flex to push page numbers right
    """
    # Escape minimally — these come from JSON and may contain ampersands
    def esc(s: str) -> str:
        return (
            str(s or "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )
    left = f"Domo Confidential · Prepared for {esc(client_name)}"
    if generated_date_display:
        left += f" · {esc(generated_date_display)}"
    return (
        '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; '
        'font-size: 8.5pt; color: #5a6577; padding: 0 12mm; width: 100%; '
        'display: flex; justify-content: space-between; align-items: center; '
        '-webkit-print-color-adjust: exact;">'
        f'<span>{left}</span>'
        '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>'
        '</div>'
    )


# ---------------------------------------------------------------------------
# PDF metadata helpers
# ---------------------------------------------------------------------------

def derive_pdf_title(payload: Dict[str, Any]) -> str:
    client = payload.get("client", {}).get("name") or "Client"
    gen = payload.get("meta", {}).get("generated_date") or date.today().isoformat()
    return f"{client} — Proposal — {gen}"


def derive_keywords(payload: Dict[str, Any]) -> str:
    client = payload.get("client", {}).get("name", "")
    title = _strip_html(payload.get("engagement", {}).get("title", ""))
    parts = ["Domo", "proposal"]
    if client:
        parts.append(client)
    if title:
        parts.append(title)
    return ", ".join(p for p in parts if p)


# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------

def render(json_path: Path, output_path: Path | None = None) -> Path:
    # 1. Locate the proposal-builder and import its module
    proposal_builder_dir = find_proposal_builder()
    pb = load_proposal_builder_module(proposal_builder_dir)

    # 2. Render the HTML to a temp file using the proposal-builder's renderer
    with tempfile.TemporaryDirectory(prefix="domo-pdf-render-") as tmpdir:
        tmp_html = Path(tmpdir) / "proposal.html"
        pb.render(json_path, tmp_html)

        # 3. Read the JSON for footer + metadata
        payload = json.loads(json_path.read_text(encoding="utf-8"))
        client_name = payload.get("client", {}).get("name", "")
        generated_date_display = (
            payload.get("meta", {}).get("generated_date_display")
            or _fmt_date(payload.get("meta", {}).get("generated_date", ""))
        )

        # 4. Determine the output path
        if output_path is None:
            output_path = json_path.with_suffix(".pdf")
        output_path = Path(output_path).resolve()

        # 5. Render PDF with Playwright
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            sys.exit(
                "Missing dependency: playwright.\n"
                "Install with:\n"
                "  pip install --break-system-packages playwright\n"
                "  playwright install chromium\n"
                "(Chromium download is ~150 MB and lands in Playwright's managed cache.)\n"
            )

        footer_html = build_footer_template(client_name, generated_date_display)

        with sync_playwright() as p:
            browser = p.chromium.launch()
            try:
                context = browser.new_context()
                page = context.new_page()
                # file:// URL so the page can resolve any relative assets the
                # template references (the canonical template is single-file,
                # but this is the safe default).
                page.goto(tmp_html.as_uri(), wait_until="networkidle")
                # Force print media so all @media print rules apply
                page.emulate_media(media="print")
                # Set the document title — used by some PDF readers as fallback metadata
                pdf_title = derive_pdf_title(payload)
                page.evaluate(f"document.title = {json.dumps(pdf_title)}")

                page.pdf(
                    path=str(output_path),
                    format="Letter",
                    print_background=True,
                    margin={
                        "top": "12mm",
                        "bottom": "16mm",   # extra room for the footer
                        "left": "12mm",
                        "right": "12mm",
                    },
                    display_header_footer=True,
                    header_template="<span></span>",
                    footer_template=footer_html,
                    prefer_css_page_size=False,
                )
            finally:
                browser.close()

        # 6. Patch PDF metadata (Title/Author/Subject/Keywords) post-render.
        # Chromium's page.pdf() writes a Title from document.title but does
        # not expose Author/Subject/Keywords slots. We append a /Info dict
        # update so the PDF reads cleanly in document managers.
        _patch_pdf_metadata(
            output_path,
            title=derive_pdf_title(payload),
            author="Domo, Inc.",
            subject=_strip_html(payload.get("engagement", {}).get("title", "Domo client proposal")),
            keywords=derive_keywords(payload),
        )

    return output_path


# ---------------------------------------------------------------------------
# Tiny helpers (kept private — no external deps)
# ---------------------------------------------------------------------------

def _strip_html(s: str) -> str:
    """Strip HTML tags, replacing block-level breaks with spaces so concatenated
    text (e.g. "Pacific Healthcare Association<br>Data Modernization Platform")
    doesn't lose the word boundary in plain-text contexts like PDF metadata."""
    import re
    text = re.sub(r"<\s*br\s*/?\s*>", " ", str(s or ""), flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _fmt_date(date_str: str) -> str:
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return date_str or ""
    return d.strftime("%B %-d, %Y") if sys.platform != "win32" else d.strftime("%B %#d, %Y")


def _patch_pdf_metadata(
    pdf_path: Path,
    *,
    title: str,
    author: str,
    subject: str,
    keywords: str,
) -> None:
    """
    Append an updated /Info dictionary to the rendered PDF so document
    managers and email previews show clean metadata.

    Implementation: we rewrite the PDF using pypdf if available, otherwise
    we fall back to leaving Chromium's defaults in place (Title is already
    set from document.title; Author/Subject/Keywords stay blank). The
    fallback is acceptable — the renderer succeeds either way.
    """
    try:
        from pypdf import PdfReader, PdfWriter  # type: ignore
    except ImportError:
        return  # silent fallback — Chromium's Title is already set

    try:
        reader = PdfReader(str(pdf_path))
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        # Preserve any existing metadata then overlay our values
        existing = dict(reader.metadata or {})
        existing.update({
            "/Title":    title,
            "/Author":   author,
            "/Subject":  subject,
            "/Keywords": keywords,
            "/Producer": "domo-proposal-pdf-renderer (headless Chromium / Playwright)",
        })
        writer.add_metadata(existing)
        with open(pdf_path, "wb") as fh:
            writer.write(fh)
    except Exception:
        # Metadata patching is non-critical — never let it fail the render
        return


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__.strip())
        return 0 if len(sys.argv) >= 2 else 2

    json_path = Path(sys.argv[1]).resolve()
    if not json_path.exists():
        print(f"Error: input JSON not found: {json_path}", file=sys.stderr)
        return 2

    output_path = Path(sys.argv[2]).resolve() if len(sys.argv) >= 3 else None

    try:
        out = render(json_path, output_path)
    except (ValueError, FileNotFoundError) as e:
        print(f"Render failed: {e}", file=sys.stderr)
        return 1

    print(f"✓ Rendered: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
