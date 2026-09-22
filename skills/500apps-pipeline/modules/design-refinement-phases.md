# Design refinement phases (1–6)

Optional **multi-pass** loop inside **`05b`**. Stop when quality target hit or **pass cap** reached (set cap explicitly in the job brief, e.g. 2–3 passes).

| Phase | Focus | Typical actions |
|-------|--------|-----------------|
| **1 — Structure** | Layout, sections, navigation | Reorder blocks; sticky headers; group related metrics |
| **2 — Data clarity** | Labels, units, axes, legends | Fix dual axes; clarify KPI definitions; tooltips |
| **3 — Interaction** | Filters, loading, feedback | Debounce; skeletons; optimistic UI only when safe |
| **4 — Visual polish** | Spacing, type scale, iconography | Align to design-system check |
| **5 — Brand** | Color, voice, density | Customer tokens; tone in microcopy |
| **6 — Accessibility** | Contrast, focus, semantics | ARIA where needed; keyboard path |

## How to use

1. Enter at the **lowest phase** that addresses the **top audit finding** (not always phase 1).  
2. After each pass, **re-score** audit dimensions that moved.  
3. Document **stop reason** (target met / cap / diminishing returns).
