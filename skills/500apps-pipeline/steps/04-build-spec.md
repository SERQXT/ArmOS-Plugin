# Stage F — Build spec + MVP guardrails

**Maps to pipeline stage:** F — **only after D and E are complete**

## Inputs

- `objective/NORTHSTAR.md` (C) — **every in-scope feature** must support an outcome listed here (or be labeled explicit deferral).
- Surface plan from D, `spec/SAMPLE-DATA-PLAN.md` (E).

## Outputs

- **`500apps/{account}/spec/BRAND-KIT.md`** — customer's design identity. See `modules/prd-quality-patterns.md` §5 for the full template. Includes:
  - Customer logo (sourced online, background removed), clear-space rules
  - Color tokens mapped to semantic roles (primary, accent, surface, ink, state), with restraint rules
  - Typography (customer font + fallback chain, tabular numerals for KPI/currency)
  - CTA pattern (primary/secondary/tertiary with exact CSS)
  - Voice and microcopy guidelines (domain-appropriate language)

- **`500apps/{account}/spec/BUILD-SPEC.md`** including:
  - **Scope guards** — "What we are NOT building and why" — explicit exclusions framed as intentional design decisions. See `modules/prd-quality-patterns.md` §7.
  - **Two deliverables (default)** — **`engagement-context-app`** (separate template — **not** inside MVP1) + **`mvp1-app`**. See **`modules/engagement-context-app-template.md`**.  
  - **Layout** — **stacked** (context above, scroll to MVP1 on same page) **or** **App Studio**: **Tab 1** = engagement context app, **Tab 2** = MVP1.  
  - **Architecture (MVP1)** — dataset vs collections vs packages; vanilla vs React with rationale.
  - **Surfaces → build tasks (MVP1 only)** — traceable to D.
  - **Per-surface 5-to-9/10 lift table** — for each surface, define what "5/10 generic" looks like vs what "9/10 this build" delivers, with the mechanism. This is the **build target** for G1/J1. See `modules/prd-quality-patterns.md` §2.
  - **Per-surface viewport blueprint** — for each surface, specify what appears above the fold at 1440x900 (hero metric, primary CTA, key context). See `modules/prd-quality-patterns.md` §4.
  - **Timed happy-path target** — the primary workflow as a timed sequence ("User opens -> action -> action -> outcome in N steps"). G1/J1 must achieve this. See `modules/prd-quality-patterns.md` §3.
  - **Workflow optimizer framing** — each surface articulates HOW it makes the user massively better at their job (not "shows data" but "reduces the decision from 15 minutes to 30 seconds").
  - **Data bindings** — traceable to E.
  - **MVP1 intent** — demo / talking piece; align to **`NORTHSTAR.md`** from thin intake.
  - **Built vs mock-teaser** — inside **MVP1** only; mocks labeled honestly.
  - **MVP guardrails** — bounded scope; value + upsell path.
  - **Visual personality** — pick from `modules/visual-design-standard.md`: Executive Scannable, Operational Dense, Analytical Storytelling, or Bold Brand-Forward (or a blend of two). Derive from the brief's industry, contact title, and tuesday_user. Document the choice and why.
  - **Engagement context app** — **pre-built org template**; **draft slot copy** in this spec for **G1** first deploy; **H** finalizes **`ENGAGEMENT-CONTEXT-COPY.md`** (may require template refresh before customer call). Pairs with **internal** `DISCOVERY-EMAIL.md`.

## Instructions

**Blueprint density:** `BUILD-SPEC.md` should be **context-rich enough** that implementation (including a **later session or parallel pass**) does not re-discover datasets, handler names, or integration points from scratch. Include where Domo AI / automation is **meaningful** — with a sentence on *why* each is meaningful (reject gratuitous AI). If logic and UI are implemented separately, document **handler names, DOM ids, and bootstrap order** as an **interface contract** — **`modules/enterprise-prompt-patterns.md` §2 and §5**.

1. Reject scope creep: if new surfaces appear without D/E updates, **flag** and either update D/E or cut scope.
2. Reference **`app-orchestrator`** for routing; **`procode-app-builder`** for MVP1 implementation standards.
3. **Default:** spec includes **engagement context app** + **MVP1** as **siblings** — not one combined codebase for context + MVP.
4. State **acceptance checks** — include **both** apps deploy, **layout** works, **Tab 1 / top** is readable with **zero assumed prior knowledge**.

## Checkpoint

```
@500apps-pipeline checkpoint=stage-f status=complete
```
