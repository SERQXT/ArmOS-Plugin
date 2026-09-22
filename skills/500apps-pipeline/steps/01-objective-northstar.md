# Stage C — Objective / north star

**Maps to pipeline stage:** C

## Inputs

- Output of `00-intake-fields.md`.
- Survey-grounded outcome themes (see `modules/outcome-discovery-brief.md` for mapping).

## Outputs

- `500apps/{account}/objective/NORTHSTAR.md` containing:
  - **Hero metric** — the ONE metric this app exists to move, structured as a today/target/why table with verbatim evidence from the survey or Gong call. Include 3-5 supporting metrics that ladder to the hero. See `modules/prd-quality-patterns.md` §1 for the template. Every CTA in the app must ladder to one of these metrics.
  - **Business outcome** — what success looks like for the business.
  - **User actions** — what the primary user does in the app.
  - **Agentic behaviors** — where automation or guided flows replace manual BI-style clicks (proportionate to scope).
  - **Adoption hook** — why users return (lightweight, credible).
  - **Evidence grounding** — each outcome must cite the survey field or Gong excerpt it comes from, with speaker attribution when available. Not "reduce costs" but "'always kind of a made up number' (Dan Stagnitta, intake 2026-04-07) — target: every dollar tied to a folio line."

## Instructions

**Outcome framing:** Treat `NORTHSTAR.md` as the **philosophy anchor** — success is **measurable impact** for the business and user, not a feature backlog. Overshoot **outcomes**, not screen count; reopening the doc later should use the **same** outcome language at the end as at the start (anti-drift bookend) — **`modules/enterprise-prompt-patterns.md` §2**.

1. Tie statements to **survey evidence** where possible; label inference clearly.
2. **Thin intake is normal** — even a **few short survey answers** should still yield a **multi-angle** north star: business outcome, user job-to-be-done, how the app changes behavior, adoption, and (where relevant) ecosystem fit. The goal is to **arrive at discovery** showing we understood the problem **comprehensively**, not that we had perfect data upfront.
3. Keep **one screen** of executive clarity — detailed specs belong in F.
4. Align language with **D** (surfaces) and **E** (data) without duplicating full spec content.
5. Note that **human discovery** will deepen/refine this later — do not pretend the survey is the full truth.

## Checkpoint

When `NORTHSTAR.md` is written:

```
@500apps-pipeline checkpoint=stage-c status=complete
```
