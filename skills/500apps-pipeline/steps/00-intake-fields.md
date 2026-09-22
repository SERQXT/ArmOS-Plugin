# Stage B — Intake fields & memory hooks

**Maps to pipeline stage:** B (Memory + fields)

## Inputs

- Raw survey row(s) under `500apps/{account}/survey/` (e.g. `submission-*.json`) or equivalent intake payload.
- Account / industry / timestamps as provided by schema.
- **Memory:** **`memory_recall`** (and optionally **`memory_bundle`**) — scope **`{account_id}`**, intents **`"prep"`** (account facts, prior engagement notes) and **`"patterns"`** (cross-account). **Deep / graph-style queries** when your platform supports them: industry, use case (e.g. triage, routing), “similar engagements” — use for **D–F** grounding, not for inventing scope.

## Outputs (exact filenames — do not rename)

- **`artifacts/INTAKE-FIELDS.md`** — normalized field map (markdown table) covering: business context, stakeholders, **survey comments**, **first name, last name, title**, constraints, and any custom columns the schema provides.
- Short **memory notes**: what to remember for later stages (no duplication of full survey — store pointers and summaries).
- **Asset catalog:** results of **`asset_compose`** (and **`asset_get`** on candidates) — what reusable ProCode/ETL/dashboard assets exist for this problem class; cite in downstream **`BUILD-SPEC.md`** when reusing.

## Instructions

**Research discipline:** When pulling survey or account context from Domo, **anchor** with concrete artifacts (card URL, dataset id, submission key) where possible; prefer **API/MCP-backed** extraction over vague browsing. Keep scope tied to **this submission** (relational scope) so enrichment does not drift into unrelated account history — see **`modules/enterprise-prompt-patterns.md` §1**.

1. Parse the submission; choose a **stable row key** (submission id, batch id, or hash) and record it in the artifact header.
2. **Recall** account + engagement + patterns per **`modules/engagement-memory-and-assets.md`**; align with but do not override **verbatim** survey text.
3. **Search** **`compass-asset-catalog`**: **`asset_compose`** for composable matches; **`asset_get`** for detail when reuse is likely.
4. Extract **verbatim** high-signal text (comments, free-text) — do not over-summarize before downstream stages need it.
5. List **data sources** mentioned or implied (Domo datasets, external systems) as **unverified** until E/F.
6. If fields are missing, **list gaps** explicitly rather than inventing values.
7. Optionally **`memory_remember`** a **short** “survey ingested” stub (pointer to `survey/`, themes) — see engagement-memory module for incremental writes.
8. Do **not** run build spec or ProCode in this step.

## Checkpoint

When done:

```
@500apps-pipeline checkpoint=stage-b status=complete
```
