#!/usr/bin/env python3
"""
domo-discovery-brief — JSON → Markdown renderer
================================================

Reads a Discovery Brief JSON payload (conforming to schema.json) and renders the
human-readable markdown brief via Jinja2 (template.md).

This renderer is intentionally simple — most of the "intelligence" of the
Discovery Brief lives in Claude's authoring (extracting structure from raw
discovery material). The Python here just turns the structured JSON into a
clean markdown document for human review.

Usage:
    python render.py path/to/brief.json [output.md]

If output.md is omitted, writes to <input>.md alongside the JSON.
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict

try:
    from jinja2 import Environment, FileSystemLoader, ChainableUndefined
except ImportError:
    sys.exit(
        "Missing dependency: jinja2.\n"
        "Install with: pip install --break-system-packages jinja2\n"
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fmt_date_display(date_str: str) -> str:
    """Convert YYYY-MM-DD → 'Month D, YYYY'. Best-effort; passes through on failure."""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return date_str
    return d.strftime("%B %-d, %Y") if sys.platform != "win32" else d.strftime("%B %#d, %Y")


def validate_payload(payload: Dict[str, Any], schema: Dict[str, Any]) -> None:
    """Validate the payload against the JSON schema. Best-effort if jsonschema is installed."""
    try:
        import jsonschema  # type: ignore
    except ImportError:
        required = schema.get("required", [])
        missing = [k for k in required if k not in payload]
        if missing:
            raise ValueError(
                f"Discovery Brief payload missing required top-level keys: {missing}\n"
                "Install `jsonschema` for full validation: "
                "pip install --break-system-packages jsonschema"
            )
        return

    try:
        jsonschema.validate(instance=payload, schema=schema)
    except jsonschema.ValidationError as e:
        path = " → ".join(str(p) for p in e.absolute_path) or "(root)"
        raise ValueError(f"Schema validation failed at: {path}\n  {e.message}") from e


def enrich_context(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Add display-formatted dates and any other derived values the template needs."""
    ctx = json.loads(json.dumps(payload))  # deep copy

    meta = ctx.setdefault("meta", {})
    if "brief_date" in meta:
        meta["brief_date_display"] = fmt_date_display(meta["brief_date"])
    meta.setdefault("confidentiality", "Internal — Pre-Sales")
    meta.setdefault("brief_version", "v1.0")

    discovery = ctx.setdefault("discovery", {})
    if discovery.get("date"):
        discovery["date_display"] = fmt_date_display(discovery["date"])

    return ctx


# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------

def render(json_path: Path, output_path: Path | None = None) -> Path:
    skill_dir   = Path(__file__).parent
    schema_path = skill_dir / "schema.json"
    template_path = skill_dir / "template.md"

    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")

    payload = json.loads(json_path.read_text(encoding="utf-8"))

    if schema_path.exists():
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        validate_payload(payload, schema)

    context = enrich_context(payload)

    # Note on whitespace: markdown is whitespace-sensitive (blank lines separate
    # blocks). trim_blocks/lstrip_blocks cause spurious line-merges in markdown
    # output, so they're DISABLED here. The template uses {%- -%} explicitly
    # where it wants to strip whitespace. This is the inverse of the SOW's HTML
    # renderer, where trim_blocks helps.
    env = Environment(
        loader=FileSystemLoader(str(skill_dir)),
        undefined=ChainableUndefined,
        autoescape=False,
        trim_blocks=False,
        lstrip_blocks=False,
        keep_trailing_newline=True,
    )
    template = env.get_template("template.md")
    md = template.render(**context)

    if output_path is None:
        output_path = json_path.with_suffix(".md")
    output_path.write_text(md, encoding="utf-8")
    return output_path


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
