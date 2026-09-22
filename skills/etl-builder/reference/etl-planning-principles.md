# ETL Planning Principles

> Shared reference for all ETL skills: **ETL Spec Designer**, **ETL Builder**, and **ETL Input Adapter**.
> Read this before designing, building, or adapting any multi-source ETL pipeline.

---

## 1. Consolidate by Input Affinity

If two transforms share the same input datasets, they belong in the **same ETL** with separate output branches. Each branch gets its own `PublishToVault` tile. This avoids redundant reads and keeps related logic co-located.

When identifying ETL needs, group by shared inputs — not just by business question.

**Example:** A "Sales by Region" report and a "Rep Quota Attainment" report both read the CRM export → one ETL with two output branches, not two separate ETLs.

---

## 2. Layer by Transformation Stage

| Layer | Name | Purpose | Scope |
|-------|------|---------|-------|
| **L1** | Bronze / Staging | Source-specific cleanup — dedup, type casting, naming normalization, schema alignment | One ETL per source system or closely related source group |
| **L2** | Silver / Enrichment | Cross-source joins, business logic, dimension enrichment | Combines cleaned sources into business-meaningful entities |
| **L3** | Gold / Model | Viz-ready aggregations, attribution models, KPI calculations | Optimized for dashboard performance |

### Layer Characteristics

**L1 (Bronze):**
- Input: raw source datasets (connectors, CSV uploads, API imports)
- Transforms: `Unique` (dedup), `Metadata` (type cast), `SelectValues` (rename/drop), `Filter` (remove junk rows)
- Output: one cleaned dataset per source (or multiple via branching)
- Naming: `"{Source} — Cleaned"` or `"{Source} — Staging"`

**L2 (Silver):**
- Input: L1 outputs (cleaned datasets)
- Transforms: `MergeJoin` (cross-source joins), `ExpressionEvaluator` (business formulas), `ValueMapper` (dimension enrichment)
- Output: business entities — "Account 360", "Order History Enriched", "Product Catalog Full"
- Naming: `"{Entity} — Enriched"` or `"{Entity} — Silver"`

**L3 (Gold):**
- Input: L2 outputs (enriched entities)
- Transforms: `GroupBy` (aggregations), `WindowAction` (rankings), `ExpressionEvaluator` (KPI formulas)
- Output: dashboard-ready datasets — "Executive Summary", "Rep Scorecard", "Monthly KPIs"
- Naming: `"{Dashboard/Report Name}"` — final consumer-facing name

---

## 3. Right-Size the Layers

Not every implementation needs full Bronze/Silver/Gold. Match complexity to the use case:

| Scenario | Recommended Approach |
|----------|---------------------|
| 1–2 source systems, simple transforms | 1 ETL — collapse all layers into a single dataflow |
| 3–5 sources, moderate joins/logic | 2 ETLs — L1 cleanup → L2/L3 combined |
| 10+ sources, complex business logic, multiple dashboards | Full Bronze → Silver → Gold separation |

**Signals that you need more layers:**
- Multiple dashboards consuming the same joined/enriched data (split enrichment from viz-layer)
- Source data quality issues requiring isolated cleanup (dedicated L1)
- Different refresh cadences for different layers (daily source sync vs weekly aggregation)

**Signals that you should collapse:**
- Single source system, straightforward transforms
- One output dataset, one consumer
- User explicitly says "keep it simple"

---

## 4. Ask Before Assuming

**Always ask the user about layering preference and complexity before designing the pipeline architecture.** Don't default to 3-layer for simple use cases, and don't collapse everything for complex ones.

Questions to ask:
- "How many source systems are involved?"
- "Is there existing ETL infrastructure we should integrate with, or is this greenfield?"
- "Would you prefer a simple single-ETL approach, or a layered staging → enrichment → model pipeline?"
- "Are multiple dashboards going to consume this data, or just one?"

If the user says "just figure it out" or "use your best judgment", apply the right-sizing guidance above and note your decision explicitly in the spec/design.

---

## 5. Multiple Outputs per ETL

Use `PublishToVault` tiles at multiple branch points within a single ETL. A single dataflow can produce several output datasets — one per branch. This is the standard Domo pattern for ETLs that serve multiple downstream consumers.

**When to branch within one ETL:**
- Transforms share the same source data (input affinity)
- Branches diverge at some processing step (e.g., after a shared cleanup, one branch aggregates while another filters)

**When to use separate ETLs instead:**
- No shared inputs — unrelated source systems
- Different scheduling needs — one branch needs hourly, another weekly
- Independent failure domains — a failure in branch A shouldn't block branch B

**Canvas layout for branches:** Fork on the y-axis so each branch is visually distinct:

```
x=128        x=320              x=512
Input A ──→ Shared Cleanup ──→ Branch A: GroupBy → Output A (y=128)
(y=128)     (y=128)        └─→ Branch B: Filter  → Output B (y=320)

Input B ──→ Cast Types ───────→ Output C (y=512)
(y=512)     (y=512)
```

Include all outputs in the top-level `outputs[]` array of the dataflow JSON. See `etl-examples.md` Pattern 4 for a complete JSON example.

---

## Applying These Principles by Skill

| Skill | How to Apply |
|-------|-------------|
| **ETL Spec Designer** | Group needs by input affinity in Step 2. Assess layering in Step 3. Include layer assignment and multi-output notation in every spec. |
| **ETL Builder** | Follow layer assignments from specs. When no spec is provided, assess complexity in Step 1 and ask about layering. Build multi-output ETLs with branching `PublishToVault` tiles. |
| **ETL Input Adapter** | Adapter ETLs are inherently L1 (Bronze). Consolidate adapters that share the same source into one multi-output adapter. |
