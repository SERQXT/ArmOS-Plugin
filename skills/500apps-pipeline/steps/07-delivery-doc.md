# Stage N — Delivery documentation

**Maps to pipeline stage:** N

## Inputs

- Final or agreed customer-facing build state (post M where applicable).
- `objective/NORTHSTAR.md` — delivery describes outcomes served.
- `spec/BUILD-SPEC.md`, `artifacts/UX-*-REPORT.md`, `delivery/` predecessors if any.
- **`modules/engagement-context-app-template.md`** — **same** template as discovery; **delivery mode** adds user guide.

## Outputs

**This stage produces customer-facing deliverables. No internal pipeline language, no 5-to-9 tables, no planned-vs-actual framing, no build-target terminology. The customer sees: what was asked for, what was built, how it delivers, and how to use it.**

### Canonical artifact paths (use these EXACT names — the ArmOS UI checks for them)

| # | Path | Description |
|---|------|-------------|
| 1 | **`delivery/DELIVERY-SUMMARY.md`** | Executive summary (features, access, outcomes, support) |
| 2 | **`delivery/USER-GUIDE.md`** | Per-surface walkthrough with screenshots |
| 3 | **`delivery/CONTEXT-APP-DELIVERY.md`** | Engagement context app delivery copy |
| 4 | **`delivery/MEMORY-SIGNOFF.md`** | Engagement summary written as sign-off artifact |

All four files must be written under `delivery/` using the exact names above. The UI probes for these paths to show completion status — if you use different names, the artifacts will exist on S3 but the UI will show them as missing.

### Output details

1. **`delivery/DELIVERY-SUMMARY.md`** — Executive summary the customer can forward to their leadership. See `modules/prd-quality-patterns.md` §8 for structural guidance. Generated from `spec/BRAND-KIT.md` + `artifacts/deploy-result.json` + screenshots. Includes: hero metric with business context ("this replaces the manual process that took X hours"), 3 key screenshots with captions explaining what each surface does, champion quote, and success criteria framed as outcomes ("your team can now do X in Y minutes"). Optionally also produce `delivery/summary.html` as a branded print-ready version alongside this markdown file.

2. **`delivery/USER-GUIDE.md`** — Per-surface walkthrough written for someone who has never seen the app. What each surface is for, how to navigate it, what data it shows, key actions available, tips for getting the most out of it. Embed screenshots, flows, roles. **Also** update the **engagement context app** (template) **delivery tab/section** per **`modules/engagement-context-app-template.md`** — the context app is the primary in-app home for the guide, but the standalone file must also exist for offline/PDF use.

3. **`delivery/CONTEXT-APP-DELIVERY.md`** — Delivery-phase copy for the engagement context app: **what changed**, **key features**, **problem solved**, **value add**, **data sources**. Audience may **expand** or **rotate** beyond discovery attendees; assume **no prior Domo or project knowledge**. **Also** update `spec/ENGAGEMENT-CONTEXT-COPY.md` with a `## Delivery` section (the context app template reads from that file too).

4. **`delivery/MEMORY-SIGNOFF.md`** — Written engagement summary: what shipped, URLs, dataset IDs, outcomes, explicit out-of-scope items, approved Phase 2 hooks, and engagement wrap-up. This is the human-readable sign-off artifact. **Additionally**, call **`memory_remember`** to persist the canonical engagement summary and account-level rollup for future upsell — per **`modules/engagement-memory-and-assets.md`**. The `memory_remember` call and the markdown file serve different purposes: the file is for humans, the memory call is for the AI platform. Do **not** treat this as a substitute for stage **O** (patterns).

## Instructions

1. Write for **operators, new consultants, and expanded client stakeholders** — not only the original discovery attendees.  
2. **Same templated look** as discovery / release — **different content** per **`engagement-context-app-template.md`**.  
3. Avoid duplicating pattern libraries — **reference** stage O where appropriate.  
4. Version and date all artifacts.  
5. Only run the **memory_remember** call in output **4** (`MEMORY-SIGNOFF.md`) when **delivery is accepted** (or your PM-defined sign-off trigger); incremental updates across the engagement stay in **`engagement-memory-and-assets.md`**.

## Checkpoint

```
@500apps-pipeline checkpoint=stage-n status=complete
```
