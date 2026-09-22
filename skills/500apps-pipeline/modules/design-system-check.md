# Design system check (generalized)

Generalized from internal "demo restaurant" patterns: apply to **this engagement's** brand, not a fixed template name.

**Brand at the token layer:** Customer colors and type should live in **semantic variables** so the whole app inherits — see **`enterprise-prompt-patterns.md` §6** (functional mapping: primary action, destructive, nav — not only logo). Reference `spec/BRAND-KIT.md` when available.

## Tokens & CSS

- **Semantic variables** — prefer `--color-*`, `--space-*`, `--font-*` over hard-coded hex in components.
- **Contrast** — text vs surface meets WCAG AA for body; AAA for small text where feasible.
- **Typography** — limited scale (e.g. 3-4 steps); consistent weight for headings vs body. Customer font for MVP apps, Open Sans for engagement context (see `visual-design-standard.md`).
- **Structural baseline** — use the shadow system (`--shadow-sm/md/lg`), border-radius scale (`6/8/12px`), and easing curve (`cubic-bezier(0.83, 0, 0.17, 1)`) from `domo-design-playbook.md` regardless of brand.

## Components

- **Cards** — padding, shadow, border-radius consistent; clear title vs metric vs context.
- **Charts** — gridlines subdued; **color + pattern** for series distinction; value labels where ambiguity exists.
- **Tooltips** — explain *definition*, not marketing fluff.
- **Tables** — zebra or row hover; align numbers right; sticky header for long lists.

## Motion

- Standard transitions: **0.3s** with `cubic-bezier(0.83, 0, 0.17, 1)` (the playbook easing).
- Micro-interactions (hover color, focus outline): **150ms**.
- Card grids and list items: use staggered entrance animations (`domoFadeInUp` with delay offsets).
- Loading states: shimmer skeletons (`domoShimmer`) over static spinners.
- Respect `prefers-reduced-motion`.

## Playbook compliance check

| Check | Pass criteria |
|-------|---------------|
| Shadows | Uses layered `--shadow-sm/md/lg` (dual-source), not flat single-source shadows |
| Border radius | Consistent scale: 6px (badges), 8px (buttons), 12px (cards) |
| Easing | Transitions use `cubic-bezier(0.83, 0, 0.17, 1)` or `cubic-bezier(0.16, 1, 0.3, 1)` |
| Entrance animations | Card grids have staggered fade-in, not instant render |
| Loading states | Shimmer skeletons for async data, not generic spinners |
| Number formatting | KPI values use `font-feature-settings: 'tnum' 1` (tabular numerals) |

## Output

- Checklist with **pass/fail** and **fix list** tied to v2 tasks.
