#!/usr/bin/env python3
"""
domo-interactive-proposal-builder — JSON → HTML renderer
========================================================

Reads an engagement content payload (JSON conforming to schema.json) and renders
the final interactive proposal HTML document via the Jinja2 template (template.html).

Computes all derived values up-front so the template stays focused on layout:
  - Per-solution hours (high-end sum from loe_rows) + roadmap total
  - Total Investment from roadmap_high × rate_default
  - Timeline bar positions (% left, % width) from weeks_start/weeks_end
  - ROI math: payback months, 3-year net value, ROI multiple
  - Solution color CSS variables (defaults --cs1..cs5 by index)

Schema 0.5.0 renamed `phases` → `solutions` and `phase_id` → `solution_id`. The
internal iteration variable is `sol` rather than `phase` to avoid confusion with
the LOE row work-item "Solution Design & Architecture".

Usage:
    python generate.py path/to/sow_content.json [output.html]

If output.html is omitted, writes to <input>_rendered.html alongside the JSON.

Schema validation is best-effort: requires `jsonschema` if installed, else
performs a minimal structural check.
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
# Constants — kept here so they're easy to find and tune
# ---------------------------------------------------------------------------

DEFAULT_CHART_VARS = ["--cs1", "--cs2", "--cs3", "--cs4", "--cs5", "--cs6"]
PROJECTION_YEARS = 3               # 3-year ROI multi-year window


# ---------------------------------------------------------------------------
# Derived-value helpers
# ---------------------------------------------------------------------------

def round_int(value: float) -> int:
    """Round to the nearest integer (banker's rounding avoided — straight half-up)."""
    return int(value + 0.5) if value >= 0 else -int(-value + 0.5)


def fmt_money_short(value: float) -> str:
    """Format a dollar value as e.g. '$460K' or '$2.00M'. Used in tile values."""
    abs_v = abs(value)
    if abs_v >= 1_000_000:
        formatted = f"{value / 1_000_000:.2f}".rstrip("0").rstrip(".")
        return f"${formatted}M"
    if abs_v >= 1_000:
        return f"${round_int(value / 1_000)}K"
    return f"${round_int(value):,}"


def fmt_credits_short(value: float) -> str:
    """Format a credit count as e.g. '125K' or '1.4M'. No leading symbol — credits, not dollars."""
    abs_v = abs(value)
    if abs_v >= 1_000_000:
        formatted = f"{value / 1_000_000:.2f}".rstrip("0").rstrip(".")
        return f"{formatted}M"
    if abs_v >= 1_000:
        return f"{round_int(value / 1_000)}K"
    return f"{round_int(value):,}"


def fmt_credit_range(low: int, high: int) -> str:
    """Format a credit low/high pair as 'XK – YK' (en dash) using the short formatter."""
    return f"{fmt_credits_short(low)}–{fmt_credits_short(high)}"


def fmt_date_display(date_str: str) -> str:
    """Convert YYYY-MM-DD → 'Month D, YYYY'. Best-effort; passes through on failure."""
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return date_str
    return d.strftime("%B %-d, %Y") if sys.platform != "win32" else d.strftime("%B %#d, %Y")


# ---------------------------------------------------------------------------
# Schema validation (lightweight)
# ---------------------------------------------------------------------------

def validate_payload(payload: Dict[str, Any], schema: Dict[str, Any]) -> None:
    """Validate the payload against the JSON schema. Uses jsonschema if available."""
    try:
        import jsonschema  # type: ignore
    except ImportError:
        # Minimal fallback: just check the top-level required keys
        required = schema.get("required", [])
        missing = [k for k in required if k not in payload]
        if missing:
            raise ValueError(
                f"Payload missing required top-level keys: {missing}\n"
                "Install `jsonschema` for full validation: "
                "pip install --break-system-packages jsonschema"
            )
        return

    try:
        jsonschema.validate(instance=payload, schema=schema)
    except jsonschema.ValidationError as e:
        # Re-raise with a friendlier message pointing at the path
        path = " → ".join(str(p) for p in e.absolute_path) or "(root)"
        raise ValueError(
            f"Schema validation failed at: {path}\n  {e.message}"
        ) from e


# ---------------------------------------------------------------------------
# Context enrichment — compute all derived values
# ---------------------------------------------------------------------------

def enrich_context(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Take the raw JSON payload and add all the derived values the template needs.
    Centralized here so the template stays simple.
    """
    ctx = json.loads(json.dumps(payload))  # deep copy via JSON round-trip

    # ---- meta enrichment ----
    meta = ctx.setdefault("meta", {})
    if "generated_date" in meta:
        meta["generated_date_display"] = fmt_date_display(meta["generated_date"])
        try:
            meta["generated_date_year"] = meta["generated_date"][:4]
        except Exception:
            meta["generated_date_year"] = str(date.today().year)
    else:
        meta["generated_date_display"] = date.today().strftime("%B %-d, %Y")
        meta["generated_date_year"] = str(date.today().year)
    meta.setdefault("confidentiality", "Confidential")
    meta.setdefault("sow_version", "v1.0")

    # ---- engagement defaults ----
    eng = ctx.setdefault("engagement", {})
    eng.setdefault("rate_default", 275)
    eng.setdefault("rate_floor", 150)
    eng.setdefault("rate_ceiling", 500)

    # ---- pillars: assign default color vars by index ----
    for i, pillar in enumerate(ctx.get("executive_summary", {}).get("pillars", [])):
        pillar["color_var_resolved"] = pillar.get("color_var") or DEFAULT_CHART_VARS[i % len(DEFAULT_CHART_VARS)]

    # ---- solutions: compute hours (high), color, badge defaults, timeline geometry ----
    solutions = ctx.get("solutions", [])
    if not solutions:
        raise ValueError("Payload must include at least one solution.")

    # Mark first solution as priority if not explicitly set
    if not any(s.get("is_priority") for s in solutions):
        solutions[0]["is_priority"] = True

    # Compute timeline span across all solutions for bar positioning
    weeks_start_min = min(s.get("weeks_start", 1) for s in solutions)
    weeks_end_max   = max(s.get("weeks_end",   s.get("weeks_start", 1) + 4) for s in solutions)
    span = max(1, weeks_end_max - weeks_start_min)

    for i, sol in enumerate(solutions):
        # Default color
        sol["color_var_resolved"] = sol.get("color_var") or DEFAULT_CHART_VARS[i % len(DEFAULT_CHART_VARS)]

        # Default badge
        sol.setdefault("badge", "track")

        # Recompute solution hours from loe_rows so the LOE table, solution card
        # summaries, Timeline column, and ROI cost table all reconcile to the
        # same source of truth. Author-supplied solution.hours is overridden —
        # loe_rows is canonical.
        rows = sol.get("loe_rows") or []
        hrs = sol.setdefault("hours", {})
        if rows:
            hrs["low"]  = sum(int(r["hours"]["low"])  for r in rows)
            hrs["high"] = sum(int(r["hours"]["high"]) for r in rows)
        # Recommended kept in the payload only as a derived value for any
        # legacy consumer that still reads it; the rendered proposal displays
        # the high-end value consistently across every tab.
        hrs.setdefault("recommended", hrs.get("high", 0))

        # Timeline bar position (as %)
        ws = sol.get("weeks_start", weeks_start_min)
        we = sol.get("weeks_end",   ws + 4)
        sol["bar_left_pct"]  = round_int((ws - weeks_start_min) / span * 100)
        sol["bar_width_pct"] = round_int((we - ws) / span * 100)

    # ---- milestones: assign color vars from solution colors by ordering ----
    milestones = ctx.get("timeline", {}).get("milestones", [])
    for i, ms in enumerate(milestones):
        ms["color_var_resolved"] = ms.get("color_var") or (
            solutions[i]["color_var_resolved"] if i < len(solutions) else DEFAULT_CHART_VARS[i % len(DEFAULT_CHART_VARS)]
        )

    # ---- totals: roadmap hours, costs, ROI math ----
    rate = eng["rate_default"]
    roadmap_low  = sum(s["hours"]["low"]  for s in solutions)
    roadmap_high = sum(s["hours"]["high"] for s in solutions)

    cost_low  = roadmap_low  * rate
    cost_high = roadmap_high * rate

    drivers = ctx.get("roi", {}).get("drivers", [])
    if not drivers:
        raise ValueError("ROI section must include at least one value driver.")
    annual_cons    = sum(d["annual_conservative"] for d in drivers)
    annual_stretch = sum(d["annual_stretch"]      for d in drivers)

    if annual_cons    <= 0 or annual_stretch <= 0:
        raise ValueError("Annual ROI driver totals must be positive.")
    if cost_high      <= 0:
        raise ValueError("Total investment must be positive (check solution hours).")

    # Payback / 3-yr / multiple are computed against the displayed Total Investment
    # (cost_high). Keeps every ROI figure on the tab math-consistent with the
    # single Total Investment number.
    payback_cons_months    = cost_high / annual_cons    * 12
    payback_stretch_months = cost_high / annual_stretch * 12

    net_3yr_cons    = annual_cons    * PROJECTION_YEARS - cost_high
    net_3yr_stretch = annual_stretch * PROJECTION_YEARS - cost_high

    multiple_cons    = annual_cons    * PROJECTION_YEARS / cost_high
    multiple_stretch = annual_stretch * PROJECTION_YEARS / cost_high

    total_weeks = weeks_end_max - weeks_start_min + 1

    ctx["totals"] = {
        "roadmap_low":  roadmap_low,
        "roadmap_high": roadmap_high,
        "cost_low":  cost_low,
        "cost_high": cost_high,
        "annual_conservative": annual_cons,
        "annual_stretch":      annual_stretch,
        "annual_conservative_short": fmt_money_short(annual_cons),
        "annual_stretch_short":      fmt_money_short(annual_stretch),
        "payback_conservative_months": f"{payback_cons_months:.1f}",
        "payback_stretch_months":      f"{payback_stretch_months:.1f}",
        "net_3yr_conservative":        net_3yr_cons,
        "net_3yr_stretch":             net_3yr_stretch,
        "net_3yr_conservative_short":  fmt_money_short(net_3yr_cons),
        "net_3yr_stretch_short":       fmt_money_short(net_3yr_stretch),
        "roi_multiple_conservative":   f"{multiple_cons:.1f}",
        "roi_multiple_stretch":        f"{multiple_stretch:.1f}",
        "total_weeks": total_weeks,
    }

    # ---- credit_impact: aggregate driver rows into category subtotals + annual totals ----
    credit_impact = ctx.get("credit_impact")
    if credit_impact:
        cdrivers = credit_impact.get("drivers", [])

        # Per-row formatted display strings
        for d in cdrivers:
            for year_key in ("y1", "y3", "y5"):
                year = d.get(year_key, {}) or {}
                low  = int(year.get("low",  0) or 0)
                high = int(year.get("high", 0) or 0)
                year["display"] = fmt_credit_range(low, high)
                d[year_key] = year

        # Annual totals across all drivers
        def _sum_year(rows: list, year_key: str, bound: str) -> int:
            return sum(int(((r.get(year_key) or {}).get(bound) or 0)) for r in rows)

        total_y1_low,  total_y1_high  = _sum_year(cdrivers, "y1", "low"), _sum_year(cdrivers, "y1", "high")
        total_y3_low,  total_y3_high  = _sum_year(cdrivers, "y3", "low"), _sum_year(cdrivers, "y3", "high")
        total_y5_low,  total_y5_high  = _sum_year(cdrivers, "y5", "low"), _sum_year(cdrivers, "y5", "high")

        # Solution × category grouping for table rendering
        category_order = [
            "Data Pipelines", "Dashboards & Views", "AI Primitives",
            "Code Engine", "Workflows", "Embed/Everywhere", "Storage", "Other",
        ]

        grouped = []
        for sol in solutions:
            sol_drivers = [d for d in cdrivers if d.get("solution_id") == sol["id"]]
            if not sol_drivers:
                continue
            categories = []
            seen_categories = {}
            for d in sol_drivers:
                cat = d.get("category", "Other")
                seen_categories.setdefault(cat, []).append(d)
            # Order categories by canonical sequence, putting unknowns last
            for cat in category_order:
                if cat in seen_categories:
                    categories.append({"name": cat, "drivers": seen_categories[cat]})
            for cat, rows in seen_categories.items():
                if cat not in category_order:
                    categories.append({"name": cat, "drivers": rows})
            grouped.append({
                "solution_id": sol["id"],
                "solution_number": sol["number"],
                "solution_title": sol["title"],
                "is_priority": sol.get("is_priority", False),
                "color_var_resolved": sol["color_var_resolved"],
                "badge": sol.get("badge", "track"),
                "categories": categories,
            })

        # Current envelope comparison (optional)
        envelope_block = None
        env = credit_impact.get("current_envelope")
        if env and env.get("annual_credits"):
            env_credits = int(env["annual_credits"])
            mid_y1 = (total_y1_low + total_y1_high) / 2 if total_y1_high else 0
            mid_y3 = (total_y3_low + total_y3_high) / 2 if total_y3_high else 0
            envelope_block = {
                "annual_credits":         env_credits,
                "annual_credits_short":   fmt_credits_short(env_credits),
                "label":                  env.get("label", "Current annual credit envelope"),
                "note":                   env.get("note", ""),
                "y1_pct":                 round_int(mid_y1 / env_credits * 100) if env_credits else 0,
                "y3_pct":                 round_int(mid_y3 / env_credits * 100) if env_credits else 0,
            }

        ctx["credit_totals"] = {
            "y1_low":          total_y1_low,
            "y1_high":         total_y1_high,
            "y1_display":      fmt_credit_range(total_y1_low, total_y1_high),
            "y3_low":          total_y3_low,
            "y3_high":         total_y3_high,
            "y3_display":      fmt_credit_range(total_y3_low, total_y3_high),
            "y5_low":          total_y5_low,
            "y5_high":         total_y5_high,
            "y5_display":      fmt_credit_range(total_y5_low, total_y5_high),
            "solution_groups": grouped,
            "envelope":        envelope_block,
        }

        # Default directional callout if author didn't provide one
        if not credit_impact.get("directional_callout"):
            credit_impact["directional_callout"] = {
                "variant": "risk",
                "title":   "Directional Forecast — Verified at Solution 1 Architecture Review",
                "body":    "These figures are a directional forecast based on the architecture proposed in this engagement, the user counts and frequencies described in the methodology block, and Domo's published credit consumption model. Final sizing is verified during Solution 1 architecture review against actual workloads, and re-baselined annually as adoption deepens. Treat the ranges above as planning anchors, not contractual commitments.",
            }

    # ---- footer fallback ----
    footer = ctx.setdefault("footer", {})
    if not footer.get("legal"):
        footer["legal"] = (
            f"© {meta['generated_date_year']} Domo, Inc. · Confidential &amp; "
            f"Proprietary · Prepared for {ctx.get('client', {}).get('name', '')}"
        )

    return ctx


# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------

def render(json_path: Path, output_path: Path | None = None) -> Path:
    skill_dir   = Path(__file__).parent
    schema_path = skill_dir / "schema.json"
    template_path = skill_dir / "template.html"

    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")

    payload = json.loads(json_path.read_text(encoding="utf-8"))

    # Validate (best-effort)
    if schema_path.exists():
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
        validate_payload(payload, schema)

    # Enrich
    context = enrich_context(payload)

    # Render via Jinja2
    env = Environment(
        loader=FileSystemLoader(str(skill_dir)),
        undefined=ChainableUndefined,        # treat missing optional fields as falsy
        autoescape=False,                    # we explicitly use |safe where needed
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template("template.html")
    html = template.render(**context)

    # Write output
    if output_path is None:
        output_path = json_path.with_name(json_path.stem + "_rendered.html")
    output_path.write_text(html, encoding="utf-8")
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
