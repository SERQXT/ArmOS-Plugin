---
name: pdp-policy
description: Creates, updates, and enables Personalized Data Permission (PDP) policies on Domo datasets via the Domo Go CLI. Covers policy creation with column filters, policy updates, and dataset-level PDP enablement. Reference spec for the domo-pdp-rule platform primitive.
tier: t0
bucket: customer-delivery
status: draft
visibility: anyone
version: 1
created_by: alex.dengate@domo.com
created_at: 2026-06-07T00:00:00.000Z
primitive_of: domo-pdp-rule
tools: []
---

# PDP policy

Reference specification for creating and managing Personalized Data Permission (PDP) policies on Domo datasets via the Domo Go CLI. This is the authoritative payload shape and field reference for `domo dataset pdp create`, `domo dataset pdp update`, and `domo dataset pdp enable` commands used in the customer onboarding cluster.

## Check dataset schema before authoring a policy

Always verify the column exists before creating a policy. A policy referencing a non-existent column will create silently but will never restrict data.

```bash
domo dataset schema get <dataset_id>
```

Returns the column list. Confirm the `column` you intend to filter on appears in the output.

## Create a PDP policy

```bash
domo dataset pdp create \
  --dataset-id abc-123-guid \
  --name "emea-only" \
  --column region \
  --operator IN \
  --values "EMEA,UK" \
  --groups "Sales-EMEA"
```

The `--values` flag accepts a comma-separated list. The `--groups` flag accepts a comma-separated list of group names or IDs.

## Create a policy with multiple filter values

```bash
domo dataset pdp create \
  --dataset-id abc-123-guid \
  --name "apac-filter" \
  --column region \
  --operator IN \
  --values "APAC,ANZ,IN" \
  --groups "Sales-APAC"
```

## Update an existing policy

```bash
domo dataset pdp update \
  --dataset-id abc-123-guid \
  --policy-id <policy_id> \
  --values "EMEA,UK,DE"
```

Use `domo dataset pdp list --dataset-id <id>` to find the `policy_id` of an existing policy.

## Enable PDP on a dataset

PDP must be enabled at the dataset level before individual policies take effect:

```bash
domo dataset pdp enable <dataset_id>
```

This is a one-time operation per dataset. Calling it on a dataset where PDP is already enabled is a no-op.

## Field reference

| Field | Flag | Required | Accepted values | Notes |
|---|---|---|---|---|
| Dataset ID | `--dataset-id` | yes | GUID string | The target dataset. |
| Policy name | `--name` | yes | freeform string | Unique within the dataset's policies. |
| Filter column | `--column` | yes | column name from schema | Must exist in the dataset schema. Case-sensitive. |
| Operator | `--operator` | yes | `IN`, `NOT_IN`, `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `LESS_THAN` | `IN` is the most common for list-based regional filters. |
| Filter values | `--values` | yes | comma-separated list | Values must match actual data values in the column. |
| Target groups | `--groups` | yes (or `--users`) | comma-separated group names or IDs | Groups whose members see only the filtered rows. |
| Target users | `--users` | yes (or `--groups`) | comma-separated emails | Individual users; use `--groups` for bulk assignments. |

## Operator reference

- `IN` — rows where column value is in the provided list (most common)
- `NOT_IN` — rows where column value is NOT in the list
- `EQUALS` — rows where column value equals a single value
- `NOT_EQUALS` — rows where column value does not equal a single value
- `GREATER_THAN` — numeric / date comparison (greater than)
- `LESS_THAN` — numeric / date comparison (less than)

## Notes

- PDP policies are row-level filters — they do not restrict column access.
- A user who belongs to multiple groups will see the union of all their group policies.
- The `All rows` policy always exists and applies to users/groups not covered by a specific policy.
- Always call `domo dataset pdp enable <dataset_id>` after creating policies, or the policies will exist but not be enforced.
- All CLI calls resolve via `${ARMOS_DOMO_CLI_PATH}` — the Go CLI, not Ryuu.
