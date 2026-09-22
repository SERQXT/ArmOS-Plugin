# Screen coverage checklist (all built surfaces)

Use **first** inside **`05b-ux-expert-iteration.md`**, before static audit scores, so **no shipped screen is skipped** in critique.

## Build the inventory

**Two deployables:** If **`BUILD-SPEC.md`** includes **engagement context app** + **MVP1**, add **one row** for the **entire context app** (note sections/tabs inside it) **and** list **each** MVP1 screen/route/modal. From **`spec/SURFACE-PLAN.md`** and the running apps, list **every** distinct surface — including **mock / teaser** inside **MVP1**.

| Column | Meaning |
|--------|---------|
| **Surface** | Name + how to reach it (URL hash, nav label, etc.). |
| **Class** | **`built`** (functional MVP) or **`mock-teaser`** (labeled non-production; upsell / phase-2 conversation starter). |
| **Critique visited?** | Y / N — you actually opened it during this pass. |
| **Notes** | One line: issue, praise, or “mock — label/readability OK”. |

## Gate rule

- **Every `built` surface** must be **visited** and have **at least one** critique line (pillar or dimension reference). If any **`built`** row is still N, the UX pass is **incomplete**.  
- **`mock-teaser`** surfaces: lighter bar — **clearly labeled** as non-production, **readable**, **on-brand**; must not confuse users into thinking the feature is fully live. One line each is enough unless broken.

## Link to interactive tests

The **drawer / table / filter** tests in **`interactive-state-testing.md`** apply to surfaces that contain those patterns — run them **per surface type** as relevant (e.g. two different list screens = repeat key tests if patterns differ).

## Output

Add a **“Screen coverage”** table (this inventory) at the **top** of the UX report body, before pillar scores.
