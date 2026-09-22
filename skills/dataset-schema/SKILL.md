---
name: dataset-schema
tier: 0
description: "Pull the exact, authoritative column + data-type schema of any Domo dataset on any instance via the query-execute API, using the bin/dataset-schema helper. Use this instead of the natural-language SQL tool whenever you need a reliable, complete schema. Trigger with 'dataset schema', 'pull the schema', 'what columns', 'column types', 'describe dataset', 'schema from datasources URL', 'details page schema'."
maturity: stable
audience: [code]
---

# Dataset schema (authoritative)

## When to use

Any time you need the **real** columns and types of a Domo dataset — e.g. "pull
the schema from this `/datasources/<id>/details/...` URL", "what columns does X
have", building beast modes/queries against a dataset, or writing an app's data
layer.

**Do not use `mcp__domo-*__domo_sql_query` to read a schema.** That tool is a
natural-language-to-SQL planner backed by a semantic/beast-mode model: it
*infers* columns, silently swaps requested columns for ones it "knows", and will
return an incomplete or wrong column list. (Observed on
`GenericClientDataSourceSummary`: the planner reported ~14 columns; the real
dataset has **275**.) Use the direct API below instead.

## Fast path: the helper script

The script is bundled beside this `SKILL.md` (so it ships with the skill via
`sync-skills.sh`). This project also symlinks it as `bin/dataset-schema`. Either
invocation works:

```bash
bin/dataset-schema <dataset-id>                       # via the project bin/ symlink
.claude/skills/dataset-schema/dataset-schema <id>     # bundled path (always present after sync)

bin/dataset-schema <details-page-url>      # parses instance + id from the URL
bin/dataset-schema -i acme.domo.com <id>   # any instance
bin/dataset-schema -j <id>                 # JSON: [{ "name", "type" }, ...]
```

It finds the project root (and `.env`) by climbing for a `.mcp.json` / `.env` /
`.git` marker, so it works from either location.

- Output: `column<TAB>type` on stdout (types: `LONG`, `STRING`, `DATETIME`,
  `DOUBLE`, …); a `<host>  <id>  (token: $VAR)` + column-count line on stderr.
- Pipe-friendly: `bin/dataset-schema <id> 2>/dev/null | grep -i date`.

## Works on any instance (token resolution)

The script loads `.env` and picks a developer token by convention, first match
wins:

1. `--token / -t <value>`
2. `$DOMO_SCHEMA_TOKEN`
3. `$DOMO_<SUBDOMAIN>_DEVELOPER_TOKEN`  — e.g. `DOMO_WINGS_TRAVEL_DEVELOPER_TOKEN`
4. `$DOMO_<FIRST-SEGMENT>_DEVELOPER_TOKEN` — e.g. `DOMO_WINGS_DEVELOPER_TOKEN` (existing `.env`)
5. `$DOMO_DEVELOPER_TOKEN`

To support a new instance, add its token to `.env` under the matching name, e.g.
`DOMO_SIMPLYTHANKYOU_DEVELOPER_TOKEN=...` for `simplythankyou-co-uk-1.domo.com`.
Generate the token in that instance: **Admin → Authentication → Access Tokens**.
Never print or commit the token — the script only ever echoes the *variable
name*, never the value.

## Under the hood (raw API)

```
POST https://<instance>/api/query/v1/execute/<datasetId>
Header: X-DOMO-DEVELOPER-TOKEN: <developer-token>
Body:   {"sql": "SELECT * FROM table LIMIT 1"}
```

The response is an object whose `columns` array (names) is **index-aligned**
with its `metadata` array (each entry has a `type`). This is the same source the
dataset details page reads, so it is exact and complete. `FROM table` is the
correct alias for the execute endpoint. `numColumns` / `numRows` are also
returned. Use `-j` to emit the zipped `name`/`type` pairs as JSON.

## Notes

- Read-only: `LIMIT 1` is a cheap probe (usually served from cache), it does not
  scan the dataset.
- Auth/URL problems surface as a non-JSON (HTML/401) body — the script reports
  that on stderr and exits non-zero rather than printing a bogus schema.
- This skill and its script live in the ArmOS source at
  `domo-platform/skills/dataset-schema/`, so a clean `bin/sync-skills.sh` rebuild
  reproduces both. `sync-skills.sh` copies the skill directory whole (SKILL.md +
  the bundled `dataset-schema` script); re-create the `bin/` symlink if you want
  the short invocation.
