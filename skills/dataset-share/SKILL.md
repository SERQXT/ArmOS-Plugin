---
name: dataset-share
description: Grants user or group access to a Domo dataset via the Domo Go CLI. Covers the dataset access share payload for both group and individual user grants. Reference spec for the dataset-share-grant platform primitive.
tier: t0
bucket: customer-delivery
status: draft
visibility: anyone
version: 1
created_by: alex.dengate@domo.com
created_at: 2026-06-07T00:00:00.000Z
primitive_of: dataset-share-grant
tools: []
---

# Dataset share

Reference specification for granting access to Domo datasets via the Domo Go CLI. This is the authoritative payload shape and field reference for `domo dataset access share` used in the customer onboarding cluster.

## Grant group access to a dataset

```bash
domo dataset access share <dataset_id> --group "Sales-EMEA"
```

## Grant access to multiple groups

Issue one command per group:

```bash
domo dataset access share abc-123-guid --group "Sales-EMEA"
domo dataset access share abc-123-guid --group "Sales-APAC"
```

## Grant individual user access

```bash
domo dataset access share abc-123-guid --email alice@acme.com
```

## Check current access grants

```bash
domo dataset access get <dataset_id>
```

Returns the current list of users and groups with access. Use before sharing to avoid duplicate grant attempts.

## Field reference

| Field | Flag | Required | Notes |
|---|---|---|---|
| Dataset ID | positional arg | yes | The GUID of the dataset to share. |
| Group name | `--group` | yes (or `--email`) | Name of the Domo group to receive access. Must exist on the instance. |
| User email | `--email` | yes (or `--group`) | Individual user to receive access. Must be a registered user. |

## Access levels

`domo dataset access share` grants the default access level (read/query). There is no flag to specify a higher or lower access level in the current CLI version — all shares grant the same access.

## Notes

- Granting access to a group is preferred over individual users at scale — group membership changes automatically propagate.
- If PDP is enabled on the dataset, sharing grants access to the dataset but each user still sees only the rows permitted by their PDP policy.
- If the group or user already has access, the command is a no-op (does not produce an error).
- All CLI calls resolve via `${ARMOS_DOMO_CLI_PATH}` — the Go CLI, not Ryuu.
