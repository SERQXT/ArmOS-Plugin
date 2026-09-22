---
name: domoai-jupyter-workspaces
tier: 0
description: "Domo Jupyter Workspaces — JupyterLab environment lifecycle, workspace definitions, instance management, domojupyter library for dataset I/O, OAuth handshake, kernel configuration, 28 endpoints. Trigger with 'jupyter', 'jupyter workspace', 'jupyterlab', 'notebook', 'domojupyter'."
maturity: alpha
audience: [code]
---

# DomoAI / Jupyter Workspaces

Jupyter Workspaces are persistent JupyterLab environments hosted by Domo. Each workspace definition stores configuration (kernel, CPU/memory, input/output datasets, accounts, AppDB collections, file shares). Running a workspace spins up an **instance** — a live container accessible via a JupyterHub URL. Instances shut down automatically on timeout; the workspace definition persists.

Code inside a running instance accesses Domo datasets through the `domojupyter` Python library (pre-installed in every workspace — no `pip install` needed), which uses the workspace's pre-configured input/output aliases rather than credentials.

> **Agent limitation:** The agent can create workspaces, configure them, and launch instances via the REST API. Once launched, the JupyterLab UI opens in a cross-origin iframe that is inaccessible to the agent — there is no API to inject code or execute cells remotely. When asked to perform work inside a workspace, the agent must write the complete notebook code and provide the user with explicit instructions to paste and run it manually (e.g., "Open the workspace → create a new notebook → paste the following code → press Shift+Enter to run").

---

## Prerequisites / Grants

- The Jupyter Workspaces feature must be enabled on the instance (`isEnabled: true` in settings response).
- **Jupyter OAuth handshake** — the first time a user interacts with instances in a session, Domo's Jupyter subsystem requires an OAuth handshake with the external JupyterHub server. Endpoints that require this (`workspaces/user`, `instances`) return `403 DS-0018` with a `jupyterAuthURL` in the error body until it is completed. Extract `details.jupyterAuthURL` from the 403 and send the user there; after redirecting back, retry the original call.
- `userAccess` in settings controls who can launch workspaces (`EVERYONE` or restricted).
- A workspace can have **at most one active instance per user** at a time.

---

## API Endpoints — 12 workspace-specific endpoints

| Method | Path | Status | Notes |
|--------|------|--------|-------|
| GET | `/api/datascience/v1/settings` | 200 | Instance-level Jupyter config |
| POST | `/api/datascience/v1/search/workspaces` | 200 | List/search workspace definitions |
| POST | `/api/datascience/v1/workspaces` | 201 | Create workspace definition (~3s) |
| GET | `/api/datascience/v1/workspaces/{id}` | 200 | Get workspace + active instances |
| GET | `/api/datascience/v1/workspaces/user` | 200/403 | Current user's workspace access; 403 DS-0018 until Jupyter OAuth handshake is completed, 200 thereafter |
| GET | `/api/datascience/v1/workspaces/{id}/snapshots` | 200 | List saved snapshots |
| POST | `/api/datascience/v1/workspaces/{id}/instances` | 200/403 | Start (launch) a workspace instance |
| POST | `/api/datascience/v1/workspaces/{id}/bootstrap` | 200/403 | Bootstrap kernel for a workspace |
| DELETE | `/api/datascience/v1/workspaces/{id}/instances/{instanceId}` | 204 | Stop a running instance (~4s) |
| PUT | `/api/datascience/v1/workspaces/{id}` | 200 | Update workspace definition (~827ms) |
| DELETE | `/api/datascience/v1/workspaces/{id}` | 204 | Delete workspace definition (~270ms) |
| POST | `/api/datascience/ml/v1/search/models` | 200 | List ML models (DomoAI sidebar) |

---

## Workflow 1 — Load Jupyter Workspaces Page

On navigation to DomoAI > Jupyter Workspaces, Domo fires a 3-call initialization sequence:

```
GET  /api/datascience/v1/workspaces/user    → 403 DS-0018 if not Jupyter-authed (expected on first load)
GET  /api/datascience/v1/settings           → instance config, available kernels, resource limits
POST /api/datascience/v1/search/workspaces  → paginated list of workspace definitions
```

The 403 on `workspaces/user` is normal on first load — the UI proceeds to render the workspace list from the search call regardless.

**Settings response shape:**
```json
{
  "instanceTypes": [
    { "cpu": 0.5, "memory": 4 },
    { "cpu": 1,   "memory": 8 },
    { "cpu": 2,   "memory": 16 },
    { "cpu": 4,   "memory": 32 },
    { "cpu": 8,   "memory": 64 },
    { "cpu": 16,  "memory": 128 }
  ],
  "limits": [
    { "resourceType": "CPU",    "limit": 128,  "aggregationType": "JUPYTER_WORKSPACE" },
    { "resourceType": "MEMORY", "limit": 1024, "aggregationType": "JUPYTER_WORKSPACE" }
  ],
  "isEnabled": true,
  "userAccess": "EVERYONE",
  "jupyterKernels": [
    { "kernel": "PYTHON_3_9",  "displayName": "Python 3.9" },
    { "kernel": "PYTHON_3_10", "displayName": "Python 3.10" },
    { "kernel": "PYTHON_3_11", "displayName": "Python 3.11" },
    { "kernel": "PYTHON_3_12", "displayName": "Python 3.12" },
    { "kernel": "R",           "displayName": "R" }
  ],
  "featureFlags": ["jupyter-notebooks-accounts", "jupyter-notebooks-sharing", "jupyter-notebooks-appdb"]
}
```

**Search workspaces request:**
```json
{
  "limit": 50,
  "offset": 0,
  "sortFieldMap": { "LAST_RUN": "DESC" },
  "searchFieldMap": { "NAME": "" },
  "filters": []
}
```

**Workspace object shape** (from search response):
```json
{
  "id": "108f8d59-284d-4239-af9e-4217eb62de6b",
  "name": "AI Card Analyzer",
  "description": "",
  "created": "2026-01-21T20:55:17.061+00:00",
  "updated": "2026-03-22T01:24:01.966+00:00",
  "lastRun": "2026-03-22T01:24:01.966+00:00",
  "instances": [],
  "inputConfiguration":  [],
  "outputConfiguration": [],
  "owner": 11203081,
  "coOwners": [],
  "jupyterKernel": "PYTHON_3_12",
  "cpu": 4,
  "memory": 32,
  "timeoutHours": 8,
  "activityBasedTimeout": true,
  "sharingEnabled": false,
  "accountConfiguration": [],
  "collectionConfiguration": [],
  "fileshareConfiguration": []
}
```

---

## Workflow 2 — Create a Workspace

**POST** `/api/datascience/v1/workspaces`  →  `201 Created`  (~3 seconds)

```json
{
  "name": "My Analysis Workspace",
  "description": "Optional description",
  "jupyterKernel": "PYTHON_3_12",
  "cpu": 0.5,
  "memory": 4,
  "timeoutHours": 1,
  "activityBasedTimeout": true,
  "inputConfiguration": [
    { "dataSourceId": "<dataset-guid>", "alias": "Sales Data" }
  ],
  "outputConfiguration": [
    { "alias": "Analysis Output" }
  ],
  "accountConfiguration":    [],
  "collectionConfiguration": [],
  "fileshareConfiguration":  []
}
```

**Key fields:**

| Field | Notes |
|-------|-------|
| `jupyterKernel` | One of: `PYTHON_3_9`, `PYTHON_3_10`, `PYTHON_3_11`, `PYTHON_3_12`, `R` |
| `cpu` / `memory` | Must be a matched pair from `settings.instanceTypes` (e.g. `0.5` cpu requires `4` memory) |
| `timeoutHours` | How long before an inactive instance auto-stops |
| `activityBasedTimeout` | `true` = timer resets on kernel activity (use for interactive work); `false` = hard wall-clock limit (use for automated runs) |
| `inputConfiguration` | Datasets the workspace can read; `alias` is how `domojupyter` references them inside notebooks |
| `outputConfiguration` | Datasets the workspace can write; omit `dataSourceId` to auto-create a new dataset on workspace creation |
| `accountConfiguration` | Domo Accounts (OAuth credentials) injected into the workspace for external service access |
| `collectionConfiguration` | AppDB collections accessible inside the workspace |
| `fileshareConfiguration` | Domo File Shares (shared file storage) accessible inside the workspace |

**Important:** An `outputConfiguration` entry without a `dataSourceId` causes Domo to create a new dataset automatically at workspace creation time. The assigned dataset ID will appear in the response. That dataset persists even if the workspace is later deleted.

---

## Workflow 3 — Launch a Workspace Instance

```
POST /api/datascience/v1/workspaces/{id}/instances   →  200 (or 403 DS-0018 if not Jupyter-authed)
GET  /api/datascience/v1/workspaces/{id}             →  poll until instance is ready
```

**If 403 DS-0018:** Extract `details.jupyterAuthURL` from the error body, send the user to that URL to complete the Jupyter OAuth handshake, then retry `POST instances`.

**Polling for ready state:** Poll `GET /api/datascience/v1/workspaces/{id}` every 3–5 seconds. The instance is ready when `instances[0].status` transitions away from `BOOTSTRAPPING`. Bootstrap typically takes 30–90 seconds depending on instance size.

```json
{
  "instances": [
    {
      "started": "2026-04-14T20:59:29.839+00:00",
      "lastActivity": "2026-04-14T20:59:29.839+00:00",
      "url": "https://{instance}.jupyter-prod5.domodatascience.com/hub/auth_refresh?...",
      "status": "BOOTSTRAPPING",
      "userId": 566865183
    }
  ]
}
```

Once running, the `url` in the instance object is the direct JupyterLab link. Opening it completes the Jupyter OAuth handshake (`GET /api/oauth2/authorize` → `POST /api/oauth2/authorize` → redirect).

---

## Workflow 4 — Monitor a Running Workspace

```
GET /api/datascience/v1/workspaces/{id}             →  workspace + instance status
GET /api/datascience/v1/workspaces/{id}/snapshots   →  list saved snapshots ([] if none created)
GET /api/datascience/v1/settings                    →  re-fetch if checking resource availability
```

Snapshots are user-initiated saves of the workspace's notebook files. They are listed here but creation is handled inside the JupyterLab UI (not via a captured REST endpoint — it runs over the Jupyter WebSocket/ZMQ protocol outside the Domo API layer).

---

## Workflow 5 — Edit a Workspace

**PUT** `/api/datascience/v1/workspaces/{id}`  →  `200 OK`  (~827ms)

The edit is a **full-object replace** — fetch the current workspace with `GET /api/datascience/v1/workspaces/{id}`, apply your changes to the object, then PUT the entire object back. Partial updates are not supported.

```json
{
  "id": "cde6f6e5-03ed-4bbe-bc4e-e84d71a531b2",
  "name": "Updated Workspace Name",
  "description": "Updated description",
  "jupyterKernel": "PYTHON_3_12",
  "cpu": 4,
  "memory": 32,
  "timeoutHours": 8,
  "activityBasedTimeout": false,
  "inputConfiguration": [
    { "dataSourceId": "<dataset-guid>", "alias": "Sales Data" }
  ],
  "outputConfiguration": [
    { "dataSourceId": "<output-dataset-guid>", "alias": "Analysis Output", "streamId": 420 }
  ],
  "owner": 566865183,
  "coOwners": [],
  "bootstrapKernel": false,
  "migrateFiles": true,
  "sharingEnabled": false,
  "accountConfiguration": [],
  "collectionConfiguration": [],
  "fileshareConfiguration": [],
  "instances": [],
  "created": "2026-04-14T22:21:59.806+00:00",
  "updated": "2026-04-14T22:21:59.806+00:00",
  "dataLoaded": true
}
```

**What can be changed via PUT:** name, description, kernel, cpu/memory sizing, timeoutHours, activityBasedTimeout, inputConfiguration, outputConfiguration, accountConfiguration, collectionConfiguration, fileshareConfiguration, sharingEnabled, coOwners.

**Important:** The `outputConfiguration` entries must include `dataSourceId` and `streamId` if the dataset already exists — omitting them may cause a new dataset to be created. Always GET the workspace first and edit the returned object rather than constructing the PUT body from scratch.

---

## Workflow 6 — Stop and Delete

**Stop instance (keep workspace definition):**
```
DELETE /api/datascience/v1/workspaces/{id}/instances/{instanceId}   →  204 No Content  (~4s)
GET    /api/datascience/v1/workspaces/{id}                          →  confirm instances: []
```

The `instanceId` must be sourced from the `instances` array in the workspace detail response. There is no separate "list instances" endpoint — the workspace detail is the source of truth.

**Delete workspace entirely:**
```
DELETE /api/datascience/v1/workspaces/{id}   →  204 No Content  (~270ms)
```

This removes the workspace definition only. **Output datasets are not deleted** — they remain as standalone Domo datasets with 0 rows and no owner. In testing and development scenarios this accumulates quickly (every workspace creation with an `outputConfiguration` entry that omits `dataSourceId` auto-creates a new dataset). Clean them up explicitly:

```
DELETE /api/data/v3/datasources/{dataSourceId}   →  204 No Content
```

The `dataSourceId` for each output dataset is available in `outputConfiguration[n].dataSourceId` on the workspace object (from `GET /api/datascience/v1/workspaces/{id}` or the original create response). Collect these IDs before deleting the workspace, then delete each dataset after the workspace is gone.

**Full teardown sequence:**
```
1. GET  /api/datascience/v1/workspaces/{id}            →  collect outputConfiguration[*].dataSourceId
2. DELETE /api/datascience/v1/workspaces/{id}/instances/{instanceId}   →  204 (if running)
3. DELETE /api/datascience/v1/workspaces/{id}          →  204
4. DELETE /api/data/v3/datasources/{dataSourceId}      →  204 (repeat for each output dataset)
```

---

## The `domojupyter` Library (Inside a Running Workspace)

`domojupyter` is pre-installed in every Jupyter Workspace — do not `pip install` it. It provides authenticated access to Domo resources using the workspace's configured aliases and the running user's session.

### Reading a Dataset

```python
import domojupyter as domo

# Read by alias (defined in inputConfiguration when workspace was created)
df = domo.read_dataframe('Sales Data')

# Read with SQL filter
df = domo.read_dataframe('Sales Data', query="SELECT * FROM table WHERE Region = 'West'")
```

### Writing a Dataset

```python
import domojupyter as domo
import pandas as pd

result_df = pd.DataFrame({'Region': ['West'], 'Total': [42000.0]})

# Write by alias (defined in outputConfiguration when workspace was created)
domo.write_dataframe(result_df, 'Analysis Output')
```

`write_dataframe` performs a **full replace** on each call — it does not append. The DataFrame's column names become the dataset schema; schema changes between writes may cause downstream dataflow errors.

### Working with Accounts

```python
import domojupyter as domo

# Get OAuth credentials from a configured Domo Account (must be in accountConfiguration)
username     = domo.get_account_property('MySnowflakeAccount', 'username')
access_token = domo.get_account_property('MySnowflakeAccount', 'accessToken')
```

### Working with AppDB Collections

```python
import domojupyter as domo

# Read all documents from a collection (must be in collectionConfiguration)
docs = domo.read_collection('my_collection_name')

# Write documents to a collection
domo.write_collection('my_collection_name', [{'key': 'value'}])
```

### Working with File Shares

```python
import domojupyter as domo

# List files in a configured file share (must be in fileshareConfiguration)
files = domo.list_fileshare('my_fileshare_name')

# Read a file from a file share
content = domo.read_fileshare('my_fileshare_name', 'path/to/file.csv')
```

### Calling Domo APIs from Inside a Workspace

```python
import domojupyter as domo
import requests

# Get the current user's session token for authenticated API calls
session_token = domo.get_session_token()

headers = {'X-DOMO-Authentication': session_token}
response = requests.get('https://{instance}.domo.com/api/...', headers=headers)
```

### R Kernel

The `domojupyter` package is also available for R workspaces:

```r
library(domojupyter)

# Read dataset by alias
df <- read_dataframe("Sales Data")

# Write results back
write_dataframe(result_df, "Analysis Output")
```

---

## Resource Sizing Guide

| Use Case | CPU | Memory |
|----------|-----|--------|
| Light exploration / small datasets | 0.5 | 4 GB |
| Standard analysis | 1 | 8 GB |
| Medium ML training | 2 | 16 GB |
| Large ML / complex models | 4 | 32 GB |
| Heavy compute / large model training | 8–16 | 64–128 GB |

Available kernels: Python 3.9, 3.10, 3.11, 3.12, R. Python 3.12 is the default in the UI.

`activityBasedTimeout: true` is recommended for interactive work — the timer resets when the kernel is active. Use `activityBasedTimeout: false` with a firm `timeoutHours` for automated or scheduled runs where you want guaranteed shutdown.

---

## Sharing Workspaces

The `sharingEnabled` flag and `coOwners` array control collaboration (requires `jupyter-notebooks-sharing` feature flag):

- `sharingEnabled: true` allows other users to launch their own instance of the workspace
- `coOwners` is a list of user IDs with edit access to the workspace definition
- Each user who launches a shared workspace gets their own isolated instance

---

## Considerations

- **Instance startup time** — bootstrapping takes 30–90 seconds. The `BOOTSTRAPPING` status on the instance indicates it is not yet ready for use. Poll `GET /workspaces/{id}` to check.
- **Jupyter auth (DS-0018)** — a 403 with `errorCode: DS-0018` on instance or user endpoints means the Jupyter OAuth handshake has not been completed for this session. Use the `jupyterAuthURL` from `details` to resolve it. This is a per-session, first-time requirement — not a permissions error.
- **Output datasets persist after workspace deletion** — deleting a workspace does not delete its output datasets. They remain as 0-row orphaned datasets with no owner. In active development this accumulates fast. Always collect `outputConfiguration[*].dataSourceId` from the workspace before deleting it, then delete each dataset via `DELETE /api/data/v3/datasources/{id}`. See the full teardown sequence in Workflow 6.
- **`domojupyter` only runs inside a workspace** — it cannot be used in Code Engine packages or standalone scripts. It relies on injected environment credentials only available within the workspace container.
- **Full replace on write** — `write_dataframe` replaces the entire dataset each time. If the column schema changes between writes, downstream dataflows connected to that output dataset may break.
- **Credit consumption on consumption-based contracts** — Jupyter Workspaces consume Domo credits while instances are running. Users who launch a workspace and forget to stop it can generate significant unplanned credit spend. On consumption-based accounts, establish a governance convention (short default timeouts, `activityBasedTimeout: true`, user awareness) before rolling out broad access. Admins should monitor active instances regularly.
- **The JupyterLab iframe is inaccessible to the agent** — once a workspace instance is launched and the JupyterLab UI opens, it runs inside a cross-origin iframe on a separate JupyterHub domain (`{instance}.jupyter-prod5.domodatascience.com`). There is no REST endpoint to inject code, execute cells, or read cell output. The agent's role ends at launch. For any coding task inside the workspace, the agent must: (1) write the complete notebook code, (2) provide step-by-step instructions for the user to paste and run it (New Notebook → paste into cell → Shift+Enter), and (3) explain what output to expect and how to verify success. The user is the hands inside the workspace.
- **Cell execution is invisible to REST API recorders** — JupyterLab executes notebook cells over WebSocket/ZMQ directly with the JupyterHub kernel. This traffic does not appear in Domo's REST API layer.
- **`migrateFiles: true`** — this flag (set automatically on workspace creation) controls whether notebook files from prior sessions are restored when a new instance starts. Files are stored in Domo's managed workspace storage, not in local disk that disappears on shutdown.

---

## Anti-Patterns

- **Hard-coding dataset IDs inside notebooks** — use `domo.read_dataframe('Alias')` with the configured alias rather than querying by dataset ID. Aliases are portable across instances and make workspace configuration explicit.
- **Very long or unlimited timeouts** — instances consume real compute resources. Use `activityBasedTimeout: true` for interactive work and set a reasonable `timeoutHours` ceiling.
- **Creating a new workspace for each analysis** — workspace creation (~3s) and bootstrapping (30–90s) have meaningful overhead. Maintain a workspace per use case and reuse it.
- **Storing credentials or tokens in notebook cells** — use `accountConfiguration` to inject Domo Accounts; access them via `domo.get_account_property()`. Never hardcode secrets.
- **Changing output DataFrame schema between runs** — altering column names or types on an output dataset that feeds a dataflow will break the downstream pipeline. Treat the output schema as a contract.
- **`pip install domojupyter`** — it is already installed. Attempting to install it may overwrite the version configured for the workspace.
- **Deleting a workspace without cleaning up its output datasets** — `DELETE /api/datascience/v1/workspaces/{id}` only removes the workspace definition. Output datasets remain as 0-row orphans in the instance's dataset list. Always collect and delete them explicitly before or after deleting the workspace. In development and testing this compounds quickly — a handful of test workspaces can leave a dozen abandoned datasets behind.

---

## When to Use

### Best For
- **Custom ML model training and scoring pipelines** — when you need scikit-learn, XGBoost, Prophet, or PyTorch applied to Domo datasets and the output needs to feed dashboards or Domo Apps. The workspace handles iterative development; Code Engine handles the scheduled production run.
- **Complex multi-step transformations requiring Python logic** that Magic ETL cannot express: regex-heavy text parsing, fuzzy matching, statistical outlier detection, custom time-series decomposition, or any transformation requiring state across rows that Beast Mode cannot handle.
- **Exploratory data analysis (EDA) and ad hoc investigation** of Domo datasets before committing to a permanent dataflow — analysts can pull live data, profile it, and validate assumptions without building permanent pipeline infrastructure.
- **Model prototyping with a fast feedback loop** — data scientists iterate on feature engineering and model selection directly against production-scale Domo data without maintaining a separate data copy in a local environment.
- **One-time or low-cadence enrichment jobs** (monthly cohort analysis, annual budget model refresh, quarterly churn scoring) where the overhead of packaging Code Engine is not justified and a human will trigger the run anyway.

### Power Features
- **`domojupyter` as a zero-copy data bridge** — `read_dataframe()` and `write_dataframe()` give a Pandas (or R) DataFrame from any Domo dataset without exporting CSVs, managing API keys, or standing up an external connector. The data is already in the room.
- **Domo Accounts (OAuth credential passthrough)** — workspaces bind to Domo Account objects (Salesforce, Snowflake, Google APIs, custom OAuth), so secrets never appear in notebook code. Data scientists call external services without IT involvement in credential management.
- **AppDB write-back** — notebooks can write results directly into AppDB collections that power Domo Apps, enabling ML models to update the data layer of a deployed app on each run. No external database needed.
- **Interactive visualization in context** — Plotly, Altair, Seaborn, and Bokeh render inline against real Domo data during development, letting analysts validate chart logic before building the equivalent in Analyzer.
- **Kernel version control per workspace** — Python/R environments are pinned per workspace definition. A 2019 R model using an older API stays reproducible while newer workspaces run current Python. Not possible in Magic ETL or Code Engine without container management.

### Business Domains
- **Data science and analytics engineering teams** — primary users; removes all friction of the Domo API for technical users while keeping data in Domo's governance layer.
- **Finance and FP&A** — Monte Carlo simulations, scenario modeling, variance attribution, and rolling forecast models that exceed what calculated fields and Beast Mode can handle.
- **Sales and revenue operations** — territory scoring, quota modeling, rep-level performance clustering, and pipeline health models trained on CRM data already in Domo.
- **Customer success and support** — churn prediction, health score modeling, NLP on ticket text (sentiment, category classification), and cohort survival analysis.
- **Retail and e-commerce** — demand forecasting, inventory optimization, and price elasticity analysis where scored output needs to surface in operational dashboards immediately.

### Do NOT Use When
- **You need a scheduled, unattended production job** — instances require a human trigger or launch mechanism; for recurring runs use Code Engine packages instead. Workspaces are development environments, not execution environments.
- **The transformation is expressible in SQL or Magic ETL** — joins, aggregations, date math, or simple calculated columns are faster to build, easier to audit, and cheaper to run in a Magic ETL dataflow. Reach for Workspaces only when the logic genuinely cannot be expressed in SQL.
- **Near-real-time or streaming data processing** — the 30–90 second bootstrap time and full-dataset-replace write semantics make Workspaces a poor fit for sub-minute latency requirements. Use Domo Workflows, Kafka connectors, or external stream processors.
- **Large-scale distributed compute** — `domojupyter` loads entire datasets into memory on a single container. If your dataset exceeds available RAM even on the largest instance, push computation to Snowflake, BigQuery, or Databricks and write only the result set back to Domo.
- **Simultaneous multi-user editing** — instances are single-user. For collaborative data science, use an external JupyterHub or Databricks with git-based version control, then promote the final output to Domo via API or Code Engine.
- **Credit-sensitive consumption-based accounts** — Jupyter Workspaces consume Domo credits while running. On consumption-based contracts, instances left running by users who forgot to stop them can generate significant unplanned credit spend. If the customer is hyper credit-aware, evaluate whether Code Engine packages or external tooling better fits their cost model before recommending Workspaces.

### Anti-Patterns
- **Using Workspaces as a production scheduler** — auto-stop will kill idle instances, state is not persisted between runs, and there is no retry or alerting mechanism. Build the production version as a Code Engine package; use the workspace only for development and validation.
- **Hardcoding dataset IDs or credentials inside notebook cells** — this bypasses the alias system, breaks when datasets are moved, and leaks credentials. Always use `domo.read_dataframe(alias)` with named input aliases defined in the workspace definition.
- **Loading entire large datasets without filtering** — `read_dataframe()` without a query loads the full dataset into RAM. For datasets over ~5M rows, pre-aggregate in a Magic ETL upstream dataflow and pull only the summarized output into the workspace.
- **Treating the notebook as the source of truth for code** — notebooks not backed by version control (git export, scheduled backup) are silently lost when workspaces are reconfigured or deleted. Export `.ipynb` to a connected git repo or Domo File Share on every meaningful iteration.
- **Writing every intermediate DataFrame as a Domo output** — this creates dataset sprawl, confuses downstream users, and wastes row credits. Write only the final consumer-facing dataset; keep intermediate state in-memory or in AppDB if cross-session persistence is needed.
- **Ignoring instance sizing** — oversized instances waste budget on EDA workloads; undersized instances cause silent memory pressure and slow runtimes on model training. Size based on the peak working set of the largest dataset plus model training overhead.

### Integration Patterns
- **Workspace → Code Engine promotion path** — the canonical ML pattern in Domo: develop and validate in a Workspace (fast iteration, interactive debugging), then extract the core logic into a Code Engine package for scheduled production execution. The workspace is the IDE; Code Engine is the runtime.
- **Upstream Magic ETL → Workspace → Downstream Analyzer** — Magic ETL handles joins, filters, and schema normalization. The Workspace applies Python logic the ETL cannot. The output dataset feeds Analyzer cards or Domo Apps. This is the correct separation of concerns.
- **Workspace → AppDB → Domo App** — write scored output (customer health scores, recommended next actions) to an AppDB collection. The App reads from AppDB at render time, giving near-real-time model output without polling a dataset.
- **Domo Accounts for external API calls** — bind third-party OAuth credentials (OpenAI, Salesforce, Google Sheets) to the workspace. Notebooks call `domo.get_account_property()` at runtime. Secrets stay in Domo's auditable, rotatable credential vault.
- **File Shares for large binary artifacts** — model pickle files, trained embeddings, and reference lookup files too large or wrong-shaped for datasets belong in a File Share mounted to the workspace. Enables model persistence between sessions and a train-in-one-workspace, score-in-another pattern.
