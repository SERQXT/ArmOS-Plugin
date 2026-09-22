# Stage K — MVP2 handoff documentation

**Maps to pipeline stage:** K — after MVP2 build (J1) and UX polish (J2), before human review (L-M). Prepares everything a consultant needs to demo MVP2 to the customer and discuss next steps.

## Inputs

- `artifacts/MVP2-NOTES.md` — all Domo resources created (datasets, AppDB, AI, Code Engine, workflows).
- `artifacts/UX-MVP2-REPORT.md` — UX audit and persona-driven assessment.
- `artifacts/deploy-result.json` — deployment data with URLs and IDs.
- `objective/NORTHSTAR.md` (post-discovery version) — what the customer asked for.
- `spec/BUILD-SPEC.md` (post-discovery version) — what was scoped.
- `documents/DISCOVERY-NOTES.md` — what the customer said during discovery.
- SOW from `sow/` — contracted scope.

## Outputs

### 1. `artifacts/MVP2-HANDOFF.md` — MVP2 review and handoff document

**Audience:** A consultant walking into a customer review meeting with the post-discovery build. Also serves as a brief for internal stakeholders reviewing the build before customer presentation.

**Required reading before writing:** `modules/prd-quality-patterns.md` — use the hero metric framing, 5-to-9 lift table, and timed happy-path formats.

**Sections (in this order):**

0. **Hero metric band** — The one metric from updated NORTHSTAR (post-discovery), structured as today vs target with supporting metrics. Now grounded in discovery evidence, not survey assumptions. Verbatim customer quotes with attribution.

1. **Executive summary** — 3-5 sentences: what the customer asked for, what was built, and how it delivers on their stated outcomes. Reference specific things from the discovery call.

2. **What was built (tied to discovery)** — For each major feature or surface in the app:
   - What the customer asked for (quote or paraphrase from discovery notes)
   - How the app delivers it
   - Which Domo features power it (dataset, AI, AppDB, Code Engine)
   - Demo walkthrough for this feature (what to click, what to show)

3. **Persona coverage** — For each persona identified in discovery:
   - What they see when they open the app
   - What daily decisions this helps them make
   - Which agentic features serve them (AI summaries, flagged items, recommendations)
   - What their typical workflow looks like in the app

4. **Domo platform features used** — Technical summary table:

   | Feature | Resource | Purpose | Status |
   |---------|----------|---------|--------|
   | Dataset | `{name}` (ID: ...) | Powers the main data view | Sample data — wire to real source on customer instance |
   | AppDB | `{collection}` | Stores user actions | Working with sample data |
   | Domo AI | Text generation | Daily brief + priority flagging | Working — responses improve with real data |
   | Code Engine | `{package}` | Scheduled processing | Deployed on internal instance |
   | Workflow | `{name}` | Email notifications | Deployed on internal instance |

5. **Gaps and limitations** — Honest assessment of what the automated build couldn't do:
   - Features that need real customer data to validate
   - AI responses that are generic because of sample data
   - Workflows or integrations that are stubbed
   - UX decisions that need customer input
   - Anything the SOW scopes that isn't yet delivered

6. **Questions for the customer** — Specific areas where the build could go multiple directions:
   - Data source clarifications needed
   - Persona priority (if multiple personas, which is most important?)
   - Feature preferences (if two approaches were possible, which does the customer prefer?)
   - Access and permissions requirements

7. **Future ideas and expansion opportunities** — What to pitch for future engagements:
   - Additional AI integrations that would add value
   - Dashboard or reporting surfaces for other personas
   - Workflow automations for processes mentioned but not scoped
   - Data connections to other systems the customer uses
   - Advanced features (predictive analytics, alerts, mobile optimization)
   - Frame each as a value story: "If we connected X, your team could also Y"

8. **Demo script for customer review** — A 5-minute walkthrough:
   - Open with the biggest win (the feature that most directly addresses what they asked for)
   - Walk through 3-4 key interactions
   - Show the agentic features (AI brief, recommendations)
   - Point to data that would be their real data in production
   - Pause points for customer feedback
   - Close with expansion tease

9. **Surface lift results** — The 5-to-9/10 lift table from updated BUILD-SPEC, annotated with where the J1+J2 build actually landed per surface. Shows BUILD-SPEC target vs actual result. This is the internal quality assessment the consultant should know before presenting.

10. **Scope guards** — "What we are NOT building and why" — carried from updated BUILD-SPEC, refined with discovery-informed scope decisions. Prevents over-promising.

11. **Links and access** — Live app URLs, dataset IDs, all resource references.

### 2. Updated `spec/ENGAGEMENT-CONTEXT-COPY.md`

Update the `## Release` section with MVP2 specifics: what changed, what's new, what value the customer gets.

## Instructions

1. **Write for the consultant going into the review** — this is their prep doc. Every section should help them have a confident, informed conversation.
2. **Tie everything to discovery** — the customer should hear their own words reflected back. "You told us X, so we built Y."
3. **Be honest about gaps** — MVP2 is impressive but not production-ready. Clearly state what needs customer data, what's sample, and what's stubbed. Consultants lose trust when they promise something the build doesn't deliver.
4. **Future ideas should be value stories** — not feature lists. Frame expansions as business outcomes, not technical capabilities.
5. **No stage codes or internal jargon** — write for humans, not the pipeline.

## Checkpoint

```
@500apps-pipeline checkpoint=stage-k status=complete
```
