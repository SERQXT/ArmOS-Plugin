# Enterprise build patterns (prompt engineering)

Cross-cutting techniques distilled from high-performing **outcome-based Domo app** builds. Use these to sharpen **how** agents phrase work and **what** artifacts must contain — without prescribing a specific vendor stack. (Ignore any external doc that compares LLM brands; this pipeline uses **our** architecture: gateway MCP, worker, ArmOS.)

## How this file is used with Claude Code / the worker

- **`SKILL.md`** carries a **short always-on checklist** so the model sees enterprise discipline even in a small context window.  
- **This file** is the **authoritative expansion**: tables, anti-patterns, integration QC, and final gates.  
- **Per run:** When the active step is **`steps/00`–`05` or `05b`**, load **this module** (at least the **§** that maps to that stage — see section titles below) **in addition to** the step file. The step file says *what to produce*; this file says *how to think* so the next app build does not skip outcome framing, contracts, or QC.  
- **Artifacts are the memory:** Put outcome rationale, handler/DOM contract, and demo narrative into **`NORTHSTAR.md`**, **`BUILD-SPEC.md`**, **`MVP-V1-NOTES.md`**, **`UX-*-REPORT.md`** — not only ephemeral chat — so resume and handoff work.

**When to load:** Stages **B–F** (framing + specs), **G1** (implementation + handoffs), **G2/J2** (polish + QC). Pair with **`ui-quality-audit.md`**, **`design-system-check.md`**, **`interactive-state-testing.md`**.

---

## 1. Research & intake (maps to A/B)

| Pattern | What to do |
|--------|------------|
| **Anchor with artifact** | Start from a concrete Domo artifact (card URL, dataset id, KPI link) when pulling submission or account context — reduces ambiguity. |
| **Method directive** | Prefer “use Domo APIs / MCP tools” over unspecified browsing when the goal is reproducible data pulls. |
| **Expansive scope with ceiling** | “Everything accessible” (not “invent everything”) — keep digging card → dataset → schema → rows until exhausted or blocked. |
| **Entity + relational scope** | Filter results on the named account *and* tie back to *this* submission or form — avoids wandering into unrelated account data. |

---

## 2. Outcome-based blueprint (maps to C/F)

| Pattern | What to do |
|--------|------------|
| **Philosophy first** | Frame with **outcomes** (hours saved, risk reduced, decisions improved) before feature lists. |
| **Ambition on impact** | Overshoot **measurable outcome**, not surface area — reject feature-stuffing that does not trace to `NORTHSTAR.md`. |
| **Context binding** | Later steps **consume prior artifacts by path** — do not re-derive scope from memory alone when files exist under `500apps/{account}/`. |
| **Capability seeding** | Call out **Domo AI / LLM / automation** where they *meaningfully* improve workflow — each insertion needs a “why this is meaningful” test, not AI-for-AI’s sake. |
| **Bookends** | Open and close planning with the same outcome language so middle sections (data, APIs, surfaces) do not drift. |
| **Context density for handoff** | Specs and blueprints should list **enough named functions, datasets, and integration points** that a **fresh session or another implementer** can execute without re-discovery. |

---

## 3. Solution research (maps to B/D — optional deep pass)

| Pattern | What to do |
|--------|------------|
| **Dual lens** | (a) **Process** — who does this workflow best; (b) **Product** — which SaaS patterns solve similar problems. |
| **Translation** | Every external insight maps to **our** Domo surfaces — not a generic market report. |
| **Journey over features** | Optimize **day-in-the-life** arcs (personas), not just screens. |
| **Foundation questions** | Explicitly answer: **what data**, **which connectors**, **which Domo / platform APIs** — even if answers are “TBD with discovery.” |

---

## 4. Surface specs (maps to D → F)

| Pattern | What to do |
|--------|------------|
| **One spec sheet per surface** | For each planned surface: purpose, primary components, data sources, key actions, empty/loading/error behavior at a glance. |
| **Completeness** | “Each surface” means **each** — no implied surfaces. |
| **Escalating trust** | As context accumulates in the repo, later prompts can be shorter **if** prior artifacts are complete. |

---

## 5. Logic vs presentation — interface contract (maps to F/G1)

When **multiple implementation passes or agents** touch the same app (e.g. orchestration vs UI specialization, or worker vs human), **misalignment shows up at boundaries**.

| Mechanism | What to do |
|-----------|------------|
| **Shared contract** | **Stable names**: event-handler entry points, DOM ids, data attributes — documented in **`BUILD-SPEC.md`** or a sibling **`INTERFACE.md`**. |
| **Presentation layer** | UI work may assume **behavioral** contracts (“button triggers `onApprove()`”) without re-embedding full data models in every file. |
| **Logic layer** | State, AppDB, datasets, AI calls, and orchestration live where the build skill puts them — but **must** expose the agreed handler names and ids. |
| **No duplicate brains** | Do not re-implement classification, routing, or AI logic in the markup layer; **hook** to named functions. |

**Anti-patterns to flag in review:** placeholder ids (`'CURRENT_ID'`) in handlers; dropdowns hardcoded to a **subset** of enum values while the canonical list lives in code; boot order where **render runs before** data needed for that view is loaded.

---

## 6. Brand & tokens (maps to F / G1 / G2 / L–M)

| Pattern | What to do |
|--------|------------|
| **Brand kit first** | Stage F produces `spec/BRAND-KIT.md` before any code is written — customer logo (sourced, background removed), colors mapped to token roles, font with fallback chain, CTA patterns, voice/microcopy guidelines, and restraint rules. See `prd-quality-patterns.md` §5 for the template. |
| **Token layer** | Brand colors and type live in **semantic tokens** (`--color-primary`, etc.) so components inherit — not one-off hex per component. Generate `code/styles/tokens.js` from BRAND-KIT.md. |
| **Structural from playbook** | Shadow system, border-radius scale, animation keyframes, and easing curves come from `domo-design-playbook.md` regardless of brand. |
| **Functional brand** | Map brand colors to **roles** (primary action, destructive, navigation) — not only logo placement. |
| **Tone** | Prefer **credible internal tool** over marketing gloss; preserve **density** for power users. Match the customer's domain voice (see BRAND-KIT.md voice section). |

---

## 7. Demo-ready & narrative data (maps to E/G1)

| Pattern | What to do |
|--------|------------|
| **Story beats** | Seed or mock data should show **a compelling arc** — e.g. active issue + emerging pattern + rows in multiple states — not only “enough rows.” |
| **Content quality** | Help text / KB-style copy in demos should **read as plausible**, not lorem ipsum. |
| **Real data when allowed** | Wire to **real** datasets when scope allows; tune AI or classification prompts against **real samples** (iterate). |
| **Persona walkthrough** | Prepare a **short script** for the primary stakeholder (names their problem, walks the happy path) — sales-ready, not a generic feature tour. |

---

## 8. Integration QC (before “done” on split builds)

Run when **more than one pass** touched HTML/CSS and JS. Adapt checks to your toolchain (browser QA, `app-tester`, manual).

| Check | Why |
|-------|-----|
| Full enum in UI | Dropdowns match **canonical** options (config / dataset), not a partial hardcoded list. |
| Bootstrap order | Critical data loaded **before** first render that depends on it (avoid empty dropdown races). |
| Handler ↔ state | Dynamic ids come from **app state**, not string placeholders. |
| Mock ↔ seed alignment | Every id referenced in seed/demo data has a **resolving** row in mock or dataset. |

---

## 9. Enterprise production UX (G2 / polish)

Quality bar: **a day-one user can complete the primary workflow** without training. A power user on their 1000th visit completes the primary task in 3 clicks or fewer.

| Rule | Detail |
|------|--------|
| **Viewport-first** | Initial viewport must contain the hero metric and primary CTA without scrolling. Both power users and first-timers see what matters immediately. Compare to the viewport blueprint in BUILD-SPEC. |
| **CTA dominance** | Every surface has exactly one visually dominant primary CTA. Action-colored, sufficient size, action-oriented label. No competing CTAs above the fold. |
| **Happy-path zero-friction** | The hot path has no dead clicks, no unnecessary confirmation modals, no redundant navigation. Count clicks from app open to task completion — target 3 or fewer. |
| **Contrast** | Every actionable control is **visually distinct** from its container (test: parent vs child background). |
| **Elevation** | Prefer **shadow** for depth; avoid thick **left/top/right borders** as fake hierarchy — reads as generic AI chrome. |
| **Typography** | One primary font family; reserve monospace for **code / fixed columns**, not random labels. |
| **Async feedback** | Long actions: visible **loading**, then **confirm start**, then **confirm outcome** (or equivalent single clear pattern). |
| **Panels / dialogs** | If a panel opens off-screen, **scroll into view** or anchor so the user sees the effect of their action. |
| **CSS hygiene** | Prefer **single definition per selector** — duplicate rules cause cascade bugs and “invisible button” regressions. |

---

## 10. Final quality gate (pre–handoff / pre–demo)

| Gate | Criterion |
|------|-----------|
| **Script loading** | Every `<script>` tag's `type` matches the syntax in the file it loads. JSX files need `type="text/babel"`. Plain JS files use bare `<script>`. **Never** load a JSX file as a plain script — it fails silently with "Unexpected token <". |
| **Contract** | Every declared UI action maps to an existing handler; no orphaned JS for removed DOM. |
| **Data** | Mocks and seeds **cover** every referenced id. |
| **Runtime** | **Zero** unexplained console errors on happy path; **no dead clicks** (action produces visible feedback). |
| **Contrast** | No interactive element shares background with its parent in a way that hides affordance. |
| **Viewport** | Hero metric and primary CTA visible without scroll at 1440px width on every major surface. |
| **CTA contrast** | Primary action button passes 3:1 contrast ratio against its container background. |
| **Happy path** | Primary workflow achievable in 3 clicks or fewer from app open. Count and document. |

---

## Abstract pipeline (for sequencing)

For complex engagements, the **order of thinking** is often:

1. Intake + research (anchored)  
2. Outcome blueprint + functions at surfaces  
3. Competitive / solution research → mapped to Domo  
4. Per-surface specs  
5. Build spec + **interface contract**  
6. Implementation (logic + presentation per repo rules)  
7. Narrative seed + real wiring + prompt tuning on real samples  
8. Integration QC + enterprise UX pass + final integrity gate  

Stages **A–O** in this meta-skill **map to these ideas**; not every engagement needs every document, but **skipping an earlier gate** usually costs time in G2.
