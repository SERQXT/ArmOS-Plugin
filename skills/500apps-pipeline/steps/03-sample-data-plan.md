# Stage E — Sample data plan + seed data generation

**Maps to pipeline stage:** E — **must run before build spec (F)**

## Inputs

- `objective/NORTHSTAR.md` — data plan must **enable** the metrics/actions promised in the north star (or document gaps).
- `spec/SURFACE-PLAN.md` (or equivalent from D).
- Intake mentions of datasets / domains.

## Outputs

- **`spec/SAMPLE-DATA-PLAN.md`** (exact filename — do not rename) with:
  - **Datasets** — candidate Domo datasets or placeholders; **verified vs assumed** clearly labeled.
  - **Grain & keys** — what a row represents; join assumptions.
  - **Sample / mock strategy** — static JSON, reduced dataset, or synthetic rows for MVP.
  - **Gaps** — missing data that would block MVP vs nice-to-have.
  - **Privacy / PII** — redaction rules if any.
- **`code/data/seeds.js`** — the **actual seed data file** that the MVP app will load. This is a mandatory output, not optional.

## Instructions

**Foundation questions:** Make the plan answer (even if "TBD"): **what data** must exist for the north star, **which connectors** or ingest paths, **which Domo/API surfaces** will be used — **`modules/enterprise-prompt-patterns.md` §3**. For MVP demos, prefer **narrative** sample/mock data (multiple states, a believable story) over flat placeholders — §7.

1. Use **`domo-datasets`** (or documented tools) to **verify** datasets when credentials allow; otherwise state **blocked** and what is needed.
2. Keep MVP bounded: **no** heavy ETL in this stage — plan for **read** paths and minimal writes (e.g. AppDB) if needed.
3. Align columns/metrics with **surfaces** from D so F does not invent charts that have no data.

### Seed data file (MANDATORY)

The sample data plan is not just documentation — it must produce a **working seed data file** that the MVP build (G1) will use. The MVP1 app **must show data on first load** without depending on runtime API calls to succeed.

**Write `code/data/seeds.js`** with:
- JavaScript objects assigned to `window.SEED_DATA` (or similar namespace) — one property per collection/entity.
- **Narrative-quality data**: 10–20 rows per entity with a believable story (not "test1", "test2"). Include multiple statuses, edge cases, and a realistic distribution that demonstrates the app's value.
- **KPI-ready numbers**: seed data must produce meaningful aggregations (totals, rates, trends) that match the hero metric and wow factor from the intake.
- The file must be a plain `<script>` include — no ES modules, no import/export, no build step.

**Example structure:**
```javascript
(function() {
  window.SEED_DATA = {
    emails: [
      { id: "e001", subject: "SSO login failures spiking", sender: "monitoring@internal.com", ... },
      // 14 more rows with a Monday-morning narrative
    ],
    routingRules: [ ... ],
    dailyBrief: { ... }
  };
})();
```

The MVP app in G1 must load `seeds.js` before any components and use `window.SEED_DATA` as the **default data source**. AppDB writes are optional for mutable state (user actions like approve/reject), but **initial display must work from embedded seeds alone** — no dependency on AppDB reads succeeding on first paint.

## Checkpoint

```
@500apps-pipeline checkpoint=stage-e status=complete
```
