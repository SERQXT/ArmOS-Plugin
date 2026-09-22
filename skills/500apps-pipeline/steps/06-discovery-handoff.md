# Stage H — Discovery handoff + call prep

**Maps to pipeline stage:** H — **after UX polish**, before human discovery call. The consultant must arrive as if they've already been partnering with the customer — knowing the problem, what was built, and exactly what to ask next.

## Inputs

- `artifacts/UX-V2-REPORT.md`, `objective/NORTHSTAR.md`, `spec/BUILD-SPEC.md`, surface + data artifacts.
- `artifacts/MVP-V1-NOTES.md` — URLs for **engagement context app** + **MVP app**, layout (tabs vs scroll).
- Optional: `objective/OUTCOME-BRIEF.md`, `spec/PROCESS-FLOW.md`.
- **`modules/discovery-call-prep.md`**, **`modules/engagement-context-app-template.md`**.

## Outputs

### 1. `artifacts/DISCOVERY-HANDOFF.md` — Discovery call prep brief

**Audience:** A consultant or AE walking into a customer meeting. Write for them, not for engineers. No stage codes (G1, G2, etc.), no system architecture, no post-build automation details. Use plain language throughout.

**Required reading before writing:** `modules/prd-quality-patterns.md` — use the hero metric framing, 5-to-9 lift table, and timed happy-path formats from that module. These patterns are what make handoffs compelling.

**Sections (in this order):**

0. **The one metric this app exists to move** — Open with the hero metric from NORTHSTAR.md, structured as: metric name, today-state (with verbatim customer quote from survey/Gong if available), target-state, and why it matters to the business. Include the supporting metrics table (3-5 rows). This is the opening of the handoff, not a buried bullet. See `prd-quality-patterns.md` §1.

1. **Customer snapshot** — Quick-read bullets. The consultant should absorb this in under 60 seconds:
   - Who the customer is (name, industry, contact)
   - What they asked for — in their own words from the survey
   - **North star outcome** — the single sentence from `NORTHSTAR.md` that captures what winning looks like
   - **Hero metric** — the number they care about most and what it means to the business
   - **Key themes** — 3–5 bullets: winning state, Tuesday user, wow factor, least-confident decision. Pull directly from survey fields and NORTHSTAR — do not paraphrase into vague generalities.

2. **The MVP demo app** — What we built and why. Plain language, no stage codes:
   - One paragraph: what the app does, how many screens/surfaces, what workflow it supports
   - **Deployed app table (mandatory)** — read `artifacts/deploy-result.json` and produce a table like this at the top of this section:

     | App | Design ID | Page / Card URL |
     |-----|-----------|-----------------|
     | Engagement Context | {design_id} | https://{instance}/page/{page_id}/kpis/details/{card_id} |
     | {MVP app name} | {design_id} | https://{instance}/page/{page_id}/kpis/details/{card_id} |

     Include the page URL and individual card URLs. If deploy failed, say so explicitly with the error from deploy-result.json.

     **STEP 2a — Read deploy-result.json:**
     Read `artifacts/deploy-result.json` to get the expected `page_id`, `card_id`, and `design_id` for each deployed app.

     **STEP 2b — Verify card IDs are live (mandatory):**
     For each `page_id` in `deploy-result.json`, call `mcp__domo-pages__page_cards` with that page ID and retrieve the current list of cards on the page. Cross-reference each expected `card_id` against the live card list:
     - If the card ID **exists** on the page → it is live; use it as-is.
     - If the card ID **does NOT exist** on the page → the card was re-deployed or deleted. Find the correct live card by matching on `design_id` (the `designId` field in the card metadata returned by `page_cards`). Use that live card's ID instead. Update `artifacts/deploy-result.json` with the corrected `card_id` before proceeding.
     - If `mcp__domo-pages__page_cards` returns an error, warn explicitly in the output rather than silently writing stale IDs.

     **STEP 2c — Write the verified table:**
     Build the deployed app table using only the confirmed live card IDs from Steps 2a–2b.

     **STEP 2d — Full file write (cache-bust):**
     Always write `artifacts/DISCOVERY-HANDOFF.md` using a **full file rewrite** (Write tool, not Edit). This ensures the UI cache is invalidated so the Discovery Brief button loads the updated content immediately. A partial Edit can leave the UI showing stale values even when the file on disk is correct.

   - **What's working and demo-ready** vs **what's a teaser or placeholder** — honest table so the consultant knows what NOT to promise

3. **Demo walkthrough (~2 minutes)** — A short, punchy script for showing the app. Not a feature tour — a **story**:
   - **Open with the hook** — show the screen that makes the problem disappear. Lead with the "wow" moment, not the nav bar.
   - **Walk through 2–3 key interactions** — the things that will make the customer say "wait, it does that?" Click on something, filter something, show a detail view. Call out what to click and what to say at each step.
   - **Pause points** — mark 1–2 moments to stop and ask "does this match how your team works?" or "what would you change here?" These invite the customer into the conversation.
   - **Close with the tease** — point to a placeholder or "coming soon" area and say "imagine if this also did X" — plants the expansion seed.
   - The goal is to **create excitement** and get the customer thinking about what else is possible. Two minutes, not eight.

4. **Assumptions we made** — What we guessed from the survey that discovery needs to confirm or correct. Frame as: "We assumed X. If that's wrong, here's what changes." Keep to 3–5 bullets. This gives the consultant specific things to listen for.

5. **Discovery conversation guide** — **Use the canonical question framework in `modules/discovery-call-prep.md` (Discovery Conversation Guide)** as the backbone: what the call must accomplish, what to ask, and how each question maps to insight (current state, workflow, data, ownership, ROI, build shape). Consultants and AEs may already know this framework from training; your job is to **thread it naturally from the customer's survey answers** and our MVP — not to paste a generic script.

   **Tone:** Conversation between **partners**, not a technical intake or audit.

   **Structure to cover (in narrative order, not as a checklist read aloud):**

   | Block | Focus |
   |-------|--------|
   | **Following the story** | Today's journey from "need" to "done"; where people go for data on a typical day; time and touchpoints on the hero metric (manual effort, ROI inputs). |
   | **Understanding the flow of work** | Who kicks off work, handoffs, bottlenecks, how misses surface; copy/paste / status-ping waste (automation candidates). |
   | **Understanding the data** | What's already in Domo vs net-new; how many systems; real-time vs daily cadence. |
   | **Who owns it and who benefits** | Maintainer comfort (drag-and-drop vs deeper); weekly user count; expansion buyer / "we need more of this" path. |
   | **Shaping what we build** | Tool displacement / savings; analytical vs operational "work inside app"; **acceptance bar** for a next-week working version. |

   For **each block**, provide **2–4 tailored questions** derived from the guide's numbered prompts (see module), adapted to this account. Add **"listen for" cues** — what answers imply for scope, risk, Domo readiness, or build complexity. Do **not** dump all 15 verbatim; **select and rephrase** so the brief feels like a smart prep doc, not a form.

6. **Expansion opportunities** — What future builds could look like. Frame as value stories, not feature lists. "If we connected X, your team could also Y." Tie to signals from the demo and questions the customer is likely to ask.

7. **Surface lift assessment** — Include the 5-to-9/10 lift table from BUILD-SPEC, annotated with where the MVP1 build actually landed per surface (from `artifacts/MVP-V1-NOTES.md`). This shows the consultant what was designed vs what was achieved, and where the post-discovery rebuild (J1) will push further.

8. **Timed happy-path** — After the demo walkthrough (section 3), include the timed happy-path from BUILD-SPEC as a "the N-minute story" that walks through the primary workflow with timestamps and specific user actions. Makes the time savings tangible for the consultant to tell.

9. **Risks and open items** — Short list of anything the consultant should be aware of (political, data access, timeline).

10. **Scope guards** — "What we are NOT building and why" — carried from BUILD-SPEC. Explicit exclusions framed as intentional design decisions. Prevents the consultant from over-promising.

11. **Links** — Live app URL, engagement context presentation URL.

**Tone rules:**
- Write as if briefing a smart colleague who has 10 minutes to prep before the call
- No internal code names, stage IDs, or system jargon
- No questions about technical implementation (Python, Jupyter, frameworks, APIs) — those come later in scoping, not discovery
- Every question should help the consultant understand the customer's **world**, not our **architecture**

### 2. `artifacts/DISCOVERY-EMAIL.md` (internal — sales/consultant)

Short internal email with two links (context app + MVP app) and top 5 things to know before the call. Per `discovery-call-prep.md` section F.

### 3. `spec/ENGAGEMENT-CONTEXT-COPY.md` (final slot text)

Final copy for the pre-built engagement context template — `## Discovery` section. Assumes **no prior knowledge**. Derive from the handoff brief using `modules/engagement-context-app-template.md` mapping. Keep it to what fits on 1-2 slides.

## Instructions

**Intent:** The consultant arrives as if they've been thinking alongside the customer for weeks. They know the problem, what was built, what's assumed, and exactly what to ask. Good discovery leads to the best outcomes.

1. **Write for the human going into the room** — not for the system, not for the developer, not for the pipeline. Every word should help the consultant have a better conversation.
2. **Create excitement** — the brief should make the consultant confident. Show what's possible with working concepts.
3. **Discovery is about understanding the customer's world** — outcomes, workflows, people, data, constraints. Technical solutioning comes after.
4. **Probe questions must be specific** to this customer and this problem — not generic templates. Reference what the survey told us and what the app demonstrates.
5. **Do not** include post-discovery system actions, pipeline stages, technical architecture, or build instructions. Those live elsewhere.
6. After the **customer discovery session**, `memory_remember` a concise update — decisions, outcomes, Phase 2 signals — per `modules/engagement-memory-and-assets.md`.

## Checkpoint

```
@500apps-pipeline checkpoint=stage-h status=complete
```
