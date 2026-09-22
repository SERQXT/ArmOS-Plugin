# Upgrade to 9/10 (time-boxed)

When schedule is tight, use this **after** initial audit scores exist. If BUILD-SPEC contains a **5-to-9/10 lift table** (see `prd-quality-patterns.md`), score against those explicit per-surface targets instead of only the aggregate audit average.

## Steps

1. **Assess** — record current **average** of the **13** audit dimensions. If BUILD-SPEC has a lift table, also note where each surface lands relative to its "9/10" target.
2. **Pick 3 upgrades** — only changes that move **multiple** dimensions or remove **blockers**. Use the priority framework below.
3. **Implement** — in v2 scope; avoid scope creep.
4. **Verify** — re-score affected dimensions; one paragraph "before/after."

## Priority framework (what to fix first)

1. **Viewport-first** — hero metric and primary CTA not visible without scroll? Fix this before anything else.
2. **CTA improvements** — primary action blends with surroundings, or competing CTAs confuse the user.
3. **Signal/noise reduction** — decorative clutter, chartjunk, or redundant elements competing with the primary content.
4. **Happy-path friction** — unnecessary clicks, dead-ends, or missing feedback on the most common workflow.
5. **Brand alignment** — tokens not matching brand kit, inconsistent shadows or radius, wrong font.

## Specific upgrade tactics (from the design playbook)

- **Staggered entrance animations** on card grids and list items (domoFadeInUp with delay offsets)
- **Shadow depth upgrade** — from flat single-source to layered `--shadow-sm/md/lg`
- **Typography weight hierarchy** — titles Bold 700, subtitles Light 300, body Regular 400 (clear visual levels)
- **Loading skeletons** — shimmer animations replacing static spinners
- **Number counting animation** on KPI values (animateValue with easeOutExpo)
- **Hover lift** on cards (translateY(-4px) + shadow-lg transition)

## Workflow optimizer lens

For each surface, ask: **"Does this surface make the user faster, smarter, or more confident at their job?"** If the answer is "it shows data" but not "it changes how they work," the surface is at 5/10 regardless of visual polish. The lift from 5 to 9 comes from workflow optimization — not prettier charts.

## Rules

- Do not claim "9/10" without **re-scoring evidence**.
- If blockers remain after 3 upgrades, list them for **human discovery** instead of stacking more changes.
