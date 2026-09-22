# Stage O — Pattern storage (cross-account)

**Maps to pipeline stage:** O — **separate from N** and **separate from engagement-specific memory**

## Inputs

- Delivery doc (N), UX reports, specs, and anything **reusable** across accounts.
- `objective/NORTHSTAR.md` — use outcome language when tagging patterns (what problem class this pattern serves).

## Outputs

- **Pattern entries** suitable for org memory (format per your memory system):  
  - Title, **when to reuse**, **anti-patterns**, **minimal code/snippet pointers** (not full apps).  
  - **Scope:** cross-engagement learnings — **not** the same as customer-specific delivery doc (N) or the **account/engagement timeline** written at **N** (`memory_remember` in **`engagement-memory-and-assets.md`**).

## Instructions

1. **Abstract** from the specific customer name where possible; keep one concrete **example** if it helps.  
2. Tag by domain (e.g. retail, funnel analytics) and by technical pattern (dataset-only, collections, packages).  
3. Do **not** store secrets, tokens, or PII.  
4. Optional: **`asset_register`** for catalog so **`asset_compose`** finds the deliverable on the next engagement — see **`modules/engagement-memory-and-assets.md`**.

## Checkpoint

```
@500apps-pipeline checkpoint=stage-o status=complete
```
