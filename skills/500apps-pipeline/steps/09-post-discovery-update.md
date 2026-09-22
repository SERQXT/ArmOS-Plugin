# Stage I — Post-discovery artifact update

**Maps to pipeline stage:** I — after human discovery call, before MVP2 build. This is a **surgical update pass**, not a rebuild from scratch.

## Inputs

- **`documents/DISCOVERY-NOTES.md`** — human-entered call notes and observations from the ArmOS UI. Priorities, corrections to assumptions, workflow descriptions, persona details, data source descriptions, and directional guidance.
- **`meetings/*.md`** — Full Gong transcript(s) synced from ArmOS. These contain the **complete verbatim transcript** plus Gong's recap. **Read the full transcript** — do not rely on the recap alone. The transcript is the primary evidence of what the customer said, how they described their workflows, what data they mentioned, and what they reacted to. The discovery notes summarize what the human took away; the transcript is the raw record.
- **SOW** — Statement of Work in `sow/`. Defines contracted scope and boundaries.
- All existing artifacts from stages B-H: `objective/NORTHSTAR.md`, `spec/SURFACE-PLAN.md`, `spec/SAMPLE-DATA-PLAN.md`, `spec/BUILD-SPEC.md`, `spec/ENGAGEMENT-CONTEXT-COPY.md`, and optionally `spec/PROCESS-FLOW.md`.

## Outputs

Updated versions of these artifacts (same filenames, same paths — updated in place):

1. **`objective/NORTHSTAR.md`** — outcomes re-anchored to what the customer actually said
2. **`spec/SURFACE-PLAN.md`** — surfaces re-evaluated for the personas and workflows described
3. **`spec/SAMPLE-DATA-PLAN.md`** — data plan updated with real data descriptions; now planning for real Domo datasets (not just seeds)
4. **`spec/BUILD-SPEC.md`** — scope, surfaces, data bindings, and Domo platform features for MVP2
5. **`spec/ENGAGEMENT-CONTEXT-COPY.md`** — updated with post-discovery context and `## Release` section
6. Optionally **`spec/PROCESS-FLOW.md`** — if the customer described process changes

## Instructions

### Step 1: Read all discovery materials AND existing artifacts

**First**, read the existing artifacts so you know what assumptions were made:
1. `objective/NORTHSTAR.md` — the current north star (from survey-based intake)
2. `spec/BUILD-SPEC.md` — what was scoped and built for MVP1
3. `spec/SURFACE-PLAN.md` — what surfaces were designed
4. `spec/SAMPLE-DATA-PLAN.md` — what data was assumed

**Then**, read the discovery materials with those artifacts as your frame of reference:
5. `documents/DISCOVERY-NOTES.md` — the human's own notes and observations
6. `meetings/*.md` — **read the full Gong transcript(s)**. List the `meetings/` directory and read every `.md` file. The transcript contains the verbatim record of what the customer said — their exact words about workflows, data, personas, priorities, and reactions to the demo. This is the highest-weight input.
7. SOW documents in `sow/`

**Build a structured comparison:**
- What the customer **confirmed** from our assumptions (these stay)
- What they **corrected or contradicted** (these must change)
- What **new information** they provided that we didn't have (workflows, personas, data sources, priorities)
- What's **in scope** per the SOW vs what's aspirational
- What **personas** they described — who uses this, their daily job, what decisions they make
- What **data** they described — systems, schemas, column names, refresh cadence
- What they **reacted to** in the demo — positive and negative

The transcript overrides the survey. The survey was 5 questions from an intake form. The transcript is a 30-60 minute conversation where the customer described their real world. When they conflict, the transcript wins.

### Step 2: Update each artifact in place

For EACH artifact below, follow this pattern:
1. **Read** the existing artifact
2. **Compare** it to what discovery revealed
3. **Update** — preserve what was correct, correct what was wrong, add what was missing
4. **Annotate** major changes with brief rationale (e.g., "Updated per discovery: customer described daily triage workflow instead of weekly review")

Do NOT start any artifact from scratch. The pre-discovery work is a foundation, not a throwaway.

### 2a. `objective/NORTHSTAR.md`

- Re-anchor the business outcome, user actions, and hero metric to what the customer described
- If the customer redirected the north star entirely, update it but preserve the original survey-based version in a `## Pre-discovery (original)` section at the bottom for reference
- Personas: if the customer described specific user types, add a **Personas** section listing each one with their role, daily job, and what they need from the app
- The north star must now be grounded in discovery evidence, not survey inference

### 2b. `spec/SURFACE-PLAN.md`

- Re-evaluate every surface against the personas and workflows from discovery
- Add/remove/modify screens based on what the customer actually needs
- For each persona, ensure there's a clear path through the app that serves their daily job
- If multiple personas need different views, plan for navigation or role-based surfaces
- Mark surfaces that are now confirmed vs still assumed

### 2c. `spec/SAMPLE-DATA-PLAN.md`

- Update with real data descriptions from the customer
- If they described schemas, column names, data sources, or systems, incorporate those
- Plan for **real Domo datasets** — this is no longer about mock seeds. Specify:
  - Dataset names and schemas for `domo-datasets` creation
  - Representative sample data that tells a realistic story
  - AppDB collections needed for user interactions
  - Any Domo AI integration points (what data feeds the AI, what responses are expected)
- Keep the seed strategy for backward compatibility but mark it as MVP1-only

### 2d. `spec/BUILD-SPEC.md`

This is the most significant update. The build spec must now include:
- **Scope aligned to SOW** — what's in scope for MVP2 vs future phases
- **Updated surfaces** — from the revised surface plan
- **Real Domo datasets** — schema, creation plan, wiring via manifest `mapping`
- **AppDB collections** — what interactions need persistence
- **Domo AI integration** — where and why; tied to persona needs
  - Daily brief / summary generation
  - Priority flagging and recommendations
  - Inline insights alongside data
- **Code Engine functions** (if needed) — server-side processing, scheduled jobs, webhook handlers
- **Workflows** (if needed) — email notifications, downstream triggers
- **Visual personality** — may need updating based on who the customer said will use it
- **Acceptance checks** — updated for MVP2 (datasets exist, AI responds, AppDB persists, app loads from real data)

### 2e. `spec/ENGAGEMENT-CONTEXT-COPY.md`

- Update with post-discovery context
- Add `## Release` section: what changed from MVP1, what new features exist, what value the customer gets
- Audience may have expanded or rotated based on discovery

### 2f. `spec/PROCESS-FLOW.md` (if applicable)

- If the customer described process changes, update the current-vs-future flow
- Validate against `modules/process-flow-comparison.md`

## Pre-checkpoint verification

| # | Check | If it fails |
|---|-------|-------------|
| 1 | All discovery materials read (notes, transcript, SOW) | Missing context will produce bad updates |
| 2 | NORTHSTAR.md updated with discovery evidence | North star still based on survey alone |
| 3 | SURFACE-PLAN.md reflects personas from discovery | Surfaces designed for wrong users |
| 4 | SAMPLE-DATA-PLAN.md plans real Domo datasets | Still planning for seeds only |
| 5 | BUILD-SPEC.md includes AppDB, Domo AI, dataset specs | MVP2 will be built like MVP1 |
| 6 | Changes annotated with rationale | No traceability for what changed and why |
| 7 | No artifact started from scratch | Lost pre-discovery work |

## Checkpoint

```
@500apps-pipeline checkpoint=stage-i status=complete
```
