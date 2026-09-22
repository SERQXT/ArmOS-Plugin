---
name: code-engine-update
tier: 0
description: "Update Domo Code Engine packages through CLI-driven versioned lifecycle workflows with compatibility checks and manifest drift sync. Create new versions, release versions, and delete packages. Trigger with 'update code engine', 'new code engine version', 'code engine update package', 'release version', 'delete package', 'code engine version'."
maturity: alpha
deprecated: true
deprecation_note: "Superseded by upstream v2 authoring-code-engine-packages skill (domo-platform product-team). Deprecated by L10 lane of v2 rebuild. Body retained for reference."
audience: [code]
---

# Code Engine Package Update (CLI)

Use this skill for package update/version workflows and safe contract evolution.

## Intent

This skill covers:

- update existing package code
- create a new version on an existing package id
- release a version to production
- delete packages and versions
- detect and handle mapping drift between package and app manifest
- validate datatype contract stability

For app-runtime invocation code, use `~/.agents/skills/code-engine/SKILL.md`.

## Primary Execution Path

Prefer `community-domo-cli`:

```bash
community-domo-cli --instance <instance> code-engine update-version <package_id> <version> --body-file payload.json
```

Fallback endpoint pattern:

```http
POST /api/codeengine/v2/packages
```

with `id` and `version` set in body for versioned update behavior.

## Release Safety Rule

Hard rule: never call any Code Engine release endpoint unless the user explicitly says **"release"**.

- Do not infer release from context.
- Do not release as part of "finish", "publish", or "make it work".
- If release appears necessary, stop and ask for explicit release approval first.

## Update/New-Version Behavior

Preferred create/update model:

1. Create a new package: `POST /api/codeengine/v2/packages`
2. Create a new version of an existing package: also `POST /api/codeengine/v2/packages` with `id` and `version` (for example `1.0.1`) in the request body, including code/manifest payload.
3. Update an existing package version: `PUT /api/codeengine/v2/packages/{id}/versions/{version}`
4. If update fails because the target version is deployed/immutable, create a new version and then update that new version.

Execution notes:

- For new-version creation, prefer creating the version with full code+manifest payload immediately.
- Use `PUT` for subsequent changes to that specific version.

Always emit resulting `packageId` and `version` for downstream manifest sync.

## Contract Safeguards

Before update publish:

- compare existing function aliases vs proposed aliases
- compare parameter names/types/nullability
- compare output shape/type
- flag breaking changes (removed required params, incompatible type changes)

When breaking change is intentional, require explicit migration note in generated output.

## Drift Handling

After update:

- compare `manifest.json packagesMapping` against returned package id/version
- sync `packageId`, `version`, and parameter/output contracts when drift detected
- keep mapping aliases stable unless user requested rename

## Checklist

- [ ] Correct update path selected (existing vs versioned)
- [ ] Input/output datatype contracts validated
- [ ] Breaking changes flagged clearly
- [ ] Manifest `packagesMapping` drift checked and synchronized
- [ ] Output includes updated package id/version and contract summary

---

## API Reference

All endpoints are relative to `https://{instance}.domo.com`.

### Update Package Code

**PUT** `/api/codeengine/v2/packages/{packageId}/versions/{version}`

Updates the code and manifest for an existing version. Use this for incremental changes to a specific version that has not been released.

If the target version is deployed/immutable, create a new version instead (see below).

### Create a New Version

**POST** `/api/codeengine/v2/packages`

Use the same body shape as package creation, but include the existing `id` and the new `version` number. Version numbers follow semantic versioning and can be user-specified -- the UI provides a default (e.g., `1.0.1`) but you can set any valid semver string. New versions can be copied from any existing version.

```json
{
  "id": "{packageId}",
  "name": "My Package",
  "description": "What this package does",
  "language": "JAVASCRIPT",
  "environment": "LAMBDA",
  "version": "1.0.1",
  "code": "// updated source code...",
  "manifest": {
    "functions": [ ... ],
    "configuration": { "accountsMapping": [] }
  }
}
```

After saving, verify the new version with:

**GET** `/api/codeengine/v2/packages/{packageId}/versions/{newVersion}`

### Release a Version

**POST** `/api/codeengine/v2/packages/{packageId}/versions/{version}/release`

Marks a version as released. No request body required.

**Response:**

```json
{
  "packageId": "{packageId}",
  "version": "1.0.1",
  "createdBy": "{userId}",
  "updatedBy": "{userId}",
  "releasedOn": "{timestamp}",
  "createdOn": "{timestamp}",
  "updatedOn": "{timestamp}",
  "functions": [],
  "configuration": {
    "accountsMapping": [],
    "mlModel": [],
    "externalPackageMapping": {}
  }
}
```

- `releasedOn` -- set to the release timestamp (was `null` before release)
- **Expected latency: ~9 seconds** (compilation/packaging step)

> **Important:** Deployed packages cannot be deleted. Once a package is released, treat it as permanent infrastructure. Plan package names, function signatures, and versioning carefully before releasing.

### Delete a Specific Version

**DELETE** `/api/codeengine/v2/packages/{packageId}/versions/{version}`

Deletes a single version. Use this to clean up old draft versions after releasing a new one.

**Response:** `1` (integer) on success.

> Do not delete a released version that is actively in use by other Domo features.

### Delete a Package

**DELETE** `/api/codeengine/v2/packages/{packageId}`

Permanently deletes the entire package and all its versions.

**Response:** `1` (integer) on success.

> This endpoint works on unreleased packages. Once a package has been released and deployed, deletion appears to be blocked by Domo. Treat deployed packages as permanent.

### Typical Update Workflows

**Edit, release, clean up old version:**

```
1. POST /api/codeengine/v2/packages   (updated code, id + new version in body)
   -> new version (e.g. "1.0.1") returned

2. POST /api/codeengine/v2/packages/{packageId}/versions/1.0.1/release
   -> wait ~9s

3. DELETE /api/codeengine/v2/packages/{packageId}/versions/1.0.0
   -> clean up the old draft
```

**Full teardown (unreleased packages only):**

```
DELETE /api/codeengine/v2/packages/{packageId}
-> removes package + all versions in one call
```

### Scalability and Edge Cases

- **Execution timeout:** 90s hard limit; treat 60s as practical ceiling -- break long work into smaller units or delegate to Workflows
- **Cold start:** 3-5s for first invocation, up to 11s for Python with heavy imports -- always design UI with loading states
- **Memory:** Design for <512MB working set; filter data at the API layer, chunk large operations
- **Payload limits:** Treat 5MB as a ceiling for inputs and outputs
- **Manual rollback only:** No automatic rollback on bad release; maintain a changelog comment at the top of each package and test drafts before releasing
- **No persistent connections:** Each invocation is stateless; use datasets for persistence

## Source

Adapted from [stahura/domo-ai-vibe-rules](https://github.com/stahura/domo-ai-vibe-rules) -- Riley Stahura's Domo AI skills collection.
