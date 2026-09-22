---
name: armos-instance-manager
tier: 0
bucket: armos-self
description: "Manage ArmOS's active Domo instance and track platform work in Jira. Trigger with 'switch to a different instance', 'change my Domo instance', 're-authenticate', 'list Domo instances', 'create a Jira ticket', 'search Jira', 'update a ticket', 'log a bug', or any request to change the active instance or manage ArmOS internal work items."
maturity: alpha
---

# ArmOS Instance Manager — Runtime Control and Work Tracking

Control which Domo instance ArmOS is operating against and manage internal platform work via Jira. Use this skill for session-level runtime changes (instance switching) or ArmOS-internal bug/feature tracking.

## Scope

- **ArmOS Control**: switch the active Domo instance, re-authenticate
- **Jira**: search, create, update, and transition issues in the DOMX project

This skill is for **ArmOS platform operations only** — not for customer-facing delivery work.

## MCP Tools

### ArmOS Control (`armos-control`)

| Tool | Purpose |
|------|---------|
| `switch_instance` | Switch the active Domo instance for the current session |
| `authenticate_instance` | Re-authenticate to the current or a specified instance |

### Jira (`jira`)

| Tool | Purpose |
|------|---------|
| `search_issues` | Search issues using JQL |
| `get_issue` | Get full details of a specific issue |
| `create_issue` | Create a new issue |
| `update_issue` | Update fields on an existing issue |
| `add_comment` | Add a comment to an issue |
| `transition_issue` | Change issue status |
| `link_issues` | Link two issues |
| `list_transitions` | List available status transitions for an issue |
| `bulk_create_issues` | Create multiple issues at once |

## Workflow: Switch Active Instance

1. **List configured instances** — use the `domo-cli` toolkit's `domo_instances` tool to enumerate available instances
2. **Confirm with user** — state the current instance and the target instance; confirm before switching
3. **Switch** — call `switch_instance` with the target instance identifier
4. **Verify** — confirm the switch succeeded; remind the user that all subsequent tool calls now target the new instance

> ⚠️ **High blast radius** — switching instances affects every tool call in the session. Always confirm before switching and re-confirm after to ensure the user is aware.

## Workflow: Log a ArmOS Bug in Jira

1. **Search for duplicates** — call `search_issues` with JQL to check if the bug already exists
2. **Create** — call `create_issue` with `issueType: Bug`, summary, and description
3. **Link** if it duplicates an existing issue — call `link_issues`
4. **Report** — surface the new issue key (e.g. `DOMX-NNN`) and URL to the user

## Guardrails

- **Jira is for ArmOS internal work only** — never use Jira for customer-facing delivery tasks; use Asana or the customer's own tracker for those
- **Default project is DOMX** — do not create issues in other projects without explicit user instruction
- Never transition an issue past "In Progress" without explicit user ask
- `switch_instance` is irreversible within the session — confirm twice if the user seems uncertain

## Related Skills

- `domo-cli` toolkit — list and attach Domo CLI instances
- `self-improve` toolkit — ArmOS enhancement queue
