---
name: instance-promote-cards-and-dataflows
description: >
  Promotes dataflows, cards, and App Studio apps (appstudio) from a source
  Domo instance (dev) to a target Domo instance (prod) using a structured
  manifest with optional ID remapping for datasets and accounts. For each
  listed asset the skill fetches the JSON definition from the source profile
  via the Go CLI, applies any declared id_remap substitutions to the body,
  then creates or updates the asset on the target profile. On completion it
  emits an id_map.json artifact recording every source-id → target-id pair
  so downstream skills or manual audits can trace what was promoted.
  Page assets and dataset cloning are out of scope — those require Go CLI
  verbs that do not yet exist; use the future instance-promote T2 symphony
  once those gaps close.
tier: t1
bucket: data-transformation
status: draft
visibility: anyone
version: 1
created_by: alex.dengate@domo.com
created_at: "2026-06-07T00:00:00.000Z"
tools: []
---

# instance-promote-cards-and-dataflows

Promotes dataflows, cards, and App Studio apps from a dev Domo instance to
prod using a manifest-driven approach. Applies ID remapping to dataset and
account references so the promoted definitions resolve correctly in the target
environment.

## When to use

- "promote this dataflow + cards + page to prod" (cards/dataflows portion —
  see When NOT to use for page assets)
- "move the EMEA dashboard from dev to prod, remap dataset IDs"
- "ship the engagement artefacts to <prod-instance>"
- "copy the Magic ETL and its dependent cards over to the production instance"
- "sync the App Studio app from sandbox to production"

## When NOT to use

If the manifest contains a `page` asset type or requires dataset cloning
(`domo dataset clone --from-instance`), this skill cannot complete the
promotion. Stop and tell the user:

> "This manifest includes page assets or dataset cloning which require Go CLI
> verbs that do not exist yet (`domo page export`, `domo dataset clone
> --from-instance`). Use the future `instance-promote` T2 once those CLI
> gaps close. For now I can promote only the dataflows, cards, and App Studio
> apps in the manifest."

Do not attempt a partial promotion that leaves pages unlinked — that produces
a broken dashboard in the target instance. Either scope the manifest to
supported asset types only (with the user's explicit confirmation) or stop.

See `dataflow-spec-design` for building a fresh dataflow spec rather than
promoting an existing one, and `card-builder` for authoring a new card rather
than cloning.

## Body

### Manifest format

The caller provides a JSON manifest. Reference the full schema at
[`references/id-remap-manifest-schema.md`](references/id-remap-manifest-schema.md).

Minimal required shape:

```
{
  source_profile: <string>,   // domo profile name on dev instance
  target_profile: <string>,   // domo profile name on prod instance
  assets: [
    { type: "dataflow" | "card" | "appstudio-app", id: <string>, target_id?: <string> }
  ],
  id_remap: {
    dataset: { "<source-dataset-id>": "<target-dataset-id>", ... },
    account: { "<source-account-id>": "<target-account-id>", ... }
  }
}
```

Note: Do not include a fenced JSON/YAML payload block here — the schema
lives in the reference file to avoid T1 payload-leak. The above is
pseudocode notation only.

### Execution sequence

**Step 1 — Validate manifest**

Before touching either instance:
- Confirm `source_profile` and `target_profile` are distinct.
- Confirm every asset type is one of `dataflow`, `card`, or `appstudio-app`.
  If any asset has `type: "page"` or `type: "dataset"`, stop per "When NOT
  to use" above.
- Confirm `id_remap.dataset` entries look like UUIDs (format check only —
  live resolution happens during the actual fetch).

**Step 2 — Fetch from source**

For each asset in the manifest, fetch its JSON definition using the Go CLI
(`${ARMOS_DOMO_CLI_PATH}`). Switch to the source profile first:

```
domo profile use <source_profile>
domo dataflow get  --id <id> --json   # for type: "dataflow"
domo card get      --id <id> --json   # for type: "card"
domo appstudio get --id <id> --json   # for type: "appstudio-app"
```

Capture the JSON output. If any fetch returns a non-zero exit code or empty
body, stop the whole promotion and report which asset failed — do not
attempt a partial promotion.

**Step 3 — Apply ID remap**

For each fetched JSON body:
- Walk the document and replace every occurrence of a `id_remap.dataset`
  source key with its target value.
- Replace every occurrence of an `id_remap.account` source key with its
  target value.
- String-match only — do not attempt semantic parsing of the JSON structure.
  The Go CLI returns canonical JSON so exact-string replacement is reliable.

**Step 4 — Create or update on target**

Switch to the target profile:

```
domo profile use <target_profile>
```

For each asset, determine whether to create or update:
- If `target_id` is present in the manifest entry, run an update command
  using that ID.
- If `target_id` is absent, run a create command and capture the new ID
  returned by the CLI.

CLI commands:

```
domo dataflow create  --body-file <tmp>.json   # create path
domo dataflow update  --id <target_id> --body-file <tmp>.json   # update path

domo card create  --body-file <tmp>.json
domo card update  --id <target_id> --body-file <tmp>.json

domo appstudio create --body-file <tmp>.json
domo appstudio update --id <target_id> --body-file <tmp>.json
```

Write the remapped JSON to a temporary file before passing to `--body-file`
so the CLI receives clean input.

**Step 5 — Emit id_map.json**

After all assets are processed, write `id_map.json` to the working directory:

```
{
  "promoted_at": "<ISO timestamp>",
  "source_profile": "<value>",
  "target_profile": "<value>",
  "assets": [
    { "type": "<type>", "source_id": "<id>", "target_id": "<id>", "action": "created" | "updated" }
  ]
}
```

Report the artifact path and the full table to the user so they can
cross-reference with the manifest and verify counts.

**Step 6 — Profile hygiene**

After the promotion, switch back to the source profile (or whichever profile
the user was on before the run). Do not leave the target profile as the
active profile without asking the user.

## Design principles

- **Manifest-first.** The caller declares intent in the manifest; this skill
  executes it. Do not infer what the user probably meant — ask if the
  manifest is ambiguous.
- **All-or-nothing within a run.** If any step fails, report the failure
  immediately and stop. Do not create partial state in the target instance.
  A half-promoted dashboard is harder to diagnose than a clean failure.
- **Temp-file hygiene.** Write remapped JSON to a named temp file
  (e.g. `promote_<asset_type>_<id>.json`) and delete it after the CLI call
  succeeds. If the CLI call fails, leave the file in place and tell the user
  where it is for debugging.
- **Go CLI only.** Every Domo API call goes through the Go CLI
  (`${ARMOS_DOMO_CLI_PATH}`). Do not use Ryuu or raw HTTP calls. Ryuu is
  auth substrate only — it is not a tools surface.
- **Profile switching is explicit.** Call `domo profile use` at the start of
  the fetch pass and again at the start of the create/update pass. Do not
  assume the active profile is the correct one.
- **Emit the artifact.** Always produce `id_map.json`. Downstream skills
  (e.g. `card-builder` for post-promotion verification) and engineers doing
  manual audits depend on this record.
