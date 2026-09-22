# ID-remap manifest schema

Reference for the JSON manifest consumed by `instance-promote-cards-and-dataflows`.

## Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `source_profile` | string | yes | Go CLI profile name for the dev (source) instance. Must match an entry in `domo profile list`. |
| `target_profile` | string | yes | Go CLI profile name for the prod (target) instance. Must be different from `source_profile`. |
| `assets` | array | yes | Ordered list of assets to promote. Processed in order; promotion stops on first failure. |
| `id_remap` | object | no | ID substitution maps applied to every asset's JSON body. Can be omitted if no remapping is needed. |

## Asset object fields

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | yes | One of: `"dataflow"`, `"card"`, `"appstudio-app"`. `"page"` and `"dataset"` are not supported — see When NOT to use in SKILL.md. |
| `id` | string | yes | Source asset ID. Passed verbatim to `domo <type> get --id`. |
| `target_id` | string | no | Target asset ID. If present, the asset is updated (`domo <type> update --id <target_id>`). If absent, a new asset is created and the returned ID is recorded in `id_map.json`. |

## id_remap fields

| Field | Type | Required | Description |
|---|---|---|---|
| `dataset` | object | no | Map of `"<source-dataset-id>": "<target-dataset-id>"`. Applied as a string substitution across every asset's JSON body. |
| `account` | object | no | Map of `"<source-account-id>": "<target-account-id>"`. Applied the same way. |

## Example manifest (pseudocode — not valid JSON)

```
{
  "source_profile": "acme-dev",
  "target_profile": "acme-prod",
  "assets": [
    {
      "type": "dataflow",
      "id": "df-1234-abcd",
      "target_id": "df-5678-efgh"
    },
    {
      "type": "card",
      "id": "card-aaaa-1111"
    },
    {
      "type": "appstudio-app",
      "id": "app-bbbb-2222",
      "target_id": "app-cccc-3333"
    }
  ],
  "id_remap": {
    "dataset": {
      "ds-dev-0001": "ds-prod-0001",
      "ds-dev-0002": "ds-prod-0002"
    },
    "account": {
      "acct-dev-001": "acct-prod-001"
    }
  }
}
```

## CLI commands invoked per asset type

| Asset type | Fetch (source) | Create (target, no target_id) | Update (target, target_id present) |
|---|---|---|---|
| `dataflow` | `domo dataflow get --id <id> --json` | `domo dataflow create --body-file <f>` | `domo dataflow update --id <target_id> --body-file <f>` |
| `card` | `domo card get --id <id> --json` | `domo card create --body-file <f>` | `domo card update --id <target_id> --body-file <f>` |
| `appstudio-app` | `domo appstudio get --id <id> --json` | `domo appstudio create --body-file <f>` | `domo appstudio update --id <target_id> --body-file <f>` |

All commands use `${ARMOS_DOMO_CLI_PATH}` as the resolved binary path.
`domo profile use <profile>` is called before the fetch pass and again before
the create/update pass.
