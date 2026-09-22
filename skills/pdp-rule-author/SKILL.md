---
name: pdp-rule-author
description: Orchestrates schema fetch, group resolution, and PDP policy creation for a single dataset. Decides which columns to filter, validates they exist in the schema, and wires the policy to the correct groups. The judgement layer between a natural-language PDP request and the pdp-policy instrument.
tier: t1
bucket: customer-delivery
status: draft
visibility: anyone
version: 1
created_by: alex.dengate@domo.com
created_at: 2026-06-07T00:00:00.000Z
tools: []
---

# PDP rule author

Orchestrates the schema-fetch → group-resolve → policy-create chain for a single Domo dataset. This skill encodes the consultant's judgement about *which* column to filter, *which* groups to attach, and *whether* the schema supports the requested policy — so that downstream skills and the `customer-onboard` T2 can invoke a self-validating, single-dataset PDP workflow without re-implementing those decisions.

## When to use

- "Add a PDP rule to this dataset that limits the Sales-EMEA group to EMEA rows"
- "Lock down dataset abc-123 so each region group only sees its own data"
- "Wire up row-level security on this dataset before we share it with the new client"
- "Create a PDP policy on the revenue dataset for the APAC team"

## When NOT to use

- When you need to create *multiple* PDP policies across *multiple* datasets as part of a complete customer onboarding — use `customer-onboard` instead, which composes this skill for each dataset.
- When you only need to read or list existing PDP policies — call `domo dataset pdp list` directly without loading this skill.
- When the task is about dataset access sharing without row-level filtering — use `dataset-share` directly.
- When the column is unknown and the user hasn't specified what to filter on — pause and ask before invoking this skill.

## Workflow

1. Fetch the dataset schema with `domo dataset schema get <dataset_id>` and present the column list.
2. Confirm the requested filter column exists in the schema. If not, surface the mismatch and ask the operator to choose a valid column.
3. Resolve each target group: check if the group name is known from the calling context (e.g. the `customer-onboard` manifest) or find it via `domo group search <name>`.
4. Invoke `pdp-policy` to create the policy with the validated column, operator, values, and groups.
5. Enable PDP on the dataset if not already enabled (`domo dataset pdp enable <dataset_id>`).
6. Return the created policy ID and confirmation that PDP is active.

## Design principles

- **Schema-first.** Never author a PDP policy without first confirming the column exists. A policy on a non-existent column creates silently but never enforces — this is a dangerous failure mode.
- **Group resolution before policy creation.** Always resolve group names to confirmed entities (either from manifest context or via `domo group search`) before passing them to `pdp-policy`. An unresolved group means the policy has no effect.
- **Minimal surface.** This skill handles one dataset at a time. For multi-dataset onboarding, the caller (`customer-onboard`) loops over datasets and invokes this skill once per dataset.
- **PDP enable is always step-N.** Enable PDP at the dataset level *after* all policies are created, not before. Enabling before creation leaves a window where no policies exist and the dataset is fully open.

## Output validation

After invoking `pdp-policy`, verify:
- `domo dataset pdp list --dataset-id <id>` returns the newly created policy name.
- `domo dataset pdp list --dataset-id <id>` shows PDP status as enabled.

If either check fails, surface the failure and do not report success to the caller.

## When to use this skill

- Invoked by `customer-onboard` for each `dataset_access[]` entry that has a `pdp:` block.
- Invoked directly when an operator wants to add a PDP rule to an existing dataset mid-engagement.
