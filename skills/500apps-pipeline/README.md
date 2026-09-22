# 500 Apps pipeline — team guide

This folder is the **500apps-pipeline** meta-skill: ordered instructions for the autonomous worker **and** for ArmOS desktop agents. The agent reads **`SKILL.md`** plus the **`steps/`** files you maintain here; **UX passes** pull in **`modules/`** checklists.

---

## Where everything lives (edit here)

| What | Path in repo |
|------|----------------|
| Meta-skill entry (triggers, stage map, checkpoints, post-discovery loop) | [`SKILL.md`](./SKILL.md) |
| Per-stage instructions (what to do, inputs, outputs) | [`steps/`](./steps/) |
| Reusable UX / outcome prompts (included by `05b`) | [`modules/`](./modules/) |
| **Engagement context ProCode shell** (agents look here first) | [`template/engagement-context-app/README.md`](./template/engagement-context-app/README.md) |
| Memory + asset-catalog contract | [`modules/engagement-memory-and-assets.md`](./modules/engagement-memory-and-assets.md) |
| **Enterprise prompt patterns** (outcome framing, interface contracts, demo/QC gates) | [`modules/enterprise-prompt-patterns.md`](./modules/enterprise-prompt-patterns.md) |
| Build / test behavior (not forked — referenced by name) | `core/skills/ps-build/skills/` e.g. `procode-app-builder`, `app-orchestrator`, `app-tester` |

**API id:** plugin `ps-build`, skill `500apps-pipeline` → gateway `GET /mcp/skills/ps-build/500apps-pipeline` returns [`SKILL.md`](./SKILL.md) body.

---

## How it runs in the final architecture

| Runtime | Role |
|---------|------|
| **mcp-gateway** | Serves skills from disk via `CORE_SKILLS_PATH` (monorepo `core/skills`). Optionally syncs the same files to **S3** for other consumers. |
| **agent-worker (EC2)** | Polls jobs, fetches this skill over HTTP, runs `claude -p` with MCP → **gateway** (tools + credential broker). **No** `core/` checkout on the worker. |
| **ArmOS (desktop)** | Same skill content; tools may be local stdio today or gateway later — **same SKILL.md**. Humans finish **L–M** (final tweaks, QA, branding). |
| **OaaS / platform** | Stage **A** (intake to S3), scheduling (e.g. post-SOW jobs), DB queue — **not** defined inside `steps/` here. |

Canonical architecture: [`armos_cloud/docs/PLAN-autonomous-worker.md`](../../../../armos_cloud/docs/PLAN-autonomous-worker.md).

### What we incorporated (enterprise prompt log)

From proven **outcome-based app** prompt practice (adapted to **our** gateway/worker/ArmOS stack — no vendor-specific LLM routing):

- **Intake / research:** Anchor on concrete Domo artifacts; method directive (APIs/MCP); entity + relational scope so results stay tied to *this* submission.
- **North star & spec:** Philosophy-first and **bookend** outcomes; ambition on **impact** not feature count; **context-dense** specs so a fresh session can execute without re-research.
- **Solution thinking:** Process + product lenses; explicit **data / connector / Domo API** questions; journey-level optimization.
- **Surfaces:** Per-surface **spec sheet** mindset (purpose, components, data, states) before implementation.
- **Build:** **Interface contract** — stable handler names, DOM ids, and bootstrap order when logic and UI layers split; avoid placeholder ids and partial enums in UI.
- **Demo:** Narrative seed data; real dataset wiring when allowed; **prompt tuning on real samples**; persona-specific walkthrough script.
- **QC:** Integration checks (enums, boot order, mock/seed alignment); **enterprise UX** (contrast, elevation vs border-chrome, async feedback, single-source CSS); **triple-zero** gate (errors, dead clicks, invisible controls) before handoff.

Detail: [`modules/enterprise-prompt-patterns.md`](./modules/enterprise-prompt-patterns.md).

### Resume contract (worker / `paused_turn_limit`)

When the cloud worker hits **`--max-turns`** or a human clicks **Resume** in ArmOS, the next `claude -p` invocation must **read existing artifacts** before continuing. Each **`steps/*.md`** should explicitly list **which files under `500apps/{account}/`** are inputs for that stage (survey JSON, `NORTHSTAR.md`, `BUILD-SPEC.md`, etc.). If a step only describes greenfield work, add a short **“If resuming”** bullet with those paths.

---

## Steps → instructions file → outputs → checkpoint

All artifact paths are under **`s3://{bucket}/500apps/projects/{account}/`** unless noted. `{account}` is the engagement account key. App source code goes in **`code/`** (not `artifacts/mvp1/`) — ArmOS reads `code/` for local preview and deploy.

| Stage | Step / platform | **Edit this** (instructions) | **Typical outputs** | Checkpoint id |
|-------|-----------------|------------------------------|------------------------|-----------------|
| **A** | Intake | Platform (scanner, OaaS) | `survey/submission-*.json`, `pipeline_run` | *(platform)* |
| **B** | Memory + fields | [`steps/00-intake-fields.md`](./steps/00-intake-fields.md) | Normalized field map; **recall** account + engagement + patterns; **asset_compose** | `stage-b` |
| **C** | North star | [`steps/01-objective-northstar.md`](./steps/01-objective-northstar.md) | `objective/NORTHSTAR.md` | `stage-c` |
| **D** | Surface planning | [`steps/02-surface-planning.md`](./steps/02-surface-planning.md) | `spec/SURFACE-PLAN.md` — **engagement context app** (template) + **MVP1**; optional **`spec/PROCESS-FLOW.md`** | `stage-d` |
| **E** | Sample data plan | [`steps/03-sample-data-plan.md`](./steps/03-sample-data-plan.md) | `spec/SAMPLE-DATA-PLAN.md` | `stage-e` |
| **F** | Build spec | [`steps/04-build-spec.md`](./steps/04-build-spec.md) | `spec/BUILD-SPEC.md` — **two deliverables**, layout (tabs vs stack), **draft** context copy | `stage-f` |
| **G1** | MVP + context deploy | [`steps/05-mvp-build-v1.md`](./steps/05-mvp-build-v1.md) + **`procode-app-builder`** | **Pre-built context template** + **MVP1** on domo-ps-repo; `MVP-V1-NOTES.md` | `stage-g1` |
| **G2** | UX critique → revise | [`steps/05b-ux-expert-iteration.md`](./steps/05b-ux-expert-iteration.md) + **`modules/*`** | Both apps; `artifacts/UX-V2-REPORT.md` | `stage-g2` |
| **H** | Discovery handoff | [`steps/06-discovery-handoff.md`](./steps/06-discovery-handoff.md), [`modules/discovery-call-prep.md`](./modules/discovery-call-prep.md), [`modules/engagement-context-app-template.md`](./modules/engagement-context-app-template.md) | `DISCOVERY-HANDOFF.md`; **`DISCOVERY-EMAIL.md` (internal)**; **`ENGAGEMENT-CONTEXT-COPY.md`** | `stage-h` |
| **I** | SOW / Gong | *(people + ingest)* | Transcripts, SOW docs under `sow/` etc. | — |
| **J** | Post-discovery replay | **Same `steps/` as C→F, then `05`, then `05b`** | Updated spec + context **`## Release`** + MVP; `stage-j2` for UX | `stage-j2` (UX) |
| **K** | Consultant pack | *(separate prompt / product)* | Pack for consultants | *(product)* |
| **L–M** | Final polish | *(human ArmOS)* | Customer-ready app | — |
| **N** | Delivery doc | [`steps/07-delivery-doc.md`](./steps/07-delivery-doc.md) | `delivery/` + **user guide in context app** + **memory_remember** (approved) | `stage-n` |
| **O** | Pattern storage | [`steps/08-pattern-storage.md`](./steps/08-pattern-storage.md) | Cross-account patterns (not same as N or engagement memory) | `stage-o` |

**Optional survey brief:** [`modules/outcome-discovery-brief.md`](./modules/outcome-discovery-brief.md) → often `objective/OUTCOME-BRIEF.md` (see module).

**Process flow (when adoption depends on workflow):** [`modules/process-flow-comparison.md`](./modules/process-flow-comparison.md) → `spec/PROCESS-FLOW.md` (current vs to-be + Mermaid); refine pre-call, on-call, or post-discovery.

**Handoff → context app:** Rich `DISCOVERY-HANDOFF.md` (e.g. *What We Built*, *Out of Scope*, *Risks*, *Call Prep*) is **distilled** into the 1–2 slide engagement context app per [`engagement-context-app-template.md`](./modules/engagement-context-app-template.md) — not pasted in full.

**Memory and catalog:** [`modules/engagement-memory-and-assets.md`](./modules/engagement-memory-and-assets.md) — when to **read** memory (industry, similar use cases, graph links), **`asset_compose` / `asset_get`**, when to **write** after survey/discovery/follow-ups vs after **client sign-off** (N), and how that differs from stage **O**.

---

## Delegated skills (behavior lives there)

| Used for | Skill folder | Change UX/build standards here |
|----------|--------------|----------------------------------|
| ProCode deploy, templates, SDK | `procode-app-builder` | That skill’s `SKILL.md` |
| Routing CE / AppDB / ProCode | `app-orchestrator` | That skill’s `SKILL.md` |
| Browser QA | `app-tester` | That skill’s `SKILL.md` |
| Datasets / SQL | `domo-datasets` (MCP) | MCP server + tools |

Do **not** duplicate long how-tos inside `500apps-pipeline` — only gates, order, and artifacts.

---

## How the team improves this

1. **Edit** the right file in [`steps/`](./steps/) or [`modules/`](./modules/) (or [`SKILL.md`](./SKILL.md) for global rules / stage table / checkpoints).  
2. **Open a PR** on the monorepo; get review from PS build + platform if worker/checkpoints change.  
3. **Ship** with anything that deploys **mcp-gateway** so `CORE_SKILLS_PATH` picks up `core/skills`.  
4. **Smoke-check:** `GET /mcp/skills/ps-build/500apps-pipeline` returns updated markdown.  
5. **Worker/UI:** checkpoint lines `@500apps-pipeline checkpoint=…` are stable contracts — change ids only with worker + UI updates.

---

## Related docs

| Doc | Use |
|-----|-----|
| [`PLAN-autonomous-worker.md`](../../../../armos_cloud/docs/PLAN-autonomous-worker.md) | Worker, gateway, S3, stages A–O, backlog |
| [`PLAN-cloud-skills.md`](../../../../docs/plans/PLAN-cloud-skills.md) | Broader cloud-skills roadmap (optional) |
