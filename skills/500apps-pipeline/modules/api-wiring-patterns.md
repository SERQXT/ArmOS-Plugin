# API wiring patterns (canonical references)

Distilled from the portfolio audit of 33 built 500 Apps. Use when wiring MVP2 (stage J1) or connecting customer data (stage 12). The MCP tools (`domo-datasets`, `domo-appdb`, `domo-publish`) are the primary interface — this reference explains what the tools do under the hood and which implementation patterns to follow.

**When to load:** Stages **J1** (MVP2 build), **step 12** (wire customer data).

---

## 1. Canonical implementations (follow these, not ad-hoc approaches)

### UPS pattern — full-stack live wiring (most surface-rich)
- Datasets via `domo.get('/data/v1/<alias>')` with manifest `mapping`
- AppDB CRUD for all user interactions (approvals, notes, settings, flags)
- AI text generation via `domo.post('/api/ai/v1/text/generation', {...})`
- `domo.env.userId` and `domo.env.userName` for personalization
- **Use when:** the app needs all four surfaces (datasets + AppDB + AI + user env)

### Manulife pattern — queryWithSql + fixtures fallback
- Uses the `queryWithSql` package for parameterized SQL against datasets
- Detects `window.domo` and falls back to `fixtures.js` for local dev
- **Use when:** the app needs complex SQL queries against datasets, not just alias reads

### Fogo de Chao pattern — isDev fallback
- Production path queries dataset aliases; `isDev=true` branch uses sample placeholders
- AppDB for settings and ticket logs
- **Use when:** the app needs a clean dev/prod toggle

### Durhamlane pattern — DEMO flag scaffold (cleanest publish-ready)
- `js/api/domo.js` adapter with `DEMO = true` flag
- Commented-out `domo.get('/data/v1/<alias>')` + `fetch('/domo/datastores/v1/collections/...')` ready to activate
- Flip `DEMO` to `false` and the SQL layer is live
- **Use when:** building the mock-to-real migration path from the start

### J-and-J-Landing pattern — most thorough hybrid
- Two datasets + two AppDB collections fully wired
- Both `domo.get` for dataset reads and full AppDB CRUD (get/post/put/delete)
- **Use when:** the app needs bidirectional data (read from datasets, write to AppDB)

---

## 2. Mock-to-real migration checklist

When converting a seed-data MVP1 to a real-data MVP2:

| # | Check | Detail |
|---|-------|--------|
| 1 | Replace `window.SEED_DATA` imports | Wire `domo.get('/data/v1/<alias>')` calls where seeds were loaded |
| 2 | Add manifest `mapping` entries | Each dataset alias needs a `mapping` entry with `dataSetId` and `alias` |
| 3 | Use `mapping` not `datasetsMapping` | `datasetsMapping` is the old format — `mapping` is current |
| 4 | Add manifest `collections` for AppDB | Each collection needs `id` (the collection ID from `domo-appdb` MCP) |
| 5 | Handle loading states | Dataset reads are async — add shimmer/skeleton for each data-dependent surface |
| 6 | Handle empty states | Datasets may return 0 rows — show explicit "No data" messaging, not blank voids |
| 7 | Handle errors | `domo.get` can fail (401, 404, timeout) — wrap in try/catch with user-visible error states |
| 8 | Verify boot order | Data must load before components that depend on it render |
| 9 | Test with `procode_generate_mock` | Verify the manifest mappings work with generated mock data before deploying |
| 10 | Verify `domo.env` scopes | If using `userId`/`userName`, manifest must declare `scopes: ["data", "user"]` |

---

## 3. Risk checklist

| Risk | Detail | Mitigation |
|------|--------|------------|
| CSP blocking PDF generation | `pdfmake`/jsPDF in Domo iframe may be blocked by Content-Security-Policy | Smoke test PDF download in the published Domo iframe before declaring done |
| Raw `fetch` vs SDK | Using `fetch('/data/v1/...')` bypasses PDP-aware error handling | Always use `window.domo.get` / `window.domo.post` from ryuu.js |
| Placeholder dataset IDs | Manifest `mapping` entries with `YOUR_*_DATASET_ID` strings | Replace all placeholders before publish; verify with `procode_generate_mock` |
| Byte-identical repo copies | Same app source in two folders (e.g. UPS + Will/ups) — edits to one silently drift | Single-source the app; delete duplicates |
| `domo.env` empty | Without `scopes: ["data", "user"]` in manifest, `domo.env` returns nothing | Declare scopes in manifest; verify post-publish |
| External LLM endpoints | Apps calling non-Domo AI endpoints need OAuth proxy or manifest-level proxy | Use `/domo/ai/v1/text/generation` when possible; proxy external calls through Code Engine |
| Federated dataset latency | Snowflake/BigQuery-federated datasets can be slow on large queries | Use WHERE clauses; consider materialized views or ETL snapshots |

---

## 4. Human-only work (the agent must not attempt these)

1. **Provision actual datasetIds** — the customer's data team must publish datasets first; the agent wires the ID once it exists
2. **Build upstream Magic ETL or connectors** — data engineering work on the customer's instance
3. **Provision OAuth clients and API keys** for external APIs (Mapbox, LLM endpoints, etc.)
4. **Create PDP policies** in the Admin UI — agent can declare expected policies but creating + mapping AD groups is admin work
5. **Security review / MLR / IRB sign-off** for regulated apps (healthcare, financial services, pharma)
6. **Cross-instance dataset access requests** — federated connector auth is customer-owned
7. **Domo Cloud Amplifier or AI Studio enablement** — license + provisioning is CSM/admin work
8. **Production app publishing + page assignment** — adding to customer-visible pages and granting group access is admin work
9. **Pricing / packaging confirmation** for paid scopes — don't build workflow agents for paid-scope apps until SOW confirms
10. **Customer email/notification routing** — SMTP profile + recipient list decisions are customer-side

---

## 5. Dataset read patterns

### Simple alias read
```javascript
const data = await domo.get('/data/v1/my-alias');
```

### SQL query via alias
```javascript
const data = await domo.get('/data/v1/my-alias?sql=' + encodeURIComponent('SELECT * FROM table WHERE status = "active" LIMIT 100'));
```

### AppDB read
```javascript
const items = await domo.get('/domo/datastores/v1/collections/COLLECTION_ID/documents/');
```

### AppDB write
```javascript
await domo.post('/domo/datastores/v1/collections/COLLECTION_ID/documents/', { content: payload });
```

### AI text generation
```javascript
const response = await domo.post('/domo/ai/v1/text/generation', {
  prompt: 'Summarize the key findings...',
  input: JSON.stringify(contextData)
});
```

### User environment
```javascript
const userId = domo.env.userId;
const userName = domo.env.userName;
```
