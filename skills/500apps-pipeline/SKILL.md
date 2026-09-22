---
name: 500apps-pipeline
tier: 2
description: "Meta-skill for the 500 Apps in 30 Days autonomous pipeline: intake through north star, surface planning and sample data before build spec, MVP ProCode v1 then UX expert critique-and-revision pass, discovery handoff, post-discovery replay with artifact updates, MVP2 build with real Domo features (datasets, AI, AppDB, Code Engine), persona-driven UX, handoff docs, delivery docs, pattern storage. Applies enterprise prompt/build patterns (outcome-first specs, interface contracts, demo/QC gates) from modules/enterprise-prompt-patterns.md alongside each step. Reads account/engagement memory and compass-asset-catalog (asset_compose/asset_get) before build; writes memory after milestones and client approval. Canonical ProCode shell: template/engagement-context-app/. Triggers: '500 apps pipeline', 'run the survey-to-build pipeline', '500Apps pipeline stage', 'autonomous app build for [account]'."
maturity: alpha
audience: [orchestration, delivery]
---

# 500 Apps Pipeline

Orchestrates the **500 Apps in 30 Days** flow from survey intake through internal ProCode builds, UX iteration, human discovery handoff, and post-SOW rebuilds. This skill is the **single chain** the cloud worker (or ArmOS desktop) follows; it **does not** replace lower-level skills — it **delegates** to them.

**Team overview** (steps, artifacts, runtime, how to change instructions): [`README.md`](./README.md).

### Skills, tools, and auth — everything you need is already configured

The referenced skills (`procode-app-builder`, `dashboard-builder`, `card-builder`, `app-orchestrator`, `app-tester`, `appdb-manager`, `code-engine-builder`, `etl-builder`, `workflow-builder`, `ai-chat-tester`) and MCP tools (`domo-datasets`, `domo-pages`, `domo-publish`, `domo-appdb`, `domo-dataflows`, `domo-ai-chat`, `compass-memory`, `compass-asset-catalog`) have been used successfully across hundreds of builds. The authentication tokens, instance targeting, and API permissions are pre-configured in your MCP config. **You should not encounter auth errors, missing tools, or permission issues if you follow the skill instructions exactly.** If a tool call fails, check that you're using the correct tool name and parameters per the skill — do not invent workarounds or skip deployment steps. Every build must produce a deployed, working app on the target Domo instance.

## Triggers

- "500 apps pipeline"
- "run the survey-to-build pipeline"
- "500Apps pipeline" / "stage [letter] of 500 apps"
- "autonomous app build for [account]"
- Internal worker job with pipeline id and account context

---

## Checkpoint markers — MANDATORY after EVERY stage

After completing each stage's outputs, you MUST emit the checkpoint marker on a line by itself. This is how the worker tracks progress. **If you skip this, the pipeline loses track of where you are.**

```
@500apps-pipeline checkpoint={stage-code} status=complete
```

Stage codes (emit the EXACT code after finishing that stage's outputs):

| After finishing | Emit this exact line |
|----------------|---------------------|
| Intake fields (B) | `@500apps-pipeline checkpoint=stage-b status=complete` |
| North star (C) | `@500apps-pipeline checkpoint=stage-c status=complete` |
| Surface planning (D) | `@500apps-pipeline checkpoint=stage-d status=complete` |
| Sample data plan (E) | `@500apps-pipeline checkpoint=stage-e status=complete` |
| Build spec (F) | `@500apps-pipeline checkpoint=stage-f status=complete` |
| MVP build (G1) | `@500apps-pipeline checkpoint=stage-g1 status=complete` |
| UX polish (G2) | `@500apps-pipeline checkpoint=stage-g2 status=complete` |
| Discovery handoff (H) | `@500apps-pipeline checkpoint=stage-h status=complete` |
| Post-discovery artifact update (I) | `@500apps-pipeline checkpoint=stage-i status=complete` |
| MVP2 build (J1) | `@500apps-pipeline checkpoint=stage-j1 status=complete` |
| MVP2 UX polish (J2) | `@500apps-pipeline checkpoint=stage-j2 status=complete` |
| MVP2 handoff (K) | `@500apps-pipeline checkpoint=stage-k status=complete` |
| Security review (SEC) | `@500apps-pipeline checkpoint=stage-sec status=complete` |
| Delivery docs (N) | `@500apps-pipeline checkpoint=stage-n status=complete` |
| Pattern storage (O) | `@500apps-pipeline checkpoint=stage-o status=complete` |
| Load final code (INGEST) | `@500apps-pipeline checkpoint=stage-ingest status=complete` |
| Capture final demo (DEMO) | `@500apps-pipeline checkpoint=stage-demo status=complete` |

Emit each one as you complete that stage — do not batch them at the end. Do not use different codes (e.g., do NOT emit `stage-j2` when you mean `stage-h`).

---

## Step files are MANDATORY — read before executing

Each stage has a step file in `steps/` (listed in the stage table below). You MUST read the step file BEFORE producing any outputs for that stage. The step file contains the exact instructions, artifact names, verification checks, and checkpoint markers. **Do not infer what a stage needs from this summary — read the step file.**

If the step file references modules (`modules/*.md`) or other skills (`procode-app-builder`, `dashboard-builder`, etc.), read those too. The step files reference them for a reason — they contain patterns that have been validated across hundreds of builds. Inventing your own approach instead of following the step file is the #1 cause of broken builds.

**How to read:** The step files are in your workspace at `skills/500apps-pipeline.md` (this file). The individual step files are served by the gateway — use `curl -sf "{gateway}/mcp/skills/ps-build/500apps-pipeline/file?path=steps/{filename}"` to fetch each one. Read it fully before starting that stage's work.

---

## Non-negotiable order

1. **Surface planning (D) + sample data plan (E) must complete before build spec (F).**  
2. **MVP v1 (G1) -> UX expert pass (G2) -> discovery handoff (H).** Do not hand off raw v1. G2 is **critique then revise** (`steps/05b-ux-expert-iteration.md`), anchored to outcomes.  
3. **After discovery:** when **notes + transcript + SOW** are available, run the **post-discovery rebuild loop** below — update artifacts in place (I), then MVP2 build (J1), UX polish (J2), and handoff (K).  
4. **Security review (SEC) must pass before delivery (N).** CRITICAL/HIGH findings block delivery. The app stays on the internal instance until all blocking findings are resolved. See `steps/13-security-review.md`.
5. **Delivery doc (N)** and **pattern storage (O)** are **separate** artifacts — do not merge into one file.
6. **MVP1 (G1)** is a **showcase / talking piece** — not a finished product. Use **`NORTHSTAR.md`** + **D/E/F** for multi-angle planning from **thin intake**; **`mock-teaser`** inside **MVP1** for upsell tease. **Engagement context app** (**separate** pre-built template — **`engagement-context-app-template.md`**, **canonical repo path** **`template/engagement-context-app/`**) is **not** part of the MVP1 codebase; **Tab 1 / stacked top** = context, **Tab 2 / scroll** = MVP1. Agents **always** open that folder first for ProCode source; behavior and slots stay in **`modules/engagement-context-app-template.md`**.
7. **MVP2 (J1)** is a **fully functional Domo app** — real datasets, AppDB, Domo AI integration, and optionally Code Engine / Workflows. MVP1's seed data and mocks are replaced with actual Domo platform features.

### Output rules (all stages, all artifacts, all apps)

1. **No emojis.** Never use emoji characters in any output — not in artifacts, not in app UI, not in markdown, not in email copy. They look unprofessional. For UI icons, use a proper icon library (Lucide, Heroicons, Material Icons, or inline SVG) — never emoji as a substitute.
2. **No stage codes in human-facing outputs.** Internal stage identifiers (G1, G2, J1, J2, H, N, O, etc.) are for pipeline orchestration only. They must **never** appear in artifacts (`DISCOVERY-HANDOFF.md`, `DISCOVERY-EMAIL.md`, `ENGAGEMENT-CONTEXT-COPY.md`, `MVP-V1-NOTES.md`, delivery docs), app UI, tooltips, data labels, status text, or anything a human reads. Instead use plain descriptions: "the demo app", "after discovery", "the polished version", "post-discovery rebuild", "mock data — real dataset connected after discovery". If a mock/placeholder label needs to explain timing, say **when** it happens, not **which stage code** it maps to.

### Memory, graph, and asset catalog

Before **C–F**, **recall** account and engagement context and **search** reusable assets — see **`modules/engagement-memory-and-assets.md`**. After **survey**, **discovery**, and **follow-ups**, **remember** incrementally; after **client approval** of delivery (stage **N**), **persist** canonical engagement + account rollup. Stage **O** stores **cross-account patterns** — not a substitute for engagement-specific memory.

Reference implementations stay in **`procode-app-builder`**, **`dashboard-builder`**, **`card-builder`**, **`app-orchestrator`**, **`app-tester`**, **`procode-security-review`**, **`appdb-manager`**, **`code-engine-builder`**, **`workflow-builder`**, **`etl-builder`**, **`ai-chat-tester`**, **`domo-datasets`** — **do not fork** their logic into this meta-skill; invoke them by name and follow their SKILL.md when executing builds and tests. Specifically: **`procode-app-builder`** for app builds and publishing, **`dashboard-builder`** for page creation and 60-unit grid layout (v2 pages, `layout_convert` + `layout_set`), **`card-builder`** for data wiring and chart types, **`appdb-manager`** for AppDB collection CRUD, **`code-engine-builder`** for serverless functions, **`workflow-builder`** for Domo Workflows.

### Traceability — prior outputs + north star (anti-drift)

- **Each stage consumes the last stage's artifacts** (see **`## Inputs`** in each `steps/*.md`). Do not invent scope that is not grounded in prior files for this job.
- **`objective/NORTHSTAR.md`** is the **outcome anchor** for every stage **after C**. Re-read it when starting **D, E, F, G1, G2, H, I, J1, J2, K, N**; if a decision would **contradict** the north star, **stop** and either update `NORTHSTAR.md` (with rationale) or fix the work — do not silently drift.
- **`objective/OUTCOME-BRIEF.md`** (when present) and survey themes stay aligned with **`NORTHSTAR.md`**; post-discovery, **notes/transcript/SOW** update the same chain on the **I -> J** replay.
- **Build and UX** (`05`, `05b`, `10`) must satisfy **`BUILD-SPEC.md`** **and** remain **consistent with `NORTHSTAR.md`**; flag conflicts in artifacts.

### Enterprise prompt & build patterns (read + apply)

**Why two places?** This section is **woven into SKILL.md** so every run that loads this skill sees the **mindset and checklist** immediately. **`modules/enterprise-prompt-patterns.md`** holds the **full tables, examples, and QC gates** — load it when executing stages **B through J2** (and post-discovery replay of the same steps). Do not skip the module on first build of an app; skim the section matching your stage before writing artifacts.

**How Claude Code / the worker should use this**

1. **Before** producing outputs for the current stage, open **`steps/<stage>.md`** *and* re-read the matching section in **`modules/enterprise-prompt-patterns.md`** (or the whole module once per job if context allows).  
2. **Think through** the inline checklist below explicitly (brief mental or scratch validation — not optional for G1/G2/J1/J2).  
3. **Embed** contract and outcome thinking **in the artifacts** (`NORTHSTAR.md`, `BUILD-SPEC.md`, UX report), not only in chat — so the *next* session inherits the discipline.

**Always-on checklist** (enterprise-grade apps)

| # | Ask before you ship the stage |
|---|-------------------------------|
| 1 | **Outcomes** — Does this trace to `NORTHSTAR.md` / survey evidence (or discovery notes for J-stages), or am I adding features that do not move the outcome? |
| 2 | **Anchors** — Intake/research: concrete Domo artifacts + APIs/MCP; scope tied to *this* submission/account. |
| 3 | **Spec density** — Would a **fresh implementer** have named surfaces, data bindings, and integration points without re-discovery? |
| 4 | **Interface contract** — Handler names, DOM ids, bootstrap order documented when logic and UI can split? |
| 5 | **Meaningful AI** — Every Domo AI / automation hook has a *why*; none are gratuitous. Agentic features serve a persona's daily decision-making. |
| 6 | **Demo / data** — MVP1: seeds tell a **story**. MVP2: real Domo datasets, AppDB, Domo AI integration. Mocks cover every id the UI references. |
| 7 | **UX gate** — Contrast (control vs container), async feedback, no border-chrome-as-hierarchy, single-source CSS — see **`modules/ui-quality-audit.md`** enterprise supplement + **`enterprise-prompt-patterns.md`**. J2: persona-driven. |
| 8 | **Viewport** — Is the hero metric and primary CTA visible in the initial viewport (1440x900) without scrolling? Compare to the viewport blueprint in BUILD-SPEC. |
| 9 | **Brand Kit** — Does the app use a properly derived brand kit from `spec/BRAND-KIT.md` (customer colors + playbook structural patterns), not default/generic styling? |
| 10 | **Happy Path** — Can the primary user complete their most common task in 3 clicks or fewer from app open? Count and document. |
| 11 | **Evidence** — Do NORTHSTAR and handoff artifacts cite verbatim customer quotes with source attribution (survey field or Gong call)? |
| 12 | **Lift table** — Does BUILD-SPEC define a 5-to-9/10 target per surface, and does the build track progress against it? |

Full reference: **`modules/enterprise-prompt-patterns.md`**.

---

## Stage map (A–O) -> step files

| Stage | Name | Step file | Artifact focus |
|-------|------|-----------|----------------|
| A | Intake (OaaS) | *(platform)* | `survey/submission-*.json`, `pipeline_run` |
| B | Memory + fields | `steps/00-intake-fields.md` | **`artifacts/INTAKE-FIELDS.md`** |
| C | North star | `steps/01-objective-northstar.md` | **`objective/NORTHSTAR.md`** |
| D | Surface planning | `steps/02-surface-planning.md` | **`spec/SURFACE-PLAN.md`** (+ optional `spec/PROCESS-FLOW.md`) |
| E | Sample data plan | `steps/03-sample-data-plan.md` | **`spec/SAMPLE-DATA-PLAN.md`** + **`code/data/seeds.js`** |
| F | Build spec | `steps/04-build-spec.md` | **`spec/BUILD-SPEC.md`** + **`spec/ENGAGEMENT-CONTEXT-COPY.md`** |
| G1 | MVP build v1 | `steps/05-mvp-build-v1.md` | **`artifacts/MVP-V1-NOTES.md`** + **`artifacts/deploy-result.json`** |
| G2 | UX expert -> v2 | `steps/05b-ux-expert-iteration.md` | **`artifacts/UX-V2-REPORT.md`** |
| H | Discovery handoff | `steps/06-discovery-handoff.md` | **`artifacts/DISCOVERY-HANDOFF.md`** + **`artifacts/DISCOVERY-EMAIL.md`** |
| — | Human discovery | *(people)* | SOW, Gong, `documents/DISCOVERY-NOTES.md` |
| I | Post-discovery artifact update | `steps/09-post-discovery-update.md` | **Update in place:** NORTHSTAR, SURFACE-PLAN, SAMPLE-DATA-PLAN, BUILD-SPEC |
| J1 | MVP2 build (real Domo) | `steps/10-mvp2-build.md` | Real datasets, AppDB, Domo AI, Code Engine; **`artifacts/MVP2-NOTES.md`** |
| J2 | MVP2 UX (persona-driven) | `steps/05b-ux-expert-iteration.md` | Persona-driven critique -> revise; **`artifacts/UX-MVP2-REPORT.md`** |
| K | MVP2 handoff | `steps/11-mvp2-handoff.md` | What was built, gaps, future ideas; **`artifacts/MVP2-HANDOFF.md`** |
| SEC | Security review | `steps/13-security-review.md` | OWASP, secrets, XSS, injection, AI safety; **`artifacts/SECURITY-REVIEW.md`** |
| L–M | Human in ArmOS | *(product)* | **final** tweaks — QA guilds, data rewire, branding; after automated loop yields polished baseline |
| — | Wire customer data | `steps/12-wire-customer-data.md` | Bind app to customer datasets; optional staging ETL; **`artifacts/DATA-WIRING-REPORT.md`** |
| N | Delivery documentation | `steps/07-delivery-doc.md` | **`delivery/DELIVERY-SUMMARY.md`**, **`delivery/USER-GUIDE.md`**, **`delivery/CONTEXT-APP-DELIVERY.md`**, **`delivery/MEMORY-SIGNOFF.md`** + **memory_remember** |
| O | Pattern storage | `steps/08-pattern-storage.md` | cross-account patterns (not same as N or engagement memory) |
| INGEST | Load final code from consultant | `steps/14-ingest-final-code.md` | Backup existing code, upload final, update artifacts to match |
| DEMO | Capture final demo | `steps/15-publish-internal-demo.md` | Anonymize, sample data, capture to **domo-ps-repo.domo.com** as reusable reference |

---

## S3 layout (artifacts bucket)

Prefix: **`500apps/projects/{account}/`** — mirrors ArmOS's workspace convention so files sync bidirectionally.

**Folder layout (use these paths exactly):**
- `survey/` — intake submission JSON
- `objective/` — `NORTHSTAR.md`
- `spec/` — `BUILD-SPEC.md`, `ENGAGEMENT-CONTEXT-COPY.md`
- `artifacts/` — surface-planning.md, sample-data-plan.md, UX reports, MVP notes, MVP2 notes
- `code/` — **app source code** (index.html, app.js, components/, styles/, data/, services/) — ArmOS reads `code/` for local preview and deploy
- `sow/` — SOW documents (uploaded by human via ArmOS after discovery)
- `documents/` — **`DISCOVERY-NOTES.md`** (human-entered call notes and observations from the ArmOS UI), Gong transcript, structured discovery IDs, and other uploaded documents
- `delivery/` — delivery documentation (stage N)
- `mail-out/` — optional outbound

**`finder-knobs/`** (cursors, control files) lives at **bucket root**, not under `500apps/`.

---

## Internal instance & naming

- **Instance:** `domo-ps-repo.domo.com` for internal MVP and worker builds (or as specified in the pipeline brief's `instance` field — the brief is the source of truth).
- **App / project naming:** use prefix pattern **`500Apps|{customer}|`** (or equivalent per org convention) so builds are identifiable in the internal tenant.

### Domo API access

**Use MCP tools** (`domo-datasets`, `domo-pages`, `domo-publish`, `domo-appdb`, etc.) for Domo API operations. These tools are pre-configured with the correct instance and authentication headers. **Do NOT:**
- Hardcode instance hostnames — read from the pipeline brief
- Copy Domo URLs from prior checkpoint state or old runs — verify live via API

**For app publishing:** Follow the `procode-app-builder` skill's Step 8a — it defines the authoritative publish method.
- **ArmOS desktop:** You MUST use `domo publish` CLI. The CLI is the reliable, battle-tested path. Do not use the `procode_publish` MCP tool on desktop.
- **Cloud worker (EC2):** You MUST use the `procode_publish` MCP tool — the CLI is not available in the cloud worker environment.

---

## Survey -> outcomes

The **survey datasource** is the source of truth for the **five outcome themes** (winning state, Tuesday user, hero metric, least-confident decision, wow factor) **where the schema supports them**. See `modules/outcome-discovery-brief.md`. **Human discovery** goes **deeper** than the survey — relationships, constraints, data reality — and is **not** replaced by this automation.

### Discovery call prep (stage H) + engagement context app

**Landing motion:** **`DISCOVERY-HANDOFF.md`** + **`DISCOVERY-EMAIL.md`** (**internal** — consultant/sales; may be missed) + **`ENGAGEMENT-CONTEXT-COPY.md`** for the **separate engagement context app** (`modules/engagement-context-app-template.md`) — **pre-built org template**, **not** inside MVP1. Layout: **stacked** (context above, scroll to MVP) or **App Studio Tab 1 / Tab 2**. Same template at **each release** and **delivery (N)** — user guide + screenshots in template **delivery** section. **`discovery-call-prep.md`** defines narrative. **G1** deploys **template + MVP1**; agents **parameterize**, never rebuild shell.

### Process flow (optional but recommended when workflow changes)

For **process-heavy** outcomes (triage, handoffs, approvals), stage **D** may include **`spec/PROCESS-FLOW.md`**: current vs future process **with the app**, comparison, and a **Mermaid** (or slide-ready) visual — see `modules/process-flow-comparison.md`. Use **pre-call** to frame questions, **on-call** to validate, **post-call / J replay** to refresh before rebuild.

---

## Post-discovery rebuild loop (notes + transcript + SOW -> update artifacts -> MVP2 -> UX -> handoff)

After **human discovery**, the following materials land in the project workspace:
- **`documents/DISCOVERY-NOTES.md`** — human-entered call notes and observations (saved from the ArmOS UI)
- **Gong transcript** (when available) — full call recording transcript
- **SOW** — uploaded Statement of Work
- Any **structured discovery IDs** (e.g. SID or your org's equivalent)

**The discovery call is the source of truth.** The initial survey was just five questions. The discovery call is where all the real logic comes from — customer priorities, workflow details, data reality, persona descriptions, and corrections to every assumption made in MVP1. The notes and transcript carry **massive weight** over the survey. Expect significant changes.

### Phase I: Update all artifacts in place (not from scratch)

The worker **does not** rebuild artifacts from scratch. It **reads each existing artifact**, compares it to what the customer actually said in discovery, and **updates it in place** — preserving what was correct, correcting what was wrong, and adding what was missing. This is a surgical update pass, not a greenfield rewrite.

See `steps/09-post-discovery-update.md` for full instructions.

| Order | What changes |
|-------|----------------|
| 1 | **Read** `documents/DISCOVERY-NOTES.md`, Gong transcript (if available), SOW. Build a clear picture of what the customer said. |
| 2 | **`objective/NORTHSTAR.md`** — Re-anchor outcomes from discovery. The customer may have confirmed, corrected, or completely redirected the north star. Update, don't replace. |
| 3 | **`spec/SURFACE-PLAN.md`** — Re-evaluate surfaces based on personas the customer described. Add/remove/modify screens based on what workflows they actually need. |
| 4 | **`spec/SAMPLE-DATA-PLAN.md`** — Refresh with real data descriptions the customer gave. If they described schemas, systems, or data sources, update the plan to reflect those. Now plan for **real Domo datasets** (not just seeds). |
| 5 | **`spec/BUILD-SPEC.md`** — Update scope, surfaces, acceptance checks, and data bindings to align with SOW/transcript. Add Domo platform features needed for MVP2 (datasets, AI, AppDB, Code Engine). If process-heavy, refresh `spec/PROCESS-FLOW.md`. |
| 6 | **`spec/ENGAGEMENT-CONTEXT-COPY.md`** — Update with post-discovery context and `## Release` section. |

**Key rule:** Read the existing artifact first. Identify what the customer confirmed vs what changed. Update the artifact with tracked rationale (e.g., "Updated per discovery: customer described X instead of Y"). Do not start from a blank page.

### Phase J1: MVP2 build (fully functional on Domo)

**MVP2 is a fundamentally different app from MVP1.** MVP1 was a mock/showcase with seed data. MVP2 is a **fully functional Domo app** powered by real datasets, Domo AI, and AppDB. See `steps/10-mvp2-build.md` for full instructions.

**MVP2 requirements (non-negotiable):**

1. **Real Domo datasets** — Create sample datasets in the internal Domo instance (`domo-ps-repo.domo.com`) that are highly representative of the customer's described data. Use `domo-datasets` MCP tools. If the customer gave schemas or described their data sources/systems, use those descriptions to create accurate sample data. Wire these datasets into the app via manifest `mapping` — replace all `window.SEED_DATA` / embedded JS data from MVP1.

2. **AppDB for interactions** — Any user interactions that store data (approvals, notes, settings, saved filters, flagged items) must use AppDB via `domo-appdb` MCP tools. Follow `appdb-manager` skill patterns. If the app allows edits, saves, or stateful interactions, AppDB is required. Read-only dashboards may not need it, but most agentic apps will.

3. **Domo AI integration** — For agentic capabilities, the agent writes app code that calls the Domo AI text generation API (`domo.post('/api/ai/v1/text/generation', {...})` via the SDK). This is a platform API, not an MCP tool — the agent builds the integration into the ProCode app source. Think through the persona: what information will they be looking for? Common patterns:
   - **Daily brief / summary** at the top describing overall status based on current data
   - **Top 3-5 items to look at** — flagged priorities, good or bad
   - **Insights and recommendations** surfaced inline alongside data
   - Not every app needs AI, but agentic solutions should layer it in wherever it helps the user make faster decisions. Each AI integration must have a clear *why* tied to the persona's daily job.

4. **AppDB for AI responses** — If the app calls Domo AI to generate summaries, insights, or recommendations, cache those responses in AppDB so they persist across sessions and don't re-call the API on every page load.

5. **Code Engine (when needed)** — If the app needs server-side functionality that shouldn't run in the browser (scheduled processing, webhook handlers, complex data transforms, email notifications), build a Code Engine function using `code-engine-builder` skill. Keep it light for MVP2 — this is still an internal demo. Use Code Engine when:
   - The app needs to run scheduled jobs
   - Processing is too heavy for client-side
   - Security requires server-side execution
   - A workflow trigger or webhook is needed

6. **Workflows (when needed)** — If the customer described a process that involves sending emails, notifications, or kicking off downstream actions, build a light Domo Workflow. Keep scope minimal: trigger -> action -> notification.

**What MVP2 is NOT:** It's still on the internal instance. We're not connecting to the customer's Domo instance or real production data yet. We're creating highly representative sample datasets and building a fully functional app against them.

### Phase J2: UX polish (persona-driven)

Run `steps/05b-ux-expert-iteration.md` but with a **persona-driven** lens. The customer has now described who will use this app. For J2:

1. **Identify all personas** from `documents/DISCOVERY-NOTES.md` / transcript — there may be multiple (e.g., manager, analyst, executive).
2. **For each persona**, walk through the app in their shoes: What's their daily workflow? What do they look at first? What decisions do they make? What insights matter most to them?
3. **Design surfaces for each persona** — if there are multiple personas, they may need different views, dashboards, or navigation paths. Ensure the UX serves each persona's daily job.
4. **Agentic solutions per persona** — surface AI-generated insights, summaries, and flagged items that match what each persona cares about. An executive wants a brief; an analyst wants drill-down; an ops user wants action items.
5. Same five-pillar critique-then-revise pattern as G2, but now grounded in real persona context instead of assumptions.

### Phase K: MVP2 handoff documentation

See `steps/11-mvp2-handoff.md`. Prepare documents for the human reviewer and customer handoff:

1. **What was built and why** — specifically what the customer asked for in discovery and how the app delivers it.
2. **Gaps and limitations** — things the AI couldn't do, assumptions still unvalidated, data that's still sample.
3. **Questions for the customer** — areas where the build could go multiple directions and needs human input.
4. **Future ideas** — expansion opportunities, additional features, and future scopes to pitch to the customer.
5. **Technical summary** — datasets created, AppDB collections, Code Engine functions, Domo AI integrations, workflow triggers. Everything a consultant needs to know to demo and discuss.

After K, the build hands back to humans for review (L-M) before delivery (N).

Optional steps between discovery and this loop (scheduling, ingest, **07:00 ET** jobs, etc.) are **platform/OaaS** — they are not duplicated inside `steps/` here. The **meta-skill** defines the **agent step order** once artifacts exist.

---

## UX iteration (G2 / J2)

Run **`steps/05b-ux-expert-iteration.md`** after each functional build that needs a UX gate (G2 after G1; J2 after post-discovery J1): **critique the current UI**, then **revise** from that critique, anchored to outcomes. **`modules/`** order: **screen-coverage** (every **`built`** surface listed and visited) -> 11-dimension audit -> journey (per surface) -> **interactive-state-testing** (gate on tests 1-3 where applicable) -> optional refinement -> design-system -> upgrade-to-nine. **`mock-teaser`** surfaces get a **light** honesty/label pass. Revisions need not preserve every pixel of the prior version if the critique warrants structural change.

**J2 addition: persona-driven UX.** For J2 specifically, the UX pass must be grounded in the personas the customer described during discovery. Walk each persona through the app. Design for their daily decisions, not abstract "users." See the J2 section above.

**Testing during G2 / J2:** ProCode apps on Domo pages are wrapped in an iframe that blocks interactive testing from the parent page. Use the **two-pass pattern** from `app-tester`: Pass 1 on the Domo page for context/sizing verification, Pass 2 on the direct app URL (`/embed/card/{cardId}` or `qa_domo_app_navigate`) for all interactive scenarios (drawer opens, filter changes, scroll, assertions). Never mark interactive tests as "code verified" when a direct URL is available.

---

## Pipeline checkpoints (machine-readable)

When a **step file** is fully completed for the current job, emit **exactly one line** on its own (worker/UI parsers may grep for these):

```
@500apps-pipeline checkpoint=<id> status=complete
```

Use these ids in order: `stage-b` ... `stage-c` ... through `stage-o` (see each step file for its id). **Do not** emit the checkpoint until outputs for that stage are written to the agreed paths.

---

## Step index

| File | Purpose |
|------|---------|
| `steps/00-intake-fields.md` | Normalize intake; memory + fields |
| `steps/01-objective-northstar.md` | `NORTHSTAR.md` |
| `steps/02-surface-planning.md` | **Context app** (template) + **MVP1** surfaces; **mock-teaser** in MVP1 |
| `steps/03-sample-data-plan.md` | Data plan (before spec) |
| `steps/04-build-spec.md` | **Two deliverables** + layout; MVP1 + **draft** context copy |
| `steps/05-mvp-build-v1.md` | Deploy **context template** + **MVP1**; wire tabs/stack |
| `steps/05b-ux-expert-iteration.md` | UX both apps (G2 and J2) |
| `steps/06-discovery-handoff.md` | **DISCOVERY-HANDOFF**, **DISCOVERY-EMAIL**, **ENGAGEMENT-CONTEXT-COPY** |
| `steps/07-delivery-doc.md` | `delivery/` + **user guide in context app** |
| `steps/08-pattern-storage.md` | Reusable patterns (separate from delivery) |
| `steps/09-post-discovery-update.md` | Update all artifacts in place from `documents/DISCOVERY-NOTES.md`, transcript, SOW |
| `steps/10-mvp2-build.md` | MVP2: real Domo datasets, AppDB, Domo AI, Code Engine, workflows |
| `steps/11-mvp2-handoff.md` | MVP2 handoff docs: what was built, gaps, future ideas |
| `steps/13-security-review.md` | ProCode security review (OWASP, secrets, XSS, prompt injection, AI safety) |
| `steps/12-wire-customer-data.md` | Wire app to customer datasets; schema matching, gap analysis, optional staging ETL |
| `steps/14-ingest-final-code.md` | Load final consultant code, backup existing, update downstream artifacts |
| `steps/15-publish-internal-demo.md` | Capture final demo: anonymize, generate sample data, publish to domo-ps-repo |

## Modules (included by 05b)

| File | Role |
|------|------|
| `modules/screen-coverage-checklist.md` | Every shipped surface **built** vs **mock-teaser**; gate: all **built** visited |
| `modules/ui-quality-audit.md` | 11-dimension audit + top fixes |
| `modules/user-journey-test.md` | Orient -> Confirm per **primary built surface** |
| `modules/interactive-state-testing.md` | Drawers, empty/narrow/density, keyboard — repeat per surface type; gate on tests 1-3 |
| `modules/design-refinement-phases.md` | Phases 1-6 -> a11y |
| `modules/design-system-check.md` | Tokens, type, cards, charts (engagement-specific) |
| `modules/upgrade-to-nine.md` | Top 3 upgrades + verify |
| `modules/outcome-discovery-brief.md` | Survey -> five themes + build brief |
| `modules/process-flow-comparison.md` | Current vs to-be process + app; diagram; use in D when workflow matters |
| `modules/discovery-call-prep.md` | Narrative; internal email vs **separate context app** |
| `modules/engagement-context-app-template.md` | **Pre-built** template; tabs/stack; lifecycle to **delivery** |
| `modules/engagement-memory-and-assets.md` | **memory_recall** / **memory_remember** / **asset_compose**; incremental vs final write; upsell timeline |
| `modules/domo-design-playbook.md` | Domo brand design system — structural patterns (shadows, animations, radius, easing, components) for all apps; full Domo palette for engagement context template |
| `modules/api-wiring-patterns.md` | Canonical wiring patterns from portfolio audit (UPS, manulife, durhamlane, etc.); mock-to-real checklist; risk checklist; human-only work |
| `modules/domo-api-reference.md` | Domo API reference for debugging — auth flow, dataset query, ETL management, pagination; use when MCP tools fail unexpectedly |
| `modules/prd-quality-patterns.md` | Build targets + handoff patterns — hero metric framing, 5-to-9 lift table, timed happy-path, viewport blueprint, brand kit template, verbatim evidence format, scope guards, summary.html |

**Canonical ProCode tree for engagement context:** [`template/engagement-context-app/README.md`](./template/engagement-context-app/README.md).

**Canonical demo context card template:** [`template/demo-context-card/README.md`](./template/demo-context-card/README.md) — used by step 15 (capture final demo). Agents copy this template and inject slot data (problem, outcome, Domo features, solution description). Do NOT redesign the layout per capture.

---

## Parallelism & scope (reference)

Pilot worker concurrency: **max 2** parallel builds; queue the rest. MVP spec should stay bounded (~**1-2 month** human-team equivalent), not a ten-page app or heavy ETL in one shot.
