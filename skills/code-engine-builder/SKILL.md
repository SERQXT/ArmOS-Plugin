---
name: code-engine-builder
tier: 1
description: "Build and deploy serverless functions in Domo Code Engine via the REST API. Trigger with 'Code Engine', 'code engine', 'serverless function', 'create a Code Engine function', 'deploy a webhook handler', 'build a serverless function in Domo', 'list Code Engine packages', 'get Code Engine package', or any request to create or deploy Code Engine packages. For executing Code Engine functions from inside an app (SDK reference) use the code-engine skill."
maturity: alpha
audience: [delivery]
deprecated: true
deprecation_note: "Superseded by the upstream authoring-code-engine-packages skill (Lane L10 cluster consolidation). Use that skill for all new Code Engine builds; this one is retained for reference only."
---

# Code Engine Builder

Build and deploy serverless functions (JavaScript or Python) in Domo Code Engine. Manages the full lifecycle: create package, write code, release version, invoke, and update. Uses the domo-codeengine MCP server which wraps the `/api/codeengine/v2/` REST API.

> **Verified from 243 functional packages** (207 JS, 36 Python) out of 360 total farmed from domo-alex-dengate and modocorp. 33% of raw packages were filtered out as incomplete or unreleased. All patterns, categories, and examples below come from verified-functional (released, with real code) packages only.

## Triggers

- "create a code engine function"
- "deploy a webhook handler in Domo"
- "build a serverless function"
- "create a scheduled task in Code Engine"
- "write a data transformer function"
- "set up a webhook endpoint in Domo"

---

## MCP Tools Reference

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `codeengine_package_list` | List all Code Engine packages | — |
| `codeengine_package_get` | Get a package with its versions | `package_id` |
| `codeengine_package_create` | Create a new package with code | `name`, `description`, `code`, `functions` |
| `codeengine_package_update` | Update package metadata | `package_id`, `name`, `description` |
| `codeengine_package_delete` | Delete a package | `package_id` |
| `codeengine_version_get` | Get version detail with code | `package_id`, `version` |
| `codeengine_version_create` | Create a new version with updated code | `package_id`, `code`, `functions` |
| `codeengine_version_update` | Update version metadata and functions | `package_id`, `version`, `functions` |
| `codeengine_version_delete` | Delete an unreleased version | `package_id`, `version` |
| `codeengine_version_release` | Release/publish a version | `package_id`, `version` |
| `codeengine_health_check` | Verify Code Engine API connectivity | — |

---

## Language Support

| Language | Value | Notes |
|----------|-------|-------|
| JavaScript | `JAVASCRIPT` | 207 functional packages. Uses `const codeengine = require("codeengine")` for internal API calls. |
| Python | `PYTHON` | 36 functional packages. Uses `requests`, `json`, `pandas` etc. Private helpers prefixed with `_`. |

Environment is always `LAMBDA`.

---

## Category Breakdown (from 243 functional packages)

| Category | Functions | Key Patterns |
|----------|-----------|--------------|
| **Data Ops** | 1,292 | `codeengine.sendRequest()` for internal Domo API calls, SQL queries via `api/query/v1/execute`, dataset CRUD, metadata management |
| **Integrations** | 138 | External API calls via `axios`/`fetch`, `ACCOUNT` type for OAuth tokens (Okta, AirTable, MS Graph, Google Sheets) |
| **Utilities** | 124 | Math operations, object manipulation, CSV conversion, date parsing, string formatting |
| **Notifications** | 100 | Email via social API, Buzz channel posting, Teams channel webhooks, webhook triggers |

---

## Function Signature Patterns (from verified packages)

### Input Types by Frequency

| Type | Usage Count | Common Use |
|------|------------|------------|
| `text` | 2,223 | IDs, names, SQL queries, JSON strings, URLs |
| `number` | 435 | User IDs, counts, numeric parameters |
| `object` | 413 | Request bodies, config objects, complex structures |
| `ACCOUNT` | 154 | OAuth tokens for external integrations — always paired with `codeengine.getAccount()` |
| `boolean` | 119 | Flags, success indicators, toggle options |
| `person` | 113 | User picker in UI, user references |
| `dataset` | 109 | Dataset ID picker in UI |
| `decimal` | 85 | Floating point math, currency amounts |

### Output Types by Frequency

| Type | Usage Count | Common Use |
|------|------------|------------|
| `object` | 777 | Structured API responses, complex results |
| `text` | 307 | String results, formatted output |
| `boolean` | 240 | Success/failure indicators |

Use `isList: true` on any type to accept/return arrays.

---

## Execution Flow — New Package

### Step 1: Plan the Function

Determine what the function needs to do:

| Function Type | Entry Point Pattern | Use Case |
|---------------|-------------------|----------|
| Internal Domo API | `class Helpers { static async handleRequest(...) }` | Dataset ops, user management, workflow automation |
| External integration | `async function listRecords(account, ...) { ... }` | Okta, AirTable, MS Graph, Google Sheets |
| Notification | `function sendEmail(to, subject, body) { ... }` | Email, Buzz messages, Teams channel posts |
| Utility | `function add(a, b) { ... }` | Math, CSV conversion, object manipulation |

### Step 2: Create the Package

```
codeengine_package_create(
  name: "my-webhook-handler",
  description: "Handles incoming webhook events from Salesforce",
  code: "<base64 or inline JS>",
  functions: [{ name: "handler", description: "Main webhook entry point" }]
)
```

The API creates the package with an initial version (v1) in DRAFT state.

### Step 3: Test the Draft Version

Before releasing, verify:
- The code compiles without syntax errors
- Environment variables and dependencies are correctly referenced
- The function signature matches the expected trigger type

### Step 4: Release the Version

```
codeengine_version_release(
  package_id: "<package-id>",
  version: 1
)
```

Once released, the version is live and callable. Released versions cannot be modified — create a new version instead.

### Step 5: Verify Deployment

```
codeengine_package_get(package_id: "<package-id>")
```

Confirm the package shows the released version and the function endpoints are accessible.

---

## Update Workflow — New Version

To update a deployed function:

1. **Create a new version** with the updated code:
   ```
   codeengine_version_create(
     package_id: "<package-id>",
     code: "<updated code>",
     functions: [{ name: "handler", description: "Updated handler" }]
   )
   ```
   This creates version N+1 in DRAFT state.

2. **Test the draft** — verify the new code is correct.

3. **Release the new version:**
   ```
   codeengine_version_release(
     package_id: "<package-id>",
     version: <N+1>
   )
   ```

4. **Verify** — the package now serves the new version. Previous versions remain accessible but the latest released version is the default.

**Never modify a released version.** Always create a new version.

**Version maturity note:** 91 packages have 1 version, 74 have 2-3 versions, 58 have 4-10 versions, and 20 have 10+ versions. Mature production packages iterate heavily — plan for multiple version cycles.

---

## Function Manifest Reference

Every function requires a manifest entry with `name`, `displayName`, `description`, `inputs[]`, and `output`.

> **CRITICAL:** The `inputs[]` array is not optional. Without it, the CE Lambda receives zero arguments at runtime, even if `inputVariables` are passed. Every parameter your function accepts MUST be listed in `inputs`.

### Input/Output Types

| Type | Description | Used for |
|------|-------------|----------|
| `text` | String values | Most common — IDs, names, SQL, JSON strings |
| `object` | Complex structures | Request bodies, config objects |
| `number` | Integer values | User IDs, counts |
| `decimal` | Floating point | Math operations, amounts |
| `boolean` | True/false | Flags, success indicators |
| `dataset` | Dataset reference | Dataset ID picker in UI |
| `person` | User reference | User picker in UI |
| `group` | Group reference | Group picker in UI |
| `date` | Date value | Date picker in UI |
| `dateTime` | Date + time | Timestamp picker in UI |
| `time` | Time only | Time picker in UI |
| `duration` | Time span | Duration picker in UI |
| `FILE` | File reference | File upload in UI |
| `DIRECTORY` | Directory ref | Directory picker in UI |
| `ACCOUNT` | Account ref | Account picker — resolves via `codeengine.getAccount()` |

Use `isList: true` on any type to accept/return arrays.

### Manifest Entry Format

```json
{
  "name": "functionName",
  "displayName": "Human Readable Name",
  "description": "What this function does",
  "inputs": [
    {
      "name": "paramName",
      "displayName": "Parameter Label",
      "type": "text",
      "nullable": true,
      "isList": false
    }
  ],
  "output": {
    "name": "result",
    "displayName": "Result Label",
    "type": "object",
    "nullable": false,
    "isList": false
  }
}
```

### Naming Conventions (from 243 functional packages)

**Packages:** "DOMO {Domain}" for platform utilities (e.g., "DOMO DataSets", "DOMO Math", "DOMO Object Utilities"), descriptive name for workflows (e.g., "WorkflowBuilderBackend", "MajorDomo User Offboarding", "MaterialCleaningJS"), integration name for connectors (e.g., "Create PowerPoint", "Okta Connector").

**Functions:** camelCase in JS (`queryDatasetAndFlattenField`, `sendEmailToEmailAddress`), snake_case in Python (`get_spreadsheet_metadata`, `get_file_set`). Common verb prefixes: `get*`, `query*`, `send*`, `create*`, `add*`, `filter*`, `convert*`.

---

## Code Templates (from verified production packages)

### Template 1: Internal Domo API Helper Class (from WorkflowBuilderBackend)

The most common pattern for packages with many Domo API functions. Centralizes request handling and error checking in a static helper class.

```javascript
const codeengine = require('codeengine');

class Helpers {
  static async handleRequest(method, url, body = null, headers = {}) {
    const res = await codeengine.sendRequest(method, url, body, { headers });
    if (res.status >= 400) throw new Error(`${method} ${url}: ${res.status}`);
    return res.body ? JSON.parse(res.body) : null;
  }
}

async function getDataSetMetadata(dataSetId) {
  const url = `api/data/v3/datasources/${dataSetId}?part=core,permission,status,pdp,rowcolcount,certification,functions`;
  return Helpers.handleRequest('get', url);
}

async function addOwnerToDataset(dataset, owner) {
  const url = `api/data/v1/datasources/${dataset}/owners/${owner}`;
  try {
    await Helpers.handleRequest('put', url);
    return true;
  } catch {
    return false;
  }
}

module.exports = { getDataSetMetadata, addOwnerToDataset };
```

**Manifest:**
```json
[
  {
    "name": "getDataSetMetadata",
    "displayName": "Get DataSet Metadata",
    "inputs": [
      { "name": "dataSetId", "type": "text" }
    ],
    "output": { "name": "result", "type": "object" }
  },
  {
    "name": "addOwnerToDataset",
    "displayName": "Add Owner To Dataset",
    "inputs": [
      { "name": "dataset", "type": "dataset" },
      { "name": "owner", "type": "person" }
    ],
    "output": { "name": "result", "type": "boolean" }
  }
]
```

### Template 2: External API with ACCOUNT Auth (from Okta/AirTable)

The `ACCOUNT` type is critical for external integrations. Always resolve it with `codeengine.getAccount()` to extract stored credentials (`properties.apikey`, `properties.domoAccessToken`, etc.).

```javascript
const codeengine = require('codeengine');
const axios = require('axios');

async function listRecords(account, baseId, tableId) {
  const acc = await codeengine.getAccount(account.id);
  const res = await axios.get(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
    headers: { Authorization: `Bearer ${acc.properties.apikey}` }
  });
  return res.data;
}

async function createRecord(account, baseId, tableId, fields) {
  const acc = await codeengine.getAccount(account.id);
  const res = await axios.post(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
    fields: fields
  }, {
    headers: {
      Authorization: `Bearer ${acc.properties.apikey}`,
      'Content-Type': 'application/json'
    }
  });
  return res.data;
}

module.exports = { listRecords, createRecord };
```

**Manifest:**
```json
[
  {
    "name": "listRecords",
    "displayName": "List Records",
    "inputs": [
      { "name": "account", "type": "ACCOUNT" },
      { "name": "baseId", "type": "text" },
      { "name": "tableId", "type": "text" }
    ],
    "output": { "name": "result", "type": "object" }
  },
  {
    "name": "createRecord",
    "displayName": "Create Record",
    "inputs": [
      { "name": "account", "type": "ACCOUNT" },
      { "name": "baseId", "type": "text" },
      { "name": "tableId", "type": "text" },
      { "name": "fields", "type": "object" }
    ],
    "output": { "name": "result", "type": "object" }
  }
]
```

### Template 3: Dataset SQL Query (from MaterialCleaningJS)

Direct SQL querying against Domo datasets using the query execution API.

```javascript
const codeengine = require('codeengine');

async function queryWithSql(datasetId, sql) {
  const res = await codeengine.sendRequest('POST', `api/query/v1/execute/${datasetId}`, { sql });
  return JSON.parse(res.body);
}

async function queryDatasetAndFlattenField(datasetId, field) {
  const sql = `SELECT ${field} FROM table`;
  const rows = await queryWithSql(datasetId, sql);
  return [...new Set(rows.map((item) => item[field]))];
}

module.exports = { queryWithSql, queryDatasetAndFlattenField };
```

**Manifest:**
```json
[
  {
    "name": "queryWithSql",
    "displayName": "Query With SQL",
    "inputs": [
      { "name": "datasetId", "type": "text" },
      { "name": "sql", "type": "text" }
    ],
    "output": { "name": "result", "type": "object" }
  },
  {
    "name": "queryDatasetAndFlattenField",
    "displayName": "Query Dataset And Flatten Field",
    "inputs": [
      { "name": "datasetId", "type": "text" },
      { "name": "field", "type": "text" }
    ],
    "output": { "name": "result", "type": "text", "isList": true }
  }
]
```

### Template 4: Email & Notifications (JS)

```javascript
const codeengine = require('codeengine');

function sendEmailToEmailAddress(subject, message, emailAddress) {
  const body = {
    parameters: {
      subject: subject,
      text: message,
      recipientsUserIds: [],
    },
  };
  const url = `/api/social/v3/messages/plainText/send?route=recipients&method=EMAIL&recipients=${emailAddress}`;

  return codeengine.sendRequest("post", url, body, null, null)
    .then(() => true)
    .catch((reason) => { console.log(reason); return false; });
}

function sendBuzzMessage(channelId, message) {
  const body = {
    domoSystemId: "CARD",
    botRef: null,
    content: { text: message, tags: [] },
  };
  const url = `api/buzz/v1/channels/${channelId}/messages?mentionsGrantPermission=true`;

  codeengine.sendRequest("post", url, body, null, null).catch(console.log);
  return true;
}

module.exports = { sendEmailToEmailAddress, sendBuzzMessage };
```

**Manifest:**
```json
[
  {
    "name": "sendEmailToEmailAddress",
    "displayName": "Send Email To Email Address",
    "inputs": [
      { "name": "subject", "type": "text" },
      { "name": "message", "type": "text" },
      { "name": "emailAddress", "type": "text" }
    ],
    "output": { "name": "result", "type": "boolean" }
  },
  {
    "name": "sendBuzzMessage",
    "displayName": "Send Buzz Message",
    "inputs": [
      { "name": "channelId", "type": "text" },
      { "name": "message", "type": "text" }
    ],
    "output": { "name": "result", "type": "boolean" }
  }
]
```

### Template 5: Python External API (from Filesets API)

```python
import codeengine
import requests

def get_file_set(base_url, file_set_id, developer_token):
    url = f"https://{base_url}/api/files/v1/filesets/{file_set_id}"
    headers = {"X-DOMO-Developer-Token": developer_token}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def upload_file_to_set(base_url, file_set_id, file_name, file_content, developer_token):
    url = f"https://{base_url}/api/files/v1/filesets/{file_set_id}/files"
    headers = {
        "X-DOMO-Developer-Token": developer_token,
        "Content-Type": "application/octet-stream",
        "X-DOMO-File-Name": file_name
    }
    response = requests.post(url, headers=headers, data=file_content)
    response.raise_for_status()
    return response.json()
```

**Manifest:**
```json
[
  {
    "name": "get_file_set",
    "displayName": "Get File Set",
    "inputs": [
      { "name": "base_url", "type": "text" },
      { "name": "file_set_id", "type": "text" },
      { "name": "developer_token", "type": "text" }
    ],
    "output": { "name": "result", "type": "object" }
  },
  {
    "name": "upload_file_to_set",
    "displayName": "Upload File To Set",
    "inputs": [
      { "name": "base_url", "type": "text" },
      { "name": "file_set_id", "type": "text" },
      { "name": "file_name", "type": "text" },
      { "name": "file_content", "type": "text" },
      { "name": "developer_token", "type": "text" }
    ],
    "output": { "name": "result", "type": "object" }
  }
]
```

### Template 6: Python Math & Utilities (from DOMO Math)

```python
def add(a: float, b: float) -> float:
    if a is None or b is None:
        raise ValueError("Parameters 'a' and 'b' are required")
    return float(a) + float(b)

def divide(a: float, b: float) -> float:
    if b == 0:
        raise ValueError("Division by zero is not allowed")
    return float(a) / float(b)
```

**Manifest:**
```json
[
  {
    "name": "add",
    "displayName": "Add",
    "inputs": [
      { "name": "a", "type": "decimal" },
      { "name": "b", "type": "decimal" }
    ],
    "output": { "name": "result", "type": "decimal" }
  }
]
```

**Python manifest note:** Functions prefixed with `_` are private helpers and should NOT be in the manifest. Only export public functions.

---

## Error Handling Patterns (63% of packages use try/catch)

### JavaScript — Common patterns

```javascript
// Pattern 1: Helper class with status check (recommended for multi-function packages)
class Helpers {
  static async handleRequest(method, url, body = null, headers = {}) {
    const res = await codeengine.sendRequest(method, url, body, { headers });
    if (res.status >= 400) throw new Error(`${method} ${url}: ${res.status}`);
    return res.body ? JSON.parse(res.body) : null;
  }
}

// Pattern 2: .catch with boolean return (email, buzz, simple ops)
return codeengine.sendRequest("post", url, body)
  .then(() => true)
  .catch((reason) => { console.log(reason); return false; });

// Pattern 3: .catch(console.error) — silent failure, returns undefined
return codeengine.sendRequest("get", url).catch(console.error);

// Pattern 4: Try-catch with fallback HTTP method (API quirks)
try {
  await codeengine.sendRequest("patch", url, data);
} catch (err) {
  await codeengine.sendRequest("put", url + "?updateMetadataOnly=true", data);
}

// Pattern 5: Error object return (for callers that need error details)
try {
  const res = await codeengine.sendRequest("delete", url);
  return { success: true };
} catch (err) {
  return { success: false, error: String(err.message || err) };
}

// Pattern 6: throw new Error() for input validation
if (!datasetId) throw new Error("datasetId is required");
```

### Python — Common patterns

```python
# Pattern 1: Input validation with ValueError
if not isinstance(param, str) or not param.strip():
    raise ValueError("param must be a non-empty string")

# Pattern 2: JSON parsing with error detail
try:
    data = json.loads(json_string)
except json.JSONDecodeError as e:
    raise ValueError(f"Invalid JSON: {str(e)}")

# Pattern 3: HTTP with raise_for_status()
response = requests.get(url, headers=headers, timeout=10)
response.raise_for_status()
return response.json()
```

### module.exports Patterns

```javascript
// Standard (most common) — named export object
module.exports = { func1, func2, func3 };

// Individual assignments (less common)
module.exports.func1 = func1;
module.exports.func2 = func2;
```

---

## Core API Patterns Quick Reference

| Pattern | When to Use | Example |
|---------|------------|---------|
| `codeengine.sendRequest(method, url, body)` | Internal Domo API calls (no auth needed, runs in instance context) | Dataset CRUD, user management, Buzz |
| `codeengine.getAccount(account.id)` | Resolve ACCOUNT parameter to get stored credentials | Extract `properties.apikey` or `properties.domoAccessToken` |
| `axios.get/post(url, { headers })` | External API calls with Bearer token auth | AirTable, Okta, MS Graph |
| `requests.get(url, headers=headers)` | Python external API calls | Filesets API, Google Sheets |

---

## API Details

**Base URL:** `https://{instance}.domo.com/api/codeengine/v2/`

**Authentication:** `X-DOMO-Developer-Token` header

**URL Pattern for invoking a deployed function:**
```
https://{instance}.domo.com/api/codeengine/v2/packages/{package_id}/versions/{version}/functions/{function_name}/execute
```

**Package lifecycle states:**
- `DRAFT` — editable, not yet callable via public endpoint
- `RELEASED` — immutable, live and callable

---

## PDCA Loop

After deploying a Code Engine function, verify it works:

1. **Plan** — Define the expected input/output for the function
2. **Do** — Create and release the package using the tools above
3. **Check** — Invoke the function with a test payload and verify the response:
   - For webhooks: send a test HTTP request to the function URL
   - For scheduled tasks: trigger a manual execution
   - For transformers: pass sample data and verify output shape
4. **Act** — If the function fails:
   - Check the function logs for errors
   - Create a new version with fixes (do not modify the released version)
   - Release the fix and re-verify

---

## Guardrails

- **Always release after testing.** Draft versions are not accessible externally.
- **Never modify released versions.** Create a new version instead.
- **Validate code before creating.** Syntax errors in the code field cause silent failures.
- **Use `codeengine.sendRequest()` for internal Domo API calls.** No auth needed — runs in instance context.
- **Use `codeengine.getAccount()` for external integrations.** Resolves ACCOUNT parameters to extract stored API keys and tokens.
- **Use the Helper class pattern for large packages.** Centralizes error handling and response parsing.
- **Keep functions small.** Code Engine has execution time limits. Long-running tasks should be broken into smaller functions.
- **Handle errors explicitly.** 63% of production packages use try/catch. Unhandled exceptions cause 500 responses with no useful error message.
- **Manifest `inputs` array is REQUIRED for parameter passing.** If you omit `inputs` from the manifest function definition, the CE Lambda will receive **zero arguments** at runtime — even if `inputVariables` are passed in the execution request. The function will execute but every parameter will be `undefined`. Always define `inputs` in the manifest.
- **Manifest types are lowercase.** The Domo API uses lowercase types: `text`, `object`, `number`, `boolean`, `decimal`, `person`, `dataset`, `ACCOUNT`. Do NOT use uppercase (`STRING`, `OBJECT`, `NUMBER`) — these are accepted by the MCP tool schema but the actual Domo manifest format requires lowercase.

---

## MCP Server Required

- **domo-codeengine** — for all Code Engine package and version management

---

## Memory

### Before executing — Build Context Discovery (REQUIRED)

This is a build skill. You MUST gather focused engagement context before planning the build.

**Step 1 — Determine the build target.** From the user's message and conversation context, identify EXACTLY what they want to build (e.g., "Finance OPEX variance ETL", "Sales pipeline dashboard", "Customer churn ML notebook"). If the target is unclear or ambiguous, **STOP and ask the user before proceeding**. Do not assume.

**Step 2 — Pull focused build context.** Call `memory_build_context` with:
- `account_id` from session context
- `engagement_id` from session context (if available)
- `build_type`: `"app"`
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
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: function name, package ID, trigger type (timer/webhook/manual), endpoint URL, purpose, dependencies.

## Related Skills

- **AppDB Manager** (Build) — Code Engine functions often read/write AppDB collections
- **ProCode App Builder** (Build) — apps can invoke Code Engine functions as backend services
- **App Orchestrator** (Build) — routes "serverless function" requests to this skill
