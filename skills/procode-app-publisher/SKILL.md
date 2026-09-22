---
name: procode-app-publisher
tier: 1
bucket: publish-and-share
description: "Publish and distribute Domo content — Pro-Code apps, publications, and app releases. Trigger with 'publish this app', 'validate my manifest', 'publish to Domo Everywhere', 'list publications', 'generate mock data', 'deploy procode app', 'download app source', or any request to distribute Domo apps or content to audiences."
maturity: alpha
---

# Pro-Code App Publisher — Distribute Domo Content

Validate, publish, and manage Pro-Code Domo apps and Domo Everywhere publications. Use this skill when the deliverable is shipping a built app to a customer instance or managing external audience publications.

## Scope

- **Pro-Code apps**: validate manifests, download source, publish/deploy apps, generate mock data
- **Domo Everywhere**: list and manage publications to external audiences and embed destinations

Use the `domo-publish` toolkit for publications and the `procode-apps` toolkit for Pro-Code app operations.

## MCP Tools

### Pro-Code Apps (`procode-apps`)

| Tool | Purpose |
|------|---------|
| `procode_design_list` | List available Pro-Code app designs |
| `procode_source_download` | Download the source of an existing app |
| `procode_manifest_validate` | Validate a `manifest.json` against the schema |
| `procode_publish` | Publish/deploy an app to the instance |
| `procode_generate_mock` | Generate mock data for a dataset wired in the manifest |

### Publications (`domo-publish`)

| Tool | Purpose |
|------|---------|
| `publication_list` | List all Domo Everywhere publications |
| `health_check` | Verify the publish service is reachable |

## Workflow: Validate and Publish a Pro-Code App

1. **List designs** — call `procode_design_list` to find the target app by name or ID
2. **Download source** — call `procode_source_download` if source inspection is needed
3. **Validate manifest** — call `procode_manifest_validate` with the `manifest.json` content; surface all errors to the user before proceeding
4. **Generate mock data** (optional) — call `procode_generate_mock` to produce sample dataset rows matching the manifest's dataset schema
5. **Publish** — call `procode_publish` once the manifest is valid and the user confirms
6. **Confirm** — report the deployed app name/ID and URL to the user

## Workflow: Audit Domo Everywhere Publications

1. Call `publication_list` to enumerate all publications
2. Surface publication names, audience types, and status to the user
3. Flag publications with no audiences or in error state

## Guardrails

- Always run `procode_manifest_validate` before `procode_publish` — a failed manifest will produce a broken app
- Do not call `procode_publish` without explicit user confirmation — publishing is visible to instance users immediately
- `procode_generate_mock` is safe to call without confirmation (read-only data generation)
- Surface manifest validation errors in full — don't summarize them

## Related Skills

- `procode-app-build` — scaffold and build Pro-Code app source
- `procode-app-fix` — diagnose and fix broken Pro-Code apps
- `domo-pages` toolkit — App Studio (non-Pro-Code) apps
