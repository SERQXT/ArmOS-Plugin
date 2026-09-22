---
name: document-collaboration
tier: 1
bucket: document-authoring
description: "Manage Domo Projects, Buzz channels, and Microsoft 365 collaboration — tasks, messages, mail, calendar, and files. Trigger with 'create a project', 'add a task', 'send a buzz message', 'post to channel', 'list projects', 'send an email', 'check my calendar', 'create a Teams message', 'find a file in OneDrive', or any request involving Domo or M365 collaboration tools."
maturity: alpha
---

# Document Collaboration — Projects, Messaging, and M365

Coordinate work across Domo Projects & Tasks, Domo Buzz, and Microsoft 365 (Outlook, Teams, OneDrive). Use this skill when the task involves creating or tracking project work, sending messages, or working with the consultant's M365 workspace.

## Scope

- **Domo Projects**: create and manage project boards and tasks
- **Domo Buzz**: list channels, read messages, send messages
- **Microsoft 365**: Outlook mail and calendar, Teams, OneDrive files

## MCP Tools

### Domo Projects (`domo-projects`)

| Tool | Purpose |
|------|---------|
| `project_list` | List all projects in the instance |
| `project_get` | Get a specific project and its tasks |
| `project_create` | Create a new project board |
| `project_update` | Update project metadata or status |
| `project_delete` | Delete a project |
| `health_check` | Verify the projects service |

### Domo Buzz (`domo-buzz`)

| Tool | Purpose |
|------|---------|
| `channel_list` | List Buzz channels visible to the session |
| `channel_get` | Get channel details |
| `channel_messages` | Read recent messages from a channel |
| `message_send` | Post a message to a Buzz channel |
| `health_check` | Verify the Buzz service |

### Microsoft 365 (`ms-365`)

MS 365 tools are provided via Microsoft Graph. Available capabilities include Outlook mail/calendar, Teams, OneDrive, and Contacts. Use the wildcarded `ms-365` toolkit — available tools depend on the Graph scopes granted to the authenticated user.

## Workflow: Create a Project and Add Tasks

1. **Check existing** — call `project_list` to verify the project doesn't already exist
2. **Create** — call `project_create` with name and description
3. **Add tasks** — call `project_update` to add task items (if the API supports inline task creation); otherwise surface the project URL for the user to add tasks manually
4. **Confirm** — report the created project ID and name

## Workflow: Post a Buzz Update

1. **Find channel** — call `channel_list` to locate the target channel by name
2. **Read context** — optionally call `channel_messages` to see recent thread before posting
3. **Confirm with user** — always confirm the channel and message content before sending
4. **Send** — call `message_send` with the channel ID and message text
5. **Confirm** — report success and the message timestamp

## Guardrails

- **Always confirm before `message_send`** — Buzz messages are sent as the authenticated user's identity and are immediately visible to channel members
- **Always confirm before sending M365 mail or posting to Teams** — these are external communications
- **Never delete a project** without explicit user confirmation — `project_delete` is permanent
- When reading Buzz messages, respect privacy — don't surface message content outside the session without user intent

## Related Skills

- `office/docx`, `office/xlsx`, `office/pptx` — document generation skills
- `asana` toolkit — Asana task management
- `jira` toolkit — Jira issue tracking
