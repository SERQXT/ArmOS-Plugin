---
name: code-engine-create
tier: 0
description: "Create Domo Code Engine packages from CLI with deterministic payload contracts, automatic function parameter datatype mapping, and manifest packagesMapping follow-up. Share and manage package permissions after creation. Trigger with 'create code engine package', 'new code engine function', 'code engine create', 'share package', 'package permissions'."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by upstream v2 authoring-code-engine-packages skill (domo-platform product-team). Deprecated by L10 lane of v2 rebuild. Body retained for reference."
audience: [code]
---

# Code Engine Package Create (CLI)

Use this skill for package creation workflows, payload generation, and post-create mapping sync.

## Intent

This skill covers lifecycle operations that are out of scope for app-runtime invocation skills:

- create new package shell
- publish first package content payload
- infer and normalize function input/output datatypes
- update app `manifest.json` `packagesMapping` entries after create
- share packages and manage permissions after creation

For in-app function invocation patterns, use `~/.agents/skills/code-engine/SKILL.md`.

## Primary Execution Path

Prefer `community-domo-cli`:

```bash
community-domo-cli --instance <instance> code-engine create-package --body-file payload.json
```

Fallback endpoint when CLI path is unavailable:

```http
POST /api/codeengine/v2/packages
```

## Release Safety Rule

Hard rule: never call any Code Engine release endpoint unless the user explicitly says **"release"**.

- Do not infer release from context.
- Do not release as part of "finish", "publish", or "make it work".
- If release appears necessary, stop and ask for explicit release approval first.

## Required Payload Shape

```json
{
  "name": "My Package",
  "description": "Optional",
  "code": "// JS source",
  "environment": "LAMBDA",
  "language": "JAVASCRIPT",
  "manifest": {
    "functions": [
      {
        "name": "myFunction",
        "displayName": "My Function",
        "description": "",
        "inputs": [],
        "parameters": [],
        "output": {}
      }
    ],
    "configuration": {
      "accountsMapping": []
    }
  }
}
```

Create semantics:

- `POST /api/codeengine/v2/packages` creates a package or version payload target.
- For a new version on an existing package, include `id` and `version` in the create body and send full code/manifest payload.

## Datatype Mapping Rules (Auto-Map)

When generating `manifest.functions[].inputs/parameters/output`, apply these defaults:

- `payload`, `params`, `config`, `data`, `body`, `options` => `object`
- names indicating counts/limits/offsets => `decimal`
- boolean-like names (`is*`, `has*`, `enabled`, `required`) => `boolean`
- identifiers/text fields (`*id`, `name`, `query`, `message`) => `text`
- unknowns => `text`
- output default => `object`

Use the same type value for `type` and `dataType` when both fields are present.

## Post-Create Manifest Follow-up

After successful create, update app `manifest.json` `packagesMapping`:

- set `packageId` to created package id
- set `version` to returned version (or explicit target version)
- ensure each mapped function has matching `parameters` and `output`

If package ID/version changes, treat existing mapping as drift and sync immediately unless user requests otherwise.

## Post-Create Verification (Required)

After create, verify target package/version before declaring success:

1. `GET /api/codeengine/v2/packages/{packageId}`
2. Confirm target version exists and includes expected function names.
3. Confirm function inputs/outputs have expected datatypes and nullability.

If create returns an incomplete version shell (for example missing function contracts), hand off to update flow:

- `PUT /api/codeengine/v2/packages/{id}/versions/{version}` via `code-engine-update`
- Re-run verification after update

## Checklist

- [ ] CLI-first create attempted
- [ ] Endpoint fallback documented if CLI unavailable
- [ ] Payload contains `manifest.functions`
- [ ] Datatype mapping applied to each function input/output
- [ ] Release was **not** called unless user explicitly requested release
- [ ] Post-create verification completed on target package/version
- [ ] Incomplete create result routed to `code-engine-update` and re-verified
- [ ] `packagesMapping` updated in manifest after create
- [ ] Result includes package id/version for downstream steps

---

## API Reference

All endpoints are relative to `https://{instance}.domo.com`.

### Create a Package

**POST** `/api/codeengine/v2/packages`

Creates a new package at version `1.0.0`. Supports both JavaScript and Python.

**Language values:** `"JAVASCRIPT"` | `"PYTHON"`

**Request body (JavaScript):**

```json
{
  "name": "My Package",
  "description": "What this package does",
  "language": "JAVASCRIPT",
  "environment": "LAMBDA",
  "id": "",
  "code": "// Package: My Package\n// Purpose: Brief description\n// Author: Your Name\n// Created: YYYY-MM-DD\n\nfunction myFunction(param) {\n  console.log('Hello', param);\n  return param;\n}\n\nmodule.exports = {myFunction};",
  "manifest": {
    "functions": [
      {
        "name": "myFunction",
        "displayName": "My Function",
        "description": "",
        "output": null,
        "variables": [],
        "inputs": [
          {
            "name": "param",
            "displayName": "param",
            "type": "text",
            "value": null,
            "nullable": false,
            "isList": false
          }
        ]
      }
    ],
    "configuration": {
      "accountsMapping": []
    }
  }
}
```

**Python example code:**

```python
# Package: My Package
# Purpose: Brief description
# Author: Your Name
# Created: YYYY-MM-DD

def myFunction(param):
    """
    Brief description of what this function does.

    Args:
        param (str): Description of the parameter

    Returns:
        str: Description of the return value
    """
    print("Result: " + str(param))
    return "Result: " + str(param)
```

> Note: Python packages still include `module.exports = {myFunction};` at the end of the code body as part of the Domo template -- do not omit it.

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

**Key fields in response:**
- `id` -- save this as `{packageId}` for all subsequent operations
- `versions[0].version` -- always starts at `"1.0.0"`
- `availability` -- `"PRIVATE"` by default
- `released` -- `null` until explicitly released

**Important notes:**
- Language is set at creation and cannot be changed afterward. Create a new package to switch languages.
- Always include a header comment block explaining what the package does, who created it, and what each function does.

### Share Package (Permissions)

**GET** `/api/codeengine/v2/packages/{packageId}/permissions`

Returns who has access to the package.

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

### Function Input/Output Data Types

When configuring function parameters in the manifest, use these type values:

| Type | Notes |
|---|---|
| `Account` | Domo Account credential -- requires selecting a data provider; use with `codeengine.getAccount` |
| `Boolean` | true/false |
| `DataSet` | Domo dataset reference |
| `Date` | Date value |
| `Datetime` | Date + time value |
| `Decimal` | Floating point number |
| `Duration` | Time duration |
| `Group` | Domo group reference |
| `Number` | Integer |
| `Object` | Complex type -- Open (any data) or Defined (with named child properties) |
| `Person` | Domo user reference |
| `Text` | String |
| `Time` | Time value |

**List support:** Any type can be marked as `isList: true` to define it as an array of that type.

**Object type:**
- **Open Object** -- accepts any data structure; useful for external API responses with complex/variable shapes
- **Defined Object** -- explicitly defines child properties with their own names and types

**Output parameters:** Optional but strongly recommended -- allows return values to be mapped in Workflows. Only one output parameter is supported per function.

> Defining data types is required to save a function. Functions without typed inputs cannot be saved.

### Required Grants

Code Engine access is grant-controlled. Grants must be enabled by the Domo account team -- they are not self-service.

| Grant | Who needs it |
|---|---|
| **Manage Code Engine Packages** | Admins; grants full access to all packages in the instance |
| **Create Code Engine Packages** | Anyone who needs to create new packages |

Users with grants still need package-level permissions to interact with specific packages.

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) -- Riley Stahura's Domo AI skills collection.
