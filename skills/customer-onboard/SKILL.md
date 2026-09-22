---
name: customer-onboard
description: Provisions users, groups, PDP policies, and dataset access shares for a new customer engagement from a single YAML manifest. Validates PDP column references against live schema before any mutation. Emits a rollback log on failure.
tier: t2
bucket: customer-delivery
status: draft
visibility: anyone
version: 1
created_by: alex.dengate@domo.com
created_at: 2026-06-07T00:00:00.000Z
input_contract: "Requires a YAML manifest with `users:`, `groups:`, and `dataset_access:` sections. Refuses when PDP columns do not exist in schema, group references cannot be resolved, user count exceeds 50 without `--confirm-bulk`, destructive operations present without `--allow-destructive`, or dry-run mutation plan does not match execution set."
tools: []
---

# Customer onboard

Executes a complete customer onboarding workflow from a structured YAML manifest: creates users, assembles groups, applies PDP policies to datasets, and grants dataset access. Designed to be deterministic and auditable — every mutation is planned, validated, and logged before it executes.

## Steps

1. **Parse and validate the manifest.** Load the YAML input (pasted inline or referenced by path). Verify the top-level keys `users:`, `groups:`, and `dataset_access:` are present and well-formed. Refuse if any required key is missing.

2. **Pre-flight schema check.** For each `dataset_access[].pdp[]` entry, run `domo dataset schema get <dataset_id>` and verify the declared `column` field exists in the returned schema. If any column reference is not found, refuse the entire run and list the unresolved references.

3. **Resolve group references.** For every group name in `dataset_access[].pdp[].groups` and `dataset_access[].groups`, confirm the group is either (a) declared in the manifest `groups:` list, or (b) findable via `domo group search <name>`. Refuse if any group reference is unresolvable.

4. **Bulk threshold check.** Count the entries in `users:`. If the count exceeds 50 and the manifest does not contain `confirm_bulk: true`, refuse with an explicit message: "User count N exceeds the 50-user bulk threshold. Add `confirm_bulk: true` to the manifest to proceed."

5. **Destructive-operation gate.** Scan the manifest for any `delete: true` entries on existing users or groups. If found and the manifest does not contain `allow_destructive: true`, refuse with an explicit message identifying the affected records.

6. **Build the dry-run mutation plan.** Enumerate every mutation in execution order: user creates, DSO enables, group creates, member adds, PDP creates, PDP enables, access shares. Output the plan as a numbered list. Do not execute yet.

7. **Confirm plan matches execution set.** Present the plan to the operator. Proceed only when confirmed. If the plan is modified after confirmation but before execution, refuse the run — the execution set must exactly match the confirmed plan.

8. **Execute mutations in dependency order.**
   - Invoke `user-provision` for each user in `users:`.
   - Invoke `group-membership` for each group in `groups:`.
   - Invoke `pdp-rule-author` for each `dataset_access[]` entry with a `pdp:` block.
   - Invoke `dataset-share` for each `dataset_access[]` entry with `groups:`.

9. **Emit rollback log.** After execution, write a rollback record listing every created resource (user IDs, group IDs, PDP policy IDs) with the reverse operation needed. If any step failed mid-run, execute rollback in reverse order before surfacing the error.

10. **Report success.** Summarise: N users created, N groups created, N PDP policies applied, N dataset access shares granted. Include any warnings (e.g. users who already existed and were skipped).

## Guardrails

- **Refuse** when any PDP `column` is not found in the output of `domo dataset schema get` for the specified `dataset_id`. Do not proceed with a policy that references a non-existent column — the policy will silently fail at enforcement time.
- **Refuse** when a group name in `pdp.groups` or `dataset_access.groups` cannot be resolved in the manifest's `groups:` list and `domo group search` returns no match. An unresolvable group reference means the policy will have no effect.
- **Refuse** when user count exceeds 50 and `confirm_bulk: true` is absent from the manifest. Bulk provisioning bypasses normal per-user review; the flag is an explicit acknowledgement.
- **Refuse** any `delete: true` operation on an existing user or group when `allow_destructive: true` is absent. Destructive operations are irreversible and require explicit opt-in.
- **Refuse** to continue execution if any mutation diverges from the confirmed dry-run plan. Trigger rollback immediately if divergence is detected mid-run.

## Success criteria

- [ ] All users in `users:` exist in the target Domo instance with the specified roles and DSO status.
- [ ] All groups in `groups:` exist with the correct membership sets.
- [ ] All PDP policies listed in `dataset_access[].pdp[]` are created, enabled, and reference columns that exist in the dataset schema.
- [ ] All dataset access shares in `dataset_access[]` are applied with the correct groups.
- [ ] A rollback log is written identifying every created resource by its Domo-assigned ID.

## Dependencies

### Sub-skills invoked

- `user-provision` (T0) — creates users and enables DSO
- `group-membership` (T0) — creates groups and manages member lists
- `pdp-policy` (T0) — creates, updates, and enables PDP policies on datasets
- `dataset-share` (T0) — grants group access to a dataset
- `pdp-rule-author` (T1) — orchestrates schema fetch + policy creation for one dataset

### CLI commands used

- `domo dataset schema get <dataset_id>` — pre-flight schema validation
- `domo group search <name>` — group reference resolution
- All mutations delegated to sub-skills above

## Inputs

A YAML manifest pasted inline. Required shape:

```yaml
users:
  - email: alice@acme.com
    displayName: Alice
    role: Privileged
  - email: bob@acme.com
    displayName: Bob
    role: Participant

groups:
  - name: Sales-EMEA
    members: [alice@acme.com]

dataset_access:
  - dataset_id: abc-123-guid
    groups: [Sales-EMEA]
    pdp:
      - name: emea-only
        column: region
        operator: IN
        values: [EMEA, UK]
        groups: [Sales-EMEA]

# Optional flags
confirm_bulk: false       # set true when users > 50
allow_destructive: false  # set true to permit delete: true operations
```

## Outputs

- Summary report: counts of users, groups, PDP policies, and access shares created.
- Rollback log: list of created resource IDs with the reverse operation for each.
- Any skipped resources (e.g. user already existed — email noted).

## When to use

- "Onboard ACME customers from this manifest"
- "Run the full customer provisioning for this engagement"
- "Set up users, groups, and PDP for a new instance"

The deliverable is a fully provisioned Domo instance: users created, groups assembled, PDP rules enforced, dataset access granted — all in one atomic pipeline.

## When NOT to use

- When onboarding a single user only — invoke `user-provision` directly.
- When adjusting an existing PDP policy on an already-provisioned dataset — use `pdp-rule-author` directly.
- When working with ETL, dataflows, cards, or dashboards — those are in the `domo-building` bucket.
- When the task is exploratory ("show me what PDP policies exist") — use `pdp-policy` read operations directly.

## Failure modes and recovery

- **Schema fetch fails (network/auth):** Surface the error before any mutation. No rollback needed.
- **Group search returns ambiguous results:** List all matches and ask operator to confirm the correct group ID before proceeding.
- **User create fails mid-batch:** Rollback all users created in this run using the rollback log, then surface the failure with the first failing email address.
- **PDP creation fails after group/user creation:** Execute full rollback in reverse order (delete PDP policies, remove group members, delete groups, delete users) and surface the error.
