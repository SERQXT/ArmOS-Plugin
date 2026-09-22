---
name: connector-account-manager
tier: 1
bucket: connector-work
description: "Audit and manage Domo connector accounts and data source providers. Trigger with 'list connector accounts', 'show my data connections', 'what connectors are available', 'audit data source credentials', 'list providers', or any request to inspect or manage how data flows into a Domo instance from external sources."
maturity: alpha
---

# Connector Account Manager — Data Source Connections

Audit connector accounts and available data providers in a Domo instance. Use this skill when the task involves understanding how external data sources are connected, which credentials exist, or what connectors are available for a customer instance.

## Scope

- **Accounts**: enumerate configured connector credential accounts
- **Providers**: discover available connector types for the instance

Use the `domo-connectors` toolkit.

> **Note**: This toolkit is currently read-only — `account_list` and `provider_list` are discovery tools. Account create/update requires the Go CLI (`domo account create/update`). If the user needs to create or update a connector account, guide them to use the CLI.

## MCP Tools

### Connectors (`domo-connectors`)

| Tool | Purpose |
|------|---------|
| `account_list` | List all connector accounts configured in the instance |
| `provider_list` | List all available connector providers (data source types) |
| `health_check` | Verify the connectors service is reachable |

## Workflow: Audit Connector Accounts

1. **List accounts** — call `account_list` to enumerate all configured credential accounts
2. **Surface summary** — report account names, connector types, and owner/status where available
3. **Flag gaps** — identify data sources the customer has mentioned but that have no configured account
4. **Recommend next steps** — if accounts need to be created or updated, provide the CLI commands: `domo account create` / `domo account update`

## Workflow: Discover Available Connectors

1. Call `provider_list` to get all connector providers available to the instance
2. Filter by keyword if the user is looking for a specific source type (e.g. "Salesforce", "Google Sheets")
3. Surface connector names, IDs, and any authentication requirements

## Guardrails

- This toolkit cannot create or modify connector accounts via MCP — be upfront about this limitation
- Never attempt to expose or log account credentials — `account_list` returns metadata only
- If the user needs a connector account created, surface the CLI command rather than attempting via API directly

## CLI Reference (for account management beyond read-only)

```bash
# List accounts (same as MCP)
domo account list

# Create a new account
domo account create

# Update an existing account
domo account update <accountId>
```

## Related Skills

- `domo-datasets` toolkit — manage datasets that use connector accounts as sources
- `domo-dataflows` toolkit — ETL pipelines that consume connector data
