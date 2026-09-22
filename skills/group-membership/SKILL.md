---
name: group-membership
description: Creates Domo groups and manages their member lists via the Domo Go CLI. Covers group creation, member addition, and member removal. Reference spec for the domo-group platform primitive.
tier: t0
bucket: customer-delivery
status: draft
visibility: anyone
version: 1
created_by: alex.dengate@domo.com
created_at: 2026-06-07T00:00:00.000Z
primitive_of: domo-group
tools: []
---

# Group membership

Reference specification for creating Domo groups and managing group members via the Domo Go CLI. This is the authoritative payload shape and field reference for `domo group create`, `domo group member add`, and `domo group member remove` commands used in the customer onboarding cluster.

## Create a group

```bash
domo group create --name "Sales-EMEA"
```

Optional: add a description at creation time:

```bash
domo group create --name "Sales-EMEA" --description "EMEA regional sales team"
```

## Add a member to a group

```bash
domo group member add "Sales-EMEA" alice@acme.com
```

The first argument is the group name (or group ID). The second is the user's email address. The user must already exist on the instance.

## Remove a member from a group

```bash
domo group member remove "Sales-EMEA" alice@acme.com
```

## Search for an existing group

```bash
domo group search "Sales"
```

Returns all groups whose name contains the search string. Used by `customer-onboard` and `pdp-rule-author` to resolve group references before creating PDP policies.

## Field reference

| Field | Applies to | Required | Notes |
|---|---|---|---|
| Group name | `group create`, `member add`, `member remove` | yes | Quote multi-word names. Used as the identifier in member commands unless you use the numeric group ID. |
| Description | `group create` | no | Freeform string. Shown in group management UI. |
| User email | `member add`, `member remove` | yes | Must match an existing user on the instance. |
| Group ID | `member add`, `member remove` | alternative to name | Numeric ID returned by `domo group create` or `domo group search`. More stable than name if names change. |

## Bulk member adds

To add multiple members to a group, issue one `domo group member add` call per user:

```bash
domo group member add "Sales-EMEA" alice@acme.com
domo group member add "Sales-EMEA" bob@acme.com
domo group member add "Sales-EMEA" carol@acme.com
```

No bulk-add flag exists in the current CLI. The `customer-onboard` T2 loops over the members list.

## Notes

- If a group with the given name already exists, `domo group create` will return an error. The calling skill should check via `domo group search` first or handle the error by using the existing group's ID.
- Group names are case-sensitive on some instances. Use the exact name from the manifest.
- All CLI calls resolve via `${ARMOS_DOMO_CLI_PATH}` — the Go CLI, not Ryuu.
