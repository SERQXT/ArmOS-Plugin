# Jupyter Builder Reference

## DS-0018 OAuth Handshake

When `jupyter_workspace_start` returns 403 with error code DS-0018:
1. Extract `jupyterAuthURL` from error response details
2. Validate URL starts with `https://` and contains the instance hostname
3. Instruct user: "Visit this URL in your browser while logged into Domo to complete OAuth"
4. After user confirms, retry `jupyter_workspace_start`

If `jupyterAuthURL` is missing or malformed, report: "Domo returned invalid OAuth URL. The user may need to open the workspace manually in the Domo UI first."

## Compute Tiers

| Tier | CPU | Memory | Use Case |
|------|-----|--------|----------|
| Exploration | 1 | 8 GB | Quick scripts, testing |
| Standard | 2 | 16 GB | Medium data processing |
| Production (default) | 4 | 32 GB | Production workloads (34% of workspaces) |
| Heavy | 8 | 64 GB | Large datasets, ML training |

## Kernel Selection

| Kernel | Adoption | When to Use |
|--------|----------|-------------|
| PYTHON_3_12 | 34% (default) | New workspaces, modern libraries |
| PYTHON_3_9 | 34% | Legacy dependencies requiring 3.9 |
| R_4_1 | <5% | R-specific analysis |

## Code Execution Patterns

### Read data from Domo dataset
```python
import domojupyter as domo
df = domo.read_dataframe("dataset-name-or-id")
```

### Write data back to Domo
```python
domo.write_dataframe(df, "output-dataset-name")  # Full replace semantics
```

### External API with credentials
```python
props = domo.get_account_property("account-name")
api_key = props.get("apikey")
```

## Output Dataset Cleanup (HARD REQUIREMENT)

Before deleting a workspace:
1. `jupyter_workspace_get` -> read `outputConfiguration`
2. `jupyter_workspace_update` with `outputConfiguration: []` to clear mappings
3. Only then `jupyter_workspace_delete`

Output datasets persist after workspace deletion and are orphaned.

## Bootstrap Timing

- Instance start: 30-90 seconds
- Poll interval: every 3-5 seconds
- Check: `instances[0].status === "RUNNING"`
- Default timeout: 8 hours with activity-based shutdown
