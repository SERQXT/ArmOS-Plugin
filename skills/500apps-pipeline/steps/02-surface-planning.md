# Stage D — Surface planning

**Maps to pipeline stage:** D — **must run before build spec (F)**

## Inputs

- `objective/NORTHSTAR.md` (stage C) — **primary outcome anchor** for surfaces and journey.
- Outputs of stage B (`00-intake-fields`): normalized fields, roles, constraints.
- Optional: `objective/OUTCOME-BRIEF.md` if produced — must not contradict `NORTHSTAR.md`.

## Outputs

- **`spec/SURFACE-PLAN.md`** (exact filename — do not rename) with:
  - **Engagement context app (separate from MVP1)** — Yes by default; uses org **`engagement-context-app-template`** (`modules/engagement-context-app-template.md`) — only **slots + branding** intent here; **not** MVP screens.
  - **Layout intent** — Stacked page vs **App Studio Tab 1 / Tab 2** (context vs MVP1).
  - **MVP1 surfaces** — list of screens/views/cards in the **functional app** (names + primary job each).
  - **User journey** — primary path from entry to value (numbered steps).
  - **Above / below fold** — what must be visible without scroll on key **MVP1** surfaces.
  - **Scrolling strategy** — what loads later vs inline.
  - **Mobile vs desktop** — if relevant, one paragraph each.

### Process flow (use-case dependent)

If the engagement is **process- or workflow-heavy** (handoffs, triage, approvals, routing), also produce **`spec/PROCESS-FLOW.md`** using **`modules/process-flow-comparison.md`**: **current process**, **new process with the app in the loop**, **comparison** table, **Mermaid diagram**, and **open questions** for discovery. Surfaces in `SURFACE-PLAN.md` should **map to** steps in the to-be process where applicable.

### MVP1 as talking piece (not a finished product)

v1 is a **showcase**: prove **how** we solve the problem. Plan **`mock-teaser`** surfaces **inside MVP1** for adjacent value and upsell tease — **labeled** in the plan.

## Instructions

**Spec-sheet mindset:** For each planned surface, be explicit about **job-to-be-done**, primary components, and what must be visible without scroll where relevant — so **`SURFACE-PLAN.md`** reads like a **framework for implementers**, not a marketing outline. Optimize **user journey** arcs, not only screen lists — **`modules/enterprise-prompt-patterns.md` §4**.

1. Prefer **fewer, clearer** **`MVP-built`** surfaces in **MVP1** over many half-done pages; use **`mock-teaser`** for breadth.
2. **Do not** merge engagement context content into MVP1 surface list — **two apps** (see **`engagement-context-app-template.md`**).
3. Call out **navigation model** for **MVP1** (tabs, left nav, single page) and why.
4. Explicitly **defer** dataset IDs, SQL, and implementation detail to E and F.
5. This step is **not** the build spec — no full component list, no API contracts.
6. When process matters for adoption, **do not** skip `PROCESS-FLOW.md`.

## Checkpoint

```
@500apps-pipeline checkpoint=stage-d status=complete
```
