---
name: code-engine
tier: 0
description: "Execute Domo Code Engine functions from inside custom apps via domo.post + packagesMapping contracts, with response envelope unwrapping and global package discovery. Trigger with 'packagesMapping', 'execute Code Engine function from app', 'domo.post code engine', 'CodeEngineClient', 'codeengine packagesMapping'. For building/deploying Code Engine functions in PS work use the code-engine-builder skill."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by upstream v2 authoring-code-engine-packages skill (domo-platform product-team). Deprecated by L10 lane of v2 rebuild. Body retained for reference."
audience: [code]
---

# Rule: Domo App Platform Code Engine (Toolkit-First)

Use a contract-first pattern for Code Engine calls.
In practice, prefer direct `domo.post('/domo/codeengine/v2/packages/{alias}', params)` when wiring app calls.

Use this skill for runtime invocation patterns inside app code, not package create/update orchestration.

## Working call pattern (`domo.post`)

```bash
npm install ryuu.js
```

```typescript
import domo from 'ryuu.js';

const response = await domo.post('/domo/codeengine/v2/packages/calculateTax', {
  amount: 1000,
  state: 'CA'
});
```

## Response parsing requirement

```typescript
// First integration pass: inspect exact response shape for this function
console.log('Code Engine response:', response);

const body = response?.body ?? response?.data ?? response;

// Some package contracts return nested envelopes:
// { response: { ... } } or { response: { response: { ... } } }
const unwrapResponse = (value: unknown) => {
  let current = value as any;
  let depth = 0;
  while (current && typeof current === 'object' && 'response' in current && depth < 6) {
    current = current.response;
    depth += 1;
  }
  return current;
};
const normalized = unwrapResponse(body);

// Handle common output shapes
const output =
  normalized?.output ??
  normalized?.result ??
  normalized?.value ??
  normalized;

if (typeof output === 'number') {
  // numeric output
} else if (typeof output === 'string') {
  // string output
} else if (output && typeof output === 'object') {
  // structured object output
} else {
  throw new Error('Code Engine returned no usable output');
}
```

## Manifest requirement: `packagesMapping` (with `s`)

Use `packagesMapping` and define full parameter/output contracts.

```json
{
  "packagesMapping": [
    {
      "name": "myPackage",
      "alias": "myFunction",
      "packageId": "00000000-0000-0000-0000-000000000000",
      "version": "1.0.0",
      "functionName": "myFunction",
      "parameters": [
        {
          "name": "param1",
          "displayName": "param1",
          "type": "decimal",
          "value": null,
          "nullable": false,
          "isList": false,
          "children": [],
          "entitySubType": null,
          "alias": "param1"
        }
      ],
      "output": {
        "name": "result",
        "displayName": "result",
        "type": "number",
        "value": null,
        "nullable": false,
        "isList": false,
        "children": [],
        "entitySubType": null,
        "alias": "result"
      }
    }
  ]
}
```

Version pinning rule:
- If the user expects a fixed package build, set `"version": "x.y.z"` explicitly in each `packagesMapping` entry.
- Do not leave `version` as `null` unless the user explicitly wants unpinned/latest behavior.

## Required contract disclosure to user

When recommending or generating Code Engine calls, the agent must explicitly tell the user:
- exact input parameter names, types, and `nullable` expectations
- expected output name, type, and shape (number/string/object)
- whether output is wrapped in a `response` envelope (and if nested envelopes are possible)

This is required so the user can build a matching Code Engine function and manifest contract.

## Error Handling Pattern

```typescript
async function executeFunction(alias: string, payload: Record<string, unknown>) {
  try {
    const response = await domo.post(`/domo/codeengine/v2/packages/${alias}`, payload);
    console.log('Code Engine response:', response);
    return response?.body ?? response?.data ?? response;
  } catch (error) {
    console.error(`Code Engine call failed for alias ${alias}`, error);
    throw error;
  }
}
```

## Discovering function names on global Domo packages

When calling a **Domo-provided global package** (e.g. DOMO Notifications, DOMO DataSets, DOMO Users),
the exported function names and their exact parameter signatures are not discoverable via the REST API
-- `GET /api/codeengine/v2/packages/{id}/versions/{v}` returns `"functions": []` for all global packages.

**How to find them:** navigate to the package source in the Domo UI:

```
https://{instance}.domo.com/codeengine/{packageId}
```

This opens the Code Engine editor showing the full JavaScript source for the package. Read it to find:
- Exact exported function names (e.g. `sendEmail`, `sendBuzzRequest`)
- Positional parameter names and order (Code Engine maps by **position**, not key name)
- Which parameters are optional / nullable

> **Why this matters:** guessing function names against the API returns 404 for every wrong name,
> giving no indication of what the correct name is. Without reading the source first, you will
> burn multiple round-trips and may need the user to paste the source manually.

### Example -- DOMO Notifications (`03ba6971-98d0-4654-9bfd-aa897816df33`)

Key functions found in source:

| Function | Parameters (positional) | Notes |
|---|---|---|
| `sendEmail` | `recipientEmails, subject, body, personRecipients, groupRecipients, attachments, attachment, includeReplyAll` | `recipientEmails` is a single comma-separated string, not an array |
| `sendEmailToListOfEmails` | `to, subject, body, attachments, attachment, includeReplyAll` | `to` is an array of strings |
| `sendBuzzRequest` | `channelId, message` | `channelId` must be a valid UUID |
| `sendExternalEmail` | `to, subject, body, attachments, attachment, includeReplyAll` | Validates against authorized domain whitelist |

> **Gotcha:** `sendEmail` takes `recipientEmails` as a plain string (e.g. `"user@example.com"`),
> not an array. Passing an array causes silent failure or incorrect routing.

## Checklist
- [ ] Read package source at `https://{instance}.domo.com/codeengine/{packageId}` before writing any call
- [ ] Exact function name confirmed from source (do not guess)
- [ ] Parameter names and types confirmed from source JSDoc comments
- [ ] Calls use `domo.post('/domo/codeengine/v2/packages/{alias}', params)` pattern
- [ ] Manifest uses `packagesMapping` (not `packageMapping`)
- [ ] `packagesMapping.version` is explicitly pinned when deterministic package behavior is required
- [ ] `packagesMapping.parameters` and `output` include full contract fields (`name`, `displayName`, `type`, `value`, `nullable`, `isList`, `children`, `entitySubType`, `alias`)
- [ ] Agent states input parameter names, types, and nullable status to user
- [ ] Agent states expected output name/type/shape to user
- [ ] First implementation logs response and validates real response shape
- [ ] Output parsing handles `body`/`data`/raw response shape and nested `response` envelopes
- [ ] Errors handled and surfaced to UI or logs

---

## API Reference

All endpoints are relative to `https://{instance}.domo.com`.

### Execute a Function

**POST** `/api/codeengine/v2/packages/{packageId}/versions/{version}/functions/{functionName}`

Executes a named function within a specific version. The `{functionName}` in the URL must match the function name as defined in the package manifest (case-sensitive).

**Request body:**

```json
{
  "inputVariables": {
    "param": "value to pass"
  },
  "settings": {
    "getLogs": true
  }
}
```

- `inputVariables` -- key/value map of function parameter names to their values
- `settings.getLogs` -- set `true` to receive `stdout` and `stderr` in the response

**Response:**

```json
{
  "executionId": "{uuid}",
  "packageId": "{packageId}",
  "version": "1.0.0",
  "functionName": "myFunction",
  "status": "SUCCESS",
  "settings": { "getLogs": true },
  "startedOn": "{timestamp}",
  "startedBy": "{userId}",
  "completedOn": "{timestamp}",
  "result": "the return value as a string",
  "stdout": {
    "log": ["line 1", "line 2", ""]
  },
  "stderr": {
    "log": [""]
  },
  "errorInformation": null
}
```

**Key fields:**
- `status` -- `"SUCCESS"` | `"FAILURE"` | `"ERROR"`
- `result` -- the function's return value serialized as a string
- `stdout.log` -- array of console.log / print lines
- `errorInformation` -- populated on failure with error details
- **Expected latency: 7-11 seconds** (LAMBDA cold start -- always use a 15s+ timeout)

### List Packages

**GET** `/api/codeengine/v2/packages`

Returns all packages visible to the authenticated user. Use this to discover package IDs, names, versions, and availability.

### Get a Package

**GET** `/api/codeengine/v2/packages/{packageId}`

Retrieves the full package including all versions.

**Response:**

```json
{
  "id": "{packageId}",
  "name": "My Package",
  "description": "What this package does",
  "language": "JAVASCRIPT",
  "environment": "LAMBDA",
  "availability": "PRIVATE",
  "owner": "{userId}",
  "versions": [
    {
      "version": "1.0.0",
      "description": "",
      "createdBy": "{userId}",
      "released": null,
      "functions": [],
      "configuration": {
        "accountsMapping": [],
        "mlModel": [],
        "externalPackageMapping": {}
      }
    }
  ],
  "packageSource": "CUSTOM",
  "createdOn": "{timestamp}",
  "updatedOn": "{timestamp}"
}
```

### Get a Specific Version

**GET** `/api/codeengine/v2/packages/{packageId}/versions/{version}`

Retrieves version details including full source code and function definitions.

**Response:**

```json
{
  "packageId": "{packageId}",
  "version": "1.0.0",
  "description": "",
  "code": "function myFunction(param) { ... }",
  "createdBy": "{userId}",
  "updatedBy": "{userId}",
  "createdOn": "{timestamp}",
  "updatedOn": "{timestamp}",
  "functions": [
    {
      "name": "myFunction",
      "displayName": "My Function",
      "description": "",
      "isPrivate": false,
      "inputs": [
        {
          "name": "param",
          "displayName": "param",
          "type": "text",
          "value": null,
          "nullable": false,
          "isList": false,
          "children": null,
          "entitySubType": null
        }
      ]
    }
  ],
  "configuration": {
    "accountsMapping": [],
    "mlModel": [],
    "externalPackageMapping": {}
  }
}
```

### Get Package Permissions

**GET** `/api/codeengine/v2/packages/{packageId}/permissions`

Returns who has access to the package and their permission levels.

**Response:**

```json
{
  "USER": [
    {
      "id": "{userId}",
      "name": "Display Name",
      "permissions": ["ADMIN", "DELETE", "READ", "WRITE", "EXECUTE", "SHARE"]
    }
  ],
  "GROUP": []
}
```

**Permission values:** `ADMIN`, `DELETE`, `READ`, `WRITE`, `SHARE`, `EXECUTE`, `READ_CONTENT`, `UPDATE_CONTENT`. All permissions are granted at the package level, not the instance level (except the Manage grant).

### codeengine Library

Code Engine packages have access to a built-in `codeengine` library in the global scope:

```javascript
const codeengine = require("codeengine");
```

- **`codeengine.sendRequest(method, url)`** -- authenticated calls to internal Domo APIs without credentials. Supports `get`, `post`, `put`, `delete`.
- **`codeengine.getAccount(accountId)`** -- retrieves stored Domo Account credentials for external API calls. Returns `account.properties` with credential fields.
- **`codeengine.axios(url, options)`** -- Axios for external HTTP requests.

Use `sendRequest` for internal Domo API calls (auth is injected automatically). Use `getAccount` for external service credentials. Never hardcode API keys in function code.

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) -- Riley Stahura's Domo AI skills collection.
