---
name: user-provision
description: "Creates a Domo user with the specified role and optionally enables direct sign-on. Covers the complete user creation payload: email, display name, role, and DSO configuration. Reference spec for the domo-user platform primitive."
tier: t0
bucket: customer-delivery
status: draft
visibility: anyone
version: 1
created_by: alex.dengate@domo.com
created_at: 2026-06-07T00:00:00.000Z
primitive_of: domo-user
tools: []
---

# User provision

Reference specification for creating Domo users and enabling direct sign-on (DSO) via the Domo Go CLI. This is the authoritative payload shape and field reference for the `domo user create` and `domo user direct-sign-on add` commands used in the customer onboarding cluster.

## Create user — payload

```bash
domo user create \
  --email alice@acme.com \
  --name "Alice Smith" \
  --role Privileged
```

Minimal required fields: `--email`, `--name`, `--role`.

To also enable direct sign-on at creation time (two-step):

```bash
# Step 1 — create the user
domo user create --email alice@acme.com --name "Alice Smith" --role Privileged

# Step 2 — enable DSO for the new user
domo user direct-sign-on add alice@acme.com
```

## Field reference

| Field | Flag | Required | Values | Notes |
|---|---|---|---|---|
| Email address | `--email` | yes | valid email | Used as the login identifier. Must be unique on the instance. |
| Display name | `--name` | yes | freeform string | Shown in the Domo UI. Quote multi-word names. |
| Role | `--role` | yes | `Admin`, `Privileged`, `Editor`, `Participant`, `Social` | Case-sensitive. `Privileged` = full analyst access. |
| Direct sign-on | separate command | no | — | `domo user direct-sign-on add <email>` after user exists. |

## Accepted role values

- `Admin` — full platform administration rights
- `Privileged` — create and manage content (cards, datasets, pages)
- `Editor` — edit existing content but not create
- `Participant` — view-only access
- `Social` — discussion and collaboration only, no data access

## Notes

- If a user with the given email already exists, `domo user create` will return an error. The calling skill (`customer-onboard`) skips pre-existing users and notes them in the summary report.
- DSO enables password-bypass for SSO-configured instances. Only call `domo user direct-sign-on add` when the customer's instance is SSO-enabled.
- All CLI calls resolve via `${ARMOS_DOMO_CLI_PATH}` — the Go CLI, not Ryuu.
