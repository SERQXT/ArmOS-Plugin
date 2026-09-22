# Executive Build Pack Template

The **executive build pack** is a one- to two-page internal brief for Domo account teams, e-staff, and product leadership. It explains *why* the build matters, *what* Domo capabilities it exercises, *what value* the customer gets, and *where* the pattern applies next — without repo-level technical detail.

The **technical build pack** (`delivery/BUILD-PACK.md`, see `modules/build-pack-template.md`) remains the canonical inventory for FDEs, developers, and agents who need verified counts, code locations, and borrowable implementation detail. The executive pack **summarizes and points to** that document; it does not replace it.

**Audience:** Domo account teams, e-staff, product team, PS leadership.

**Tone:** Marketing-ready internally — clear, confident, quotable. Not customer-facing copy.

**Length:** Target 1–2 printed pages. Bullets over paragraphs. Tables only where they compress information (e.g. platform footprint).

**Do not include:** Delivery pipeline mechanics, per-file LOC, routes, icons, keyboard shortcuts, helper/function tables, competitor pricing grids, or step-by-step credit math. Those belong in the technical build pack only.

---

## Relationship to the technical build pack


| Artifact             | Path (typical)                | Purpose                                              |
| -------------------- | ----------------------------- | ---------------------------------------------------- |
| Executive build pack | `delivery/EXEC-BUILD-PACK.md` | Internal narrative for leadership and account teams  |
| Technical build pack | `delivery/BUILD-PACK.md`      | Verified technical inventory for builders and agents |


Generate the executive pack **after** the technical build pack (or in the same pass, reading the same inputs). Distill from verified technical content — do not invent primitives or counts that contradict `BUILD-PACK.md`.

---

## Pipeline input references

The 500apps pipeline produces a consistent set of artifacts per project. The table below maps each executive build pack section to the pipeline-produced documents that should feed it. Read these in the listed order; later docs supersede earlier ones where the build evolved (e.g. MVP2 supersedes MVP1).

All paths are relative to the project's S3 prefix:
`s3://armos-workspace-676897632200/500apps/projects/{account_key}/`


| Exec pack section                        | Primary inputs (read first)                                                                                                                                                                              | Secondary inputs (cross-check)                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header**                               | `objective/NORTHSTAR.md` (customer + app name) · `manifest.json` in `code/` (final app name)                                                                                                             | `spec/ENGAGEMENT-CONTEXT-COPY.md`                                                                                                            |
| **1. E-staff "so what"**                 | `objective/NORTHSTAR.md` (north-star outcome) · `delivery/DELIVERY-DOC.md` or `delivery/DELIVERY-SUMMARY.md`                                                                                             | `deliverables/Engagement-Summary.md` · `deliverables/Customer-Delivery-Summary.md`                                                           |
| **2. Problem and outcome**               | `objective/NORTHSTAR.md` (problem statement, target user) · `artifacts/DISCOVERY-HANDOFF.md` (validated problem framing)                                                                                 | `artifacts/INTAKE-FIELDS.md` · `spec/ENGAGEMENT-CONTEXT-COPY.md`                                                                             |
| **3. Bigger picture / delivered / next** | `delivery/DELIVERY-DOC.md` or `delivery/DELIVERY-SUMMARY.md` (shipped scope) · `artifacts/MVP2-HANDOFF.md` (final MVP scope, where present) · `spec/V2-FEATURE-BACKLOG.md` (planned next, where present) | `artifacts/MVP-V1-NOTES.md` · `artifacts/MVP2-NOTES.md` · `deliverables/Feature-Overview.md` · `code/manifest.json` (final shipped surfaces) |
| **4. Agentic patterns in the app**       | `spec/BUILD-SPEC.md` (AI surfaces in scope) · `code/` (actual implementation — search for `domo.ai`, prompt templates, AI buttons)                                                                       | `artifacts/MVP2-HANDOFF.md` (AI features added in MVP2) · `deliverables/UX-AI-Optimization-Plan-v1.md` (where present)                       |
| **5. Domo platform footprint**           | `code/manifest.json` (datasetsMapping, collectionsMapping) · `spec/BUILD-SPEC.md` (declared platform usage) · `spec/SAMPLE-DATA-PLAN.md` (data sources)                                                  | `delivery/DELIVERY-DOC.md` (verified usage) · `artifacts/deploy-result.json` (deploy target confirms App Studio / Pro-Code path)             |
| **6. Reusable patterns**                 | `delivery/PATTERNS.md` (where present — REO has it) · `delivery/DELIVERY-DOC.md` "patterns / reuse" section                                                                                              | `artifacts/MVP2-HANDOFF.md` (patterns called out at handoff) · `spec/SURFACE-PLAN.md`                                                        |
| **7. Customer value**                    | `objective/NORTHSTAR.md` (outcome framing) · `delivery/DELIVERY-DOC.md` (verified outcomes) · `deliverables/Customer-Delivery-Summary.md`                                                                | `deliverables/Engagement-Summary.md` · `artifacts/DISCOVERY-HANDOFF.md` (status-quo replaced)                                                |
| **8. Credit and commercial impact**      | `delivery/DELIVERY-DOC.md` (credit/commercial section, where present) · `sow/*.pdf` (SOW value, where present — JB Hunt has it)                                                                          | `objective/NORTHSTAR.md` (commercial framing) · `artifacts/DISCOVERY-HANDOFF.md` (account posture)                                           |
| **9. Platform gaps**                     | `delivery/PATTERNS.md` "gaps" section (where present) · `artifacts/MVP2-HANDOFF.md` "constraints / workarounds" · `artifacts/UX-MVP2-REPORT.md`                                                          | `artifacts/UX-V2-REPORT.md`                                                                                                                  |
| **10. Risks and scope boundaries**       | `delivery/DELIVERY-DOC.md` (honest considerations) · `artifacts/MVP2-HANDOFF.md` (deferred scope) · `spec/V2-FEATURE-BACKLOG.md`                                                                         | `deliverables/SECURITY-REVIEW.md` (security risk callouts) · `artifacts/MVP-V1-NOTES.md`                                                     |


**Notes on availability:**

- `delivery/` folder is populated late in the pipeline (post stage-k). Early-stage projects may only have `artifacts/DISCOVERY-HANDOFF.md` and a `MVP-V1-NOTES.md` — call this out in Section 3 if the exec pack runs ahead of delivery.
- `delivery/PATTERNS.md` is currently produced for some projects (e.g. REO) but not all. Where missing, derive patterns from `delivery/DELIVERY-DOC.md` + final `code/`.
- A formal `delivery/BUILD-PACK.md` may not yet exist for older projects. If it is missing, **note explicitly** in the exec pack header and fall back to the documents above. Optionally generate the technical pack first.

**Verification step:** After reading the input docs, open the final shipped code under `code/` and confirm the exec pack matches what was actually delivered. The codebase, not the spec, is the source of truth for what shipped.

---

## Template structure

Copy this structure for every build. Omit sections that genuinely do not apply (e.g. no in-app AI — skip agentic subsection with a one-line note).

### Header

```markdown
# {Customer Name} — {App Name}
## Executive Build Pack

**Account:** {customer slug} · **Vertical:** {industry} · **Status:** {shipped | pilot | production}
**Technical build pack:** `delivery/BUILD-PACK.md`
```

---

### 1. E-staff "so what" (lead with this)

One quotable sentence an executive can read aloud in a staff meeting or account review. It must capture **customer outcome + Domo strategic angle** (retention, expansion, template value, or product proof), not feature lists.

**Format:** Blockquote or bold standalone line.

**Example shape (adapt, do not copy verbatim):**

> "{Customer} replaces {status quo pain} with {app outcome}, saving roughly {headline $ or time} at {tier}, while {Domo posture — e.g. positioning Domo as the operations layer / low-burn retention play / white-label revenue spine}."

---

### 2. Problem and outcome

3–5 sentences max.

- **Problem:** What business pain or workflow failure existed?
- **Outcome:** What does the app do for the customer now?
- **Who benefits:** Buyer/champion vs daily user (one line each).

Pull from `objective/NORTHSTAR.md`, `delivery/DELIVERY-SUMMARY.md`, discovery notes, and the technical build pack's customer-value sections — without TCO table detail.

---

### 3. Bigger picture, what we delivered, and what's next

This section is required. It frames phase, roadmap, and strategic arc.

#### Bigger picture

2–3 sentences: Where does this build sit in the customer's strategy and in the 500-apps / Domo portfolio story? (e.g. inaugural vertical template, proof for white-label product line, credit-conscious sales tool.)

#### What we delivered (this release)

Bullet list of **capabilities shipped now** — user-visible outcomes, not implementation. 4–8 bullets.

- Name the **phase** if applicable (e.g. "Phase 1 — AE pilot").
- Call out **in-app agentic capabilities** here when they are part of what shipped (see Section 4).

#### What's next

Bullet list of **explicitly planned follow-ons** — next phase, gated features, commercial expansion. 3–6 bullets.

- For each: **what** + **trigger or condition** (adoption metric, customer confirmation, phase gate) when known.
- Do not duplicate the technical pack's full deferral essay; summarize.

---

### 4. Agentic patterns in the application

Document **AI and agent behavior inside the running app** — not how ArmOS or the pipeline built the app.

For each in-app agentic capability:


| Capability                   | Trigger                            | Model / primitive                        | User-facing purpose |
| ---------------------------- | ---------------------------------- | ---------------------------------------- | ------------------- |
| {e.g. Daily Brief Generator} | {click-only / scheduled / on-load} | {Domo AI Services, local template, etc.} | {one line}          |


If none: state **"No in-app agentic features in this release"** and note any planned Phase X AI.

**Include when relevant (one line each):**

- **Governance:** e.g. in-tenant Domo AI only, no external LLM, click-to-fire, AppDB caching.
- **Credit sensitivity:** e.g. AI gated to user action to protect customer credit posture.

---

### 5. Domo platform footprint

Rollup of **which Domo capabilities the solution uses** — for product adoption tracking and gap analysis. Counts are optional; **used / not used** is required.

Use a compact table:


| Capability                 | Used | Role (one phrase)                                   |
| -------------------------- | ---- | --------------------------------------------------- |
| Datasets (read)            | Y/N  |                                                     |
| Datasets (write / REPLACE) | Y/N  |                                                     |
| AppDB                      | Y/N  |                                                     |
| Cloud Amplifier            | Y/N  |                                                     |
| Magic ETL                  | Y/N  | {e.g. statistical engines in-tenant; specs shipped} |
| Code Engine                | Y/N  |                                                     |
| Workflows                  | Y/N  |                                                     |
| Domo AI Services           | Y/N  |                                                     |
| Conversational Agents      | Y/N  |                                                     |
| Beast Modes                | Y/N  |                                                     |
| App Studio (Pro-Code)      | Y/N  |                                                     |
| PDP / multi-tenant scoping | Y/N  |                                                     |


**Data architecture (one line):** Where is the system of record? (e.g. Snowflake via Amplifier, client-side only, Domo datasets.)

**In-repo vs in-tenant (one line, if it clarifies scope):** e.g. "Consumption app in repo; four Magic ETL engines live in customer tenant."

---

### 6. Reusable patterns and where else they apply

4–6 **named patterns** portable beyond this customer — behavioral or architectural, not file paths.

Per pattern:

- **Name** — e.g. "Click-only AI generation surface"
- **What it does** — one sentence
- **Industries / motions** — 2–3 adjacencies (HR-tech ROI calculators, agency ops OS, field dispatch, etc.)

Close with one line: **"~{X}% of scaffolding is portable to {class of next build}"** — take the aggregate from the technical build pack's reuse section; do not fabricate.

---

### 7. Customer value (internal)

Summarize **why the customer wins** — not a full competitive pricing grid.

- **Status quo replaced** — 1–2 sentences (Excel queue, separate BI, agency spreadsheet chaos, etc.).
- **Headline outcomes** — 2–4 bullets with **rounded $ or time** where the technical pack supports them (e.g. "~-$300K/yr T1 TCO", "2–4 day analyst queue → <60s self-serve").
- **Strategic value** (optional, 2 bullets max) — retention, expansion, white-label revenue, multi-vertical enablement.

Skip exhaustive line-item TCO tables; link readers to the technical build pack for math.

---

### 8. Credit and commercial impact (Domo)

Summarize for **pack sizing and account conversations** — not full Step 1–7 credit worksheets.

- **Tier snapshot** — T1 / T2 / T3 one line each: profile + approximate annual events or credits (from technical pack).
- **Net-new credits headline** — e.g. "+4% of existing pack at T2", "$3–20K/yr ARR delta at mid-case".
- **Domo commercial posture** — 2–3 bullets: retention vs expansion vs white-label multiplier vs AI-tier accelerant.
- **Customer credit sensitivity** — one line if material (e.g. burned by AI overruns before; build is deliberately low-burn).

---

### 9. Platform gaps (product signal)

Bullet list for the **Domo product team** — gaps surfaced or re-confirmed during this build.

Per gap:

- **Gap** — what the platform lacks
- **Workaround** — how the app handles it today (one phrase)
- **New vs known** — "new" or "re-surfaced (see {prior build})"

If none: **"No new platform gaps surfaced for this build pattern."**

---

### 10. Risks and scope boundaries (brief)

**Top risks** — 2–3 bullets: adoption, customer bandwidth, dependency on one champion, conditional phases. Distill from technical pack "honest considerations."

**Explicitly not in this release** — 3–5 bullets max (what we did *not* build). Pairs with Section 3 "What's next."

---

### Footer

```markdown
---
**Full technical inventory:** `delivery/BUILD-PACK.md`
**Generated:** {date} · **500-apps project:** `{account slug}`
```

---

## Verification checklist (executive pack)

Before publishing:

- E-staff "so what" stands alone and is quotable
- Section 3 covers bigger picture, delivered, and what's next
- Agentic patterns describe **in-app** behavior only (not build tooling)
- Platform footprint matches technical build pack (no contradictory Y/N)
- No fabricated $ or credit numbers — traceable to technical pack or delivery docs
- Reuse % and patterns align with technical pack Section 8
- Platform gaps align with technical pack Section 10
- Pointer to `delivery/BUILD-PACK.md` is present
- No customer PII, secrets, or tokens
- Fits ~1–2 pages when rendered

---

## Adaptation notes

- **Buyer profile drives tier language** — AE seats vs transaction volume vs partner count; state it in Section 2 or 3.
- **White-label / multi-tenant builds** — call out in "so what", bigger picture, and commercial impact (revenue + credit multiplier).
- **Low-burn vs consumption-heavy builds** — lead the credit section with the right framing (retention vs expansion).
- **PDF (optional):** If a printable exec brief is needed, generate `delivery/exec-build-pack.pdf` from this markdown using the same HTML/print pattern as the technical pack PDF — keep the exec PDF separate from `build-pack.pdf`.

---

## Manual trigger

```
Generate an executive build pack for {account name}
```

Read `delivery/BUILD-PACK.md` (required if it exists) plus `delivery/DELIVERY-SUMMARY.md`, `objective/NORTHSTAR.md`, and `spec/BUILD-SPEC.md`. If the technical build pack does not exist yet, generate it first or note gaps explicitly in the executive pack.