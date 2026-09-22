---
name: jupyter-workspace-manager
tier: 1
bucket: jupyter-work
description: "Create and manage Domo Jupyter workspaces for Python and R analysis. Trigger with 'create a Jupyter workspace', 'start a notebook', 'run Python against my dataset', 'execute notebook code', 'list Jupyter workspaces', 'stop a workspace', or any request involving Domo Jupyter for data science work."
maturity: alpha
---

# Jupyter Workspace Manager — Data Science in Domo

Create, configure, and operate Domo Jupyter workspaces for Python and R analysis. Use this skill when a task requires executing code against instance data, scheduling notebook runs, or managing the Jupyter environment.

## Scope

- Create, start, stop, and delete Jupyter workspaces
- Execute code against datasets in a live workspace
- Manage workspace lifecycle (kernel state, session restart)

Use the `domo-jupyter` toolkit.

## MCP Tools

### Domo Jupyter (`domo-jupyter`)

| Tool | Purpose |
|------|---------|
| `jupyter_workspace_list` | List all Jupyter workspaces in the instance |
| `jupyter_workspace_get` | Get workspace details and current status |
| `jupyter_workspace_create` | Create a new workspace |
| `jupyter_workspace_update` | Update workspace configuration |
| `jupyter_workspace_start` | Start (wake) a stopped workspace |
| `jupyter_workspace_stop` | Stop a running workspace to save compute |
| `jupyter_workspace_delete` | Delete a workspace permanently |
| `jupyter_code_execute` | Execute Python or R code in a running workspace |

## Workflow: Create and Use a Workspace

1. **List existing** — call `jupyter_workspace_list` to check if a suitable workspace already exists
2. **Create** — call `jupyter_workspace_create` with name, language (`python` or `r`), and any dataset connections
3. **Start** — call `jupyter_workspace_start` if the workspace is stopped (newly created workspaces may need a start)
4. **Execute code** — call `jupyter_code_execute` with the code snippet; surface stdout, stderr, and any outputs to the user
5. **Stop when done** — call `jupyter_workspace_stop` to release compute; remind the user that notebooks in Domo have idle shutdown timers

## Workflow: Execute a Code Snippet Against a Dataset

1. **Find workspace** — call `jupyter_workspace_list`, pick one that has the required dataset connected
2. **Start if needed** — call `jupyter_workspace_start` if status is `stopped`
3. **Execute** — call `jupyter_code_execute` with the code; wait for the result
4. **Surface result** — report stdout, return values, and any errors to the user
5. **Suggest next steps** — if the user wants to persist the analysis, suggest saving it as a dataset export

## Guardrails

- **Never delete a workspace** without explicit user confirmation — `jupyter_workspace_delete` destroys notebooks and outputs
- **`jupyter_code_execute` runs arbitrary code** — confirm with the user that the code is safe before executing; do not run code that modifies datasets without explicit intent
- Workspaces must be in `running` state for `jupyter_code_execute` — always check status and start if needed
- Workspace creation may take 1-3 minutes; set user expectations accordingly

## Related Skills

- `domo-datasets` toolkit — query and import dataset data that feeds Jupyter workspaces
- `domo-codeengine` toolkit — serverless function execution (alternative to Jupyter for lightweight scripts)
