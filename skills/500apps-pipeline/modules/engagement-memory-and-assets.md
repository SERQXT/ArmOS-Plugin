# Engagement memory, graph, and asset catalog

Use alongside the **500apps-pipeline** steps so each run **reads what we already know** about the account and similar work, **searches reusable assets**, and **writes back** when the engagement is confirmed — with **incremental updates** after survey, discovery, and follow-ups for future upsell.

> **Tool names** below match Compass/ArmOS patterns (`memory_recall`, `memory_remember`, `memory_bundle`, `asset_compose`, …). If your MCP exposes different names, map to the same **intent**.

---

## Before planning and build (stages B–F)

### 1. Memory — account & engagement context

- **`memory_recall`** — scope **`{account_id}`** (or account name key), intent **`"prep"`** — load **account** facts, stakeholders, prior notes.  
- **`memory_recall`** — intent **`"prep"`** scoped to **this engagement** (pipeline id / 500apps folder) — **engagement-working**: what we’re building, status.  
- **`memory_recall`** — intent **`"patterns"`** — **patterns-library**: cross-account plays, industry moves.  
- **`memory_bundle`** — when you need **account + engagement + patterns** in one call (optional convenience).

Use outputs to **inform** `NORTHSTAR.md`, **surface plan**, **mocks**, and **risk** sections — **do not** contradict stored facts without flagging.

### 2. Graph / semantic memory (if available)

- Run **deep recall** for **industry**, **use case** (e.g. triage, email routing), and **similar engagements** — same tools with queries or intents your **memory-service** documents (e.g. “find prior 500apps email triage”).  
- Goal: surface **connections** (“we did X at similar FSI”) for **D/F** and **expansion** rows.

### 3. Asset catalog — reuse before greenfield

- **`asset_compose`** (or equivalent on **compass-asset-catalog**) — search for **composable** assets: ProCode shells, ETL patterns, datasets, **prior 500apps deliverables**.  
- **`asset_get`** — pull detail when a candidate asset matches this **BUILD-SPEC**.

Cite catalog hits in **`BUILD-SPEC.md`** or **`MVP-V1-NOTES.md`** when you **reuse** vs build new.

---

## During the engagement (incremental memory)

| Event | Write |
|-------|--------|
| **Survey ingested** | **`memory_remember`** — brief: survey themes, intake id, link to `survey/`. |
| **Post–discovery call** | **`memory_remember`** — Gong/transcript summary, decisions, **hero metric** if named, **Phase 2** signals. |
| **Follow-up meetings** | Append or update **engagement-working** — same tool, scoped to engagement. |

This builds a **timeline** for “what we talked about last time” on **upsell** or **next MVP**.

---

## After client confirms / approves (delivery sign-off)

When **delivery is accepted** (or SOW sign-off closes the MVP phase — define trigger with your PM):

1. **`memory_remember`** — **canonical engagement summary**: what shipped (both apps), **live URLs**, **dataset ids**, **outcomes**, **explicit out-of-scope**, **approved** Phase 2 direction.  
2. **`memory_remember`** at **account** scope — rollup: relationship, value narrative, **upsell hooks**.  
3. **Stage O** — `08-pattern-storage.md` — **patterns** for cross-account reuse (separate from raw engagement memory).

Optional: register **delivered assets** via **`asset_register`** so **asset_compose** finds them next time.

---

## Anti-patterns

- Skipping **memory_recall** at **B/C** — you rebuild context from scratch every time.  
- Writing **full** memory only at the end — **incremental** writes preserve discovery detail.  
- Contradicting **memory** without noting **override** — creates trust issues later.

---

## Relationship to pipeline artifacts

| Artifact | Memory role |
|----------|-------------|
| `objective/NORTHSTAR.md` | Aligns with account + pattern recall. |
| `spec/BUILD-SPEC.md` | May cite **asset_compose** results. |
| `DISCOVERY-HANDOFF.md` | Feeds **post-discovery** `memory_remember`. |
| `delivery/` | Triggers **final** `memory_remember` + optional **asset_register**. |
