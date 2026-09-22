---
name: jupyter-builder
tier: 1
description: "Create and manage Jupyter Workspaces in Domo for data science and Python development. Trigger with 'create a jupyter workspace', 'jupyter notebook', 'data science workspace', 'python workspace', or any request to set up a Jupyter environment in Domo."
maturity: alpha
audience: [delivery, code]
---

# Jupyter Builder

Create and manage serverless Jupyter Workspaces in Domo. Handles the full lifecycle: create workspace, configure dataset I/O, set compute resources, start instances, and share JupyterHub URLs with users. Uses the domo-jupyter MCP server which wraps the Domo Jupyter Workspaces API.

## Triggers

- "create a jupyter workspace"
- "jupyter notebook"
- "data science workspace"
- "python workspace"
- "set up a Jupyter environment for [use case]"
- "I need to run Python on my Domo data"
- "run this code in Jupyter"
- "execute this notebook"
- "run the notebook in workspace [name]"

---

## Pre-Flight: Session Validation (MANDATORY)

Before attempting ANY Jupyter operation (workspace CRUD, code execution, notebook runs), you MUST verify the Domo session is valid:

1. **Call `jupyter_health_check`** — this verifies Ryuu CLI session connectivity.
2. **If it returns `status: "error"`** — STOP and tell the user:
   > Your Domo session is not active. Please run `domo login -i {instance}.domo.com` in your terminal to authenticate, then try again.
3. **Never attempt workarounds** for authentication failures (e.g., trying OAuth login manually, passing username/password, or using developer tokens for execution tools). These will corrupt the Ryuu CLI session file by deleting the `refreshToken`, causing ALL subsequent tool calls to fail silently.
4. **If a tool call fails with a 401 or auth error mid-session** — the session has gone stale. Tell the user to re-authenticate with `domo login -i {instance}.domo.com` and do NOT retry the failing call.

### URL Resolution

When a user pastes a Domo Jupyter URL (e.g., `https://cozyearth.domo.com/jupyter-workspaces/d21bf9b5-...`), use the `jupyter_url_resolve` tool to extract the workspace ID and fetch workspace details in one call. Do NOT manually parse URLs or guess workspace IDs.

---

## How Jupyter Workspaces Work in Domo

Jupyter Workspaces are serverless Jupyter environments hosted by Domo. Each workspace is an isolated compute environment with:

- A configurable **kernel** — Python 3.9, 3.10, 3.11, 3.12, or R 4.1
- Configurable **CPU and memory** allocation
- **Input datasets** mapped into the workspace as readable data sources
- **Output datasets** the workspace can write results back to
- An **auto-shutdown timeout** to conserve resources when idle
- Optional **account configuration** for external service credentials
- Optional **collection configuration** for organizing workspaces

### Domo UI Flow

1. **Workspace list page** — `https://<instance>.domo.com/ai-services/jupyter` — shows all workspaces with Name, Owner, Last Run, Sharing, and Status (Stopped / Starting / Running).
2. **Starting a workspace** — Clicking a Stopped workspace shows a "Start this Workspace" dialog. After clicking Start, status changes to "Starting" with a spinner. Provisioning takes **1-3 minutes**.
3. **Opening a Running workspace** — Clicking a Running workspace navigates to `https://<instance>.domo.com/jupyter-workspaces/{id}` (note: different URL pattern from the list page).
4. **First-time JupyterHub OAuth** — The first time a user opens a workspace, JupyterHub OAuth completes automatically via redirect (no consent button to click). The page may appear blank briefly during the `auth_refresh` redirect. Once the JupyterHub notebook UI loads (file browser, kernel status), OAuth is complete.
5. **Subsequent visits** — After the initial OAuth, the JupyterHub session is established and the notebook UI loads immediately.

The agent **cannot interact with the JupyterHub UI directly** — the user must open the workspace in their browser to write and run notebooks interactively. However, the `jupyter_execute` tools can run code programmatically via API once OAuth has been established (see Code Execution section).

---

## MCP Tools Reference

### Workspace CRUD (developer token auth)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `jupyter_workspace_list` | List all Jupyter workspaces | — |
| `jupyter_workspace_get` | Get a workspace by ID | `workspace_id` |
| `jupyter_workspace_create` | Create a new Jupyter workspace | `name`, `description`, `jupyterKernel`, `cpu`, `memory`, etc. |
| `jupyter_workspace_update` | Update a Jupyter workspace (full PUT) | `workspace_id`, full workspace object |
| `jupyter_workspace_delete` | Delete a Jupyter workspace | `workspace_id` |
| `jupyter_workspace_search` | Search workspaces by name/description | `query` |
| `jupyter_workspace_files` | List files in a workspace | `workspace_id` |
| `jupyter_workspace_start` | Start a workspace instance | `workspace_id` |
| `jupyter_settings` | Get Jupyter platform settings (kernels, limits) | — |
| `jupyter_health_check` | Verify Jupyter API connectivity | — |
| `jupyter_url_resolve` | Resolve a Domo Jupyter URL to workspace details + files | `url` |

### Code Execution (browser login auth — requires DOMO_INSTANCE + Domo CLI session)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `jupyter_execute` | Execute Python/R code in a workspace | `workspace_id`, `code`, credentials |
| `jupyter_notebook_run` | Run all cells of a .ipynb file in a workspace | `workspace_id`, `notebook_path`, credentials |

> **Why separate auth?** Domo's Jupyter Server API requires OAuth session cookies from the JupyterHub
> redirect chain. Developer tokens do not work for code execution. The MCP tools handle this
> programmatically using Ryuu CLI tokens to follow the OAuth redirect chain and collect cookies.
> The user must visit the workspace in their browser once to initialize the JupyterHub session.

---

## Workspace Object — Key Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | Workspace display name | `"Sales Forecast Model"` |
| `description` | string | Purpose of the workspace | `"Monthly revenue forecasting"` |
| `jupyterKernel` | string | Python kernel version | `"python_3.12"` |
| `cpu` | number | CPU cores allocated | `4` |
| `memory` | number | Memory in GB | `32` |
| `timeoutHours` | number | Auto-shutdown after idle hours | `8` |
| `inputConfiguration` | array | Datasets the workspace can read | See below |
| `outputConfiguration` | array | Datasets the workspace can write | See below |
| `sharingEnabled` | boolean | Whether workspace is shared with others | `true` |
| `accountConfiguration` | array | External account credentials | `[]` |
| `collectionConfiguration` | array | Workspace grouping/organization | `[]` |

---

## Available Python Kernels

| Kernel ID | Python Version |
|-----------|---------------|
| `python_3.9` | Python 3.9 |
| `python_3.10` | Python 3.10 |
| `python_3.11` | Python 3.11 |
| `python_3.12` | Python 3.12 |
| `python_3.13` | Python 3.13 |

Use `jupyter_settings` to confirm the currently available kernels for the instance.

**Default recommendation:** Use `python_3.12` unless the user has a specific version requirement (see Real-World Patterns below).

---

## Compute Tiers

| CPU | Memory | Use Case |
|-----|--------|----------|
| 0.5 | 4 GB | Lightweight exploration, small datasets |
| 1 | 8 GB | Standard analysis, medium datasets |
| 2 | 16 GB | Model training, larger datasets |
| 4 | 32 GB | Heavy computation, feature engineering |
| 8 | 64 GB | Large-scale ML training |
| 16 | 128 GB | Big data processing |
| 32 | 256 GB | Maximum capacity workloads |

**Default recommendation:** Start with 4 CPU / 32 GB for production workloads, or 1 CPU / 8 GB for lightweight exploration (see Real-World Patterns below).

---

## Dataset Mapping

Workspaces interact with Domo datasets through input and output configurations.

### Input Configuration (read datasets into workspace)

```json
{
  "inputConfiguration": [
    {
      "dataSourceId": "abc-123-def",
      "alias": "sales_data"
    },
    {
      "dataSourceId": "ghi-456-jkl",
      "alias": "product_catalog"
    }
  ]
}
```

Inside the Jupyter notebook, these datasets are accessible by their `alias` name using the `domo` library:

```python
import domo
df = domo.read_dataframe("sales_data")
```

### Output Configuration (write results back to Domo)

```json
{
  "outputConfiguration": [
    {
      "dataSourceId": "mno-789-pqr",
      "alias": "forecast_results"
    }
  ]
}
```

Inside the notebook, write back using:

```python
domo.write_dataframe(df, "forecast_results")
```

**Important:** The `dataSourceId` must reference an existing Domo dataset. Use the domo-datasets MCP tools to create output datasets first if they do not exist yet.

---

## Execution Flow — New Workspace

### Step 1: Gather Requirements

Determine the workspace configuration from the user's request:

- **Name and description** — what is the workspace for?
- **Python version** — any specific version needed? Default to `python_3.12`.
- **Compute resources** — how much CPU/memory? Default to 4 CPU / 32 GB for production, 1 CPU / 8 GB for exploration.
- **Input datasets** — which Domo datasets should be readable? Collect dataset IDs and assign meaningful aliases.
- **Output datasets** — will the workspace write results back? If so, identify or create target datasets.
- **Timeout** — always use 8 hours with activity-based timeout enabled (production standard).

### Step 2: Create the Workspace

```
jupyter_workspace_create(
  name: "Sales Forecast Model",
  description: "Monthly revenue forecasting using Prophet",
  jupyterKernel: "python_3.12",
  cpu: 4,
  memory: 32,
  timeoutHours: 8,
  activityBasedTimeout: true,
  inputConfiguration: [
    { dataSourceId: "abc-123", alias: "sales_data" }
  ],
  outputConfiguration: [
    { dataSourceId: "def-456", alias: "forecast_results" }
  ]
)
```

Save the returned `workspace_id` for subsequent operations.

### Step 3: Verify the Workspace

```
jupyter_workspace_get(workspace_id: "<workspace-id>")
```

Confirm all settings are correct: kernel, compute, dataset mappings.

### Step 4: Start the Workspace Instance

```
jupyter_workspace_start(workspace_id: "<workspace-id>")
```

This triggers Domo to provision the compute environment. Provisioning takes **1-3 minutes**. The workspace status moves through: **Stopped → Starting → Running**.

**After calling start, poll for readiness:**

```
jupyter_workspace_get(workspace_id: "<workspace-id>")
# Check response: instances[0].status === "RUNNING"
```

Poll every 15-20 seconds until `instances[0].status` is `"RUNNING"`. The status is in the `instances` array, NOT in the workspace root object.

**Do NOT call `jupyter_workspace_start` again while status is "Starting"** — this returns an HTTP 500 error. Always check status first and only start if the workspace is Stopped.

### Step 5: Share the URL and Complete First-Time OAuth

Once the workspace is Running, the user **must open it in their browser at least once** to establish the JupyterHub OAuth session. This is required before `jupyter_execute` can work programmatically.

**Instructions to give the user:**

1. Navigate to `https://<instance>.domo.com/ai-services/jupyter`
2. Click the workspace (now showing "Running" status)
3. The browser navigates to `https://<instance>.domo.com/jupyter-workspaces/{id}`
4. Wait for the JupyterHub notebook UI to load (file browser, kernel status visible)
5. OAuth is now complete — the workspace is ready for both interactive and programmatic use

This is a **one-time requirement** per user per workspace. After the initial OAuth, `jupyter_execute` will work without the user needing to visit the browser.

### Step 6: Notebook Upload

After generating a notebook (.ipynb) locally, it must be uploaded into the workspace. The domo-jupyter MCP server does not currently have a file upload tool, so guide the user through the process.

**Option A: Write notebook content via `jupyter_execute`**
If the agent has Ryuu CLI auth configured (`domo login`), use `jupyter_execute` to create the notebook programmatically inside the workspace:

```python
jupyter_execute(
  workspace_id: "<workspace-id>",
  code: """
import json
notebook_content = <serialized .ipynb JSON>
with open('/home/domo/work/notebook_name.ipynb', 'w') as f:
    json.dump(notebook_content, f)
print('Notebook written successfully')
"""
)
```

This avoids manual upload entirely. The notebook will appear in the workspace file browser.

**Option B: Manual upload (fallback)**
If `jupyter_execute` is unavailable (no Ryuu CLI session), provide the user with clear instructions:

1. Open the workspace URL: `https://<instance>.domo.com/ai-services/jupyter`
2. Navigate to the workspace and click into the JupyterLab session
3. In the JupyterLab file browser, click the **Upload** button (up-arrow icon)
4. Select the generated `.ipynb` file from the local path
5. Provide the **exact local file path** so the user can copy-paste it into the file picker

**Do NOT present this as a failure.** Frame it positively: "Your notebook is ready — here's how to load it into your workspace."

### Step 7: Output Dataset Verification

Before marking the orchestration complete, verify that the output dataset pipeline is properly configured end-to-end.

**Pre-run checks (agent performs these):**

1. **Confirm output dataset exists** — Use domo-datasets MCP tools (e.g., `dataset_get`) to verify each `dataSourceId` in the workspace's `outputConfiguration` actually exists in Domo. If a dataset is missing, create it first.
2. **Confirm alias consistency** — The alias in `outputConfiguration` must match exactly what the notebook uses in `domo.write_dataframe(df, "<alias>")`. Double-check the notebook code against the workspace config.
3. **Verify workspace config** — Call `jupyter_workspace_get` and confirm `outputConfiguration` contains the expected entries.

**Post-run verification (instruct the user or use execution tools):**

If `jupyter_execute` is available, add a verification step after the notebook runs:

```python
jupyter_execute(
  workspace_id: "<workspace-id>",
  code: """
import domo
df = domo.read_dataframe('<output_alias>')
print(f'Output dataset rows: {len(df)}')
print(df.head())
"""
)
```

If execution tools are not available, instruct the user:

> After running the notebook, verify data appears in the output dataset:
> - Dataset name: **[NAME]**
> - Dataset ID: **[ID]**
> - Expected alias: **[ALIAS]**
> - Check in Domo at: `https://<instance>.domo.com/datasources/<dataset-id>/details/overview`

If domo-datasets tools are available, query the output dataset directly to confirm rows were written:

```
dataset_get(dataset_id: "<output-dataset-id>")
```

Check that `rows` > 0 and `updatedAt` reflects a recent timestamp.

---

## Update Workflow

The Jupyter API uses **PUT** (full object replacement), not PATCH. To update a workspace:

1. **GET** the current workspace object:
   ```
   jupyter_workspace_get(workspace_id: "<workspace-id>")
   ```

2. **Merge** your changes into the full object. Do not omit fields — any missing field will be reset to its default.

3. **PUT** the complete updated object:
   ```
   jupyter_workspace_update(
     workspace_id: "<workspace-id>",
     <full workspace object with changes applied>
   )
   ```

### Common Update Scenarios

**Add a new input dataset:**
```
GET workspace → append to inputConfiguration array → PUT full object
```

**Scale up compute:**
```
GET workspace → change cpu and memory values → PUT full object
```

**Change Python kernel:**
```
GET workspace → change jupyterKernel → PUT full object
```

---

## PDCA Loop

Follow the Plan-Do-Check-Act cycle when building workspaces:

| Phase | Action |
|-------|--------|
| **Plan** | Gather requirements: datasets, kernel, compute, purpose |
| **Do** | Create workspace with `jupyter_workspace_create`, configure datasets |
| **Check** | Verify with `jupyter_workspace_get`, start instance with `jupyter_workspace_start`, confirm instance status |
| **Act** | Share JupyterHub URL with user, adjust resources if needed via update workflow |

---

## Examples

### Example 1: Simple Exploration Workspace

User says: "I need a Jupyter notebook to explore our customer churn data"

```
jupyter_workspace_create(
  name: "Customer Churn Exploration",
  description: "Exploratory data analysis on customer churn dataset",
  jupyterKernel: "python_3.12",
  cpu: 1,
  memory: 8,
  timeoutHours: 8,
  activityBasedTimeout: true,
  inputConfiguration: [
    { dataSourceId: "<churn-dataset-id>", alias: "churn_data" }
  ],
  outputConfiguration: []
)
```

### Example 2: ML Training Workspace with Output

User says: "Set up a data science workspace to train a sales forecast model and write predictions back to Domo"

```
jupyter_workspace_create(
  name: "Sales Forecast Training",
  description: "Train Prophet model on historical sales, write forecasts back",
  jupyterKernel: "python_3.12",
  cpu: 4,
  memory: 32,
  timeoutHours: 8,
  activityBasedTimeout: true,
  inputConfiguration: [
    { dataSourceId: "<sales-history-id>", alias: "sales_history" },
    { dataSourceId: "<product-dim-id>", alias: "product_dimensions" }
  ],
  outputConfiguration: [
    { dataSourceId: "<forecast-output-id>", alias: "sales_forecast" }
  ]
)
```

### Example 3: Adding a Dataset to an Existing Workspace

User says: "Add the marketing spend dataset to my forecast workspace"

```
# Step 1: Get current workspace
jupyter_workspace_get(workspace_id: "<workspace-id>")

# Step 2: Merge — append new entry to inputConfiguration
# existing inputConfiguration: [{ dataSourceId: "aaa", alias: "sales_history" }]
# new inputConfiguration: [
#   { dataSourceId: "aaa", alias: "sales_history" },
#   { dataSourceId: "<marketing-spend-id>", alias: "marketing_spend" }
# ]

# Step 3: PUT the full updated object
jupyter_workspace_update(workspace_id: "<workspace-id>", <full object>)
```

---

## Code Execution

The `jupyter_execute` and `jupyter_notebook_run` tools allow the agent to run code programmatically in a Domo Jupyter workspace. Under the hood, these tools use **Ryuu CLI token auth and programmatic OAuth** (not a browser):

1. **Authenticate** using Ryuu CLI token for the configured `DOMO_INSTANCE`
2. **Start the workspace** via Domo API (`POST /api/datascience/v1/workspaces/{id}/instances`) and poll until `instances[0].status === "RUNNING"` (1-3 minutes)
3. **Follow the JupyterHub OAuth redirect chain programmatically** — uses the Ryuu token to navigate HTTP redirects through `auth_refresh`, collecting session cookies in code (no browser needed)
4. **Create a kernel** via Jupyter Server REST API
5. **Execute code** via WebSocket (Jupyter kernel protocol v5.3)
6. **Capture output** (stdout, execute_result, display_data, errors)
7. **Clean up** the kernel after execution

**Prerequisite:** The user must have visited the workspace in their browser at least once to establish the initial JupyterHub session. If this hasn't happened, the programmatic OAuth chain will fail and `jupyter_execute` will return an auth error. See Step 5 in Execution Flow above.

### jupyter_execute — Run arbitrary code

```
jupyter_execute(
  workspace_id: "<workspace-id>",
  code: "import domo\ndf = domo.read_dataframe('sales_data')\nprint(df.shape)\nprint(df.head())",
  instance: "mycompany",
  username: "user@company.com",
  password: "password",
  timeout_seconds: 60
)
```

Returns: `{ success: true, output: "(1000, 5)\n  col1  col2 ...", errors: [] }`

### jupyter_notebook_run — Run all cells of a notebook

```
jupyter_notebook_run(
  workspace_id: "<workspace-id>",
  notebook_path: "work/analysis.ipynb",
  instance: "mycompany",
  username: "user@company.com",
  password: "password",
  continue_on_error: false,
  timeout_seconds: 120
)
```

Returns per-cell output with success/failure status. Stops on first error unless `continue_on_error: true`.

### Execution Gotchas

- **First-time JupyterHub auth required** — If `jupyter_execute` returns an OAuth or authentication error, the user must visit the workspace in their browser once. Navigate to `https://<instance>.domo.com/ai-services/jupyter`, click the running workspace, and wait for the JupyterHub notebook UI to load. This is a one-time requirement per user per workspace.
- **Don't start an already-starting workspace** — calling `jupyter_workspace_start` while the instance status is "Starting" returns HTTP 500. Always poll `jupyter_workspace_get` and check `instances[0].status` before calling start.
- **Status is in the instances array** — the workspace root object does NOT have a `status` field. After starting, check `instances[0].status` for the current state ("STOPPED", "STARTING", "RUNNING").
- **First call is slow** — workspace startup + OAuth takes 1-3 minutes. Subsequent calls reuse the session cookies.
- **Workspace must exist** — use `jupyter_workspace_create` first if needed.
- **Stopped workspaces restart faster** than brand new ones (~30s vs 2+ min).
- **Session persists** across calls for the same workspace — kernel is created/destroyed per call, but OAuth cookies are reused.
- **Authentication** uses Domo CLI (Ryuu) sessions for the configured `DOMO_INSTANCE`.

---

## Important Notes

- **All tools authenticate via Domo CLI (Ryuu) sessions.** CRUD tools and execution tools both use the Ryuu CLI session for the configured `DOMO_INSTANCE`. No developer tokens or username/password credentials are needed.
- **Always GET before UPDATE.** The API is full-object PUT. Omitting fields resets them.
- **Dataset IDs must exist.** Use domo-datasets tools to look up or create datasets before mapping them.
- **Use `jupyter_settings`** to check available kernels and compute limits for the target instance before creating a workspace.
- **Timeout matters.** Always use `timeoutHours: 8` with `activityBasedTimeout: true` — this is the production standard (92% of functional workspaces). Activity-based timeout shuts down idle workspaces automatically, so the 8-hour window is safe.
- **Check instance status** after starting. The workspace may take a moment to provision before JupyterHub is accessible.

---

## Real-World Patterns (from 106 production workspaces on modocorp)

Data filtered from 209 total Jupyter workspaces on modocorp.domo.com. **106 passed as functional production workspaces** (49% filtered out as test/untitled/demo/incomplete). All statistics below reflect only these 106 functional workspaces across 53 unique owners, giving a reliable view of actual production usage.

### Kernel + Compute Combinations

| Kernel + Compute | Count | Share | Notes |
|------------------|-------|-------|-------|
| PYTHON_3_12 + 4 CPU / 32 GB | 36 | 34% | **Production standard. Default for new workspaces.** |
| PYTHON_3_9 + 1 CPU / 8 GB | 36 | 34% | Legacy lightweight — only if user needs 3.9 dependencies |
| PYTHON_3_9 + 4 CPU / 32 GB | 8 | 8% | Legacy with power |
| PYTHON_3_9 + 0.5 CPU / 4 GB | 6 | 6% | Minimal legacy |
| R_4_1 + 1 CPU / 8 GB | 5 | 5% | R analytics — only when explicitly requested |
| PYTHON_3_12 + 8 CPU / 64 GB | 3 | 3% | Heavy compute (large-scale ML) |
| Other combinations | 12 | 11% | Various |

**Recommendation:** Default to **PYTHON_3_12 + 4 CPU / 32 GB** for all new workspaces. Use **1 CPU / 8 GB** only for explicitly lightweight exploration. The 8+ CPU tiers are rare and reserved for heavy ML workloads.

### Dataset I/O Patterns

| Pattern | Count | Share |
|---------|-------|-------|
| Both inputs and outputs | 63 | 59% |
| Input-only (read-only analysis) | 23 | 22% |
| Output-only (data generation) | 20 | 19% |

- **59% of production workspaces both read AND write data** — always ask about both input and output datasets.
- Most common configuration: **1 input dataset** (58 workspaces), **1 output dataset** (48 workspaces).
- Heavy users scale up to 9 inputs and 13 outputs.
- Output alias naming: `"Output N"` pattern is the most common convention (e.g., "Output 1", "Output 2").
- Every functional workspace has at least one dataset mapping (input or output). Workspaces with zero I/O were filtered as non-functional.

### Workspace Categories

| Category | Count | Examples |
|----------|-------|---------|
| ML/Predictive | 11 | "ShanaTruckWashPredictive", "Churn Modeling", "Fraud Detection" |
| Analysis | 7 | "Sentiment Analysis", "Reviews Data" |
| ETL/Pipeline | 3 | Data transformation pipelines |
| Domain-specific | 85 | Customer/project-specific workspaces |

### Top Production Workspaces (reference architectures)

| Workspace | I/O | Compute | Kernel | Pattern |
|-----------|-----|---------|--------|---------|
| ShanaTruckWashPredictive | 9in / 13out | 8 CPU / 64 GB | PYTHON_3_12 | Heavy ML pipeline |
| ISC \| Shipping & Transportation | 8in / 9out | 1 CPU / 8 GB | PYTHON_3_9 | Data pipeline |
| RetailTech \| HR Churn Modeling | 5in / 9out | 4 CPU / 32 GB | PYTHON_3_12 | ML modeling |
| Instance Schedule Monitoring | 2in / 11out | 16 CPU / 128 GB | PYTHON_3_12 | System monitoring |
| Get Google Places | 6in / 6out + 1 account | 4 CPU / 32 GB | PYTHON_3_12 | External API integration |

### Timeout Settings

| Timeout (hours) | Count | Share |
|-----------------|-------|-------|
| 8 | 98 | 92% |
| Other (1, 2, 3, 4) | 8 | 8% |

**Always use `timeoutHours: 8` with `activityBasedTimeout: true`.** This is universal across production workspaces. Activity-based timeout handles idle shutdown automatically, making the 8-hour window safe.

### Naming Conventions

Production workspaces follow these naming patterns (test/untitled/demo names were filtered out):

- **Pipe separator for org context:** `"ISC | Shipping & Transportation"`, `"RetailTech | HR Churn Modeling"`
- **Descriptive purpose names:** `"ShanaTruckWashPredictive"`, `"Airline Fraud Detection Modeling"`
- **Dash separator for analysis type:** `"Sentiment Analysis - Sony Products"`, `"AdFlock - Media Mixed Modelling (MMM)"`

**Avoid:** Names containing "test", "untitled", "workspace N", "copy of", or possessive names like "Mike's Workspace". Use descriptive names that convey the use case.

### Sharing, Ownership, and Accounts

- **Sharing enabled:** Only 22% of production workspaces — most are single-user. Default `sharingEnabled: false`.
- **Co-owners:** 81% have zero co-owners — workspaces are typically owned by one person.
- **Account configurations:** 10% use accounts for external API access (e.g., Google Places API). Only configure when the user needs external service credentials.
- **53 unique owners** across 106 workspaces — Jupyter adoption is broad, not concentrated.

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"jupyter"`
- `target_description`: a concise phrase describing what is being built (the result of Step 1)

This returns SOW scope items, named datasets, business rules, recent discussions, decisions, assumptions, risks, stakeholders, and prior work — all keyed to your build target, with confidence scores per section.

**Step 3 — Human review of memory hits.** Present the returned context to the user. For each section that has results:
- Show the section title and what was found (a 1-2 line summary per item)
- Show the confidence score
- Ask the user: "Are these relevant to what you're building? Reject anything that's about a different build, an older version, or a different engagement."

If a section returned 0 items, mention it explicitly so the user knows there's no prior context for that area.

**Step 4 — Plan with confirmed context.** Once the user confirms which items are relevant, use ONLY those confirmed items as inputs to your build plan. If the user rejected key context (e.g., no SOW scope was relevant), confirm with them whether to proceed greenfield or pause to gather more requirements.

If `memory_build_context` returns 0 total items, explicitly tell the user: "I found no prior memory context for this build. This will be a greenfield build — please confirm the requirements before I proceed."

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: workspace name, workspace ID, packages installed, notebook purpose, datasets connected.
