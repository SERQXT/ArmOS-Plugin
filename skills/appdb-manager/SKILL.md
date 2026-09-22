---
name: appdb-manager
tier: 1
description: "Provision and manage Domo AppDB collections and documents via the domo-appdb MCP — for app state, preferences, configuration, and small document storage. Trigger with 'AppDB', 'appdb', 'create an AppDB collection', 'set up app data storage', 'store app settings', 'manage app data', 'persistent storage for my app', or any request involving AppDB CRUD operations. For developer-facing AppDBClient SDK reference (in-app code patterns) use the appdb skill instead."
maturity: alpha
audience: [delivery]
---

# AppDB Manager

Manage Domo AppDB collections and documents. AppDB is Domo's document store for application state, user preferences, configuration, and small-to-medium structured data. Uses the domo-appdb MCP server which wraps the `/api/datastores/v1` REST API.

## Triggers

- "create an AppDB collection"
- "store app settings in AppDB"
- "set up app data storage"
- "manage app preferences"
- "create a document store for the app"
- "I need persistent storage for my app"

---

## When to Use AppDB vs Datasets

| Criteria | AppDB | Datasets |
|----------|-------|----------|
| **Data type** | JSON documents, app state, preferences, config | Tabular data, analytics, large volumes |
| **Volume** | Small-to-medium (hundreds to low thousands of docs) | Large (millions of rows) |
| **Access pattern** | Read/write individual documents by ID | Bulk query with SQL, aggregations |
| **Schema** | Flexible (schemaless JSON) | Fixed columns and types |
| **Use case** | App settings, user prefs, form submissions, workflow state | Dashboards, cards, Beast Modes, ETL pipelines |
| **Query support** | Get by ID, list all, basic filtering | Full SQL via Adrenaline |
| **Who consumes it** | Custom apps (Pro-Code, App Studio) | Cards, dashboards, datasets, DataFlows |

**Rule of thumb:** If the data powers a card or dashboard, use a Dataset. If the data powers an app's internal state, use AppDB.

---

## MCP Tools Reference

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `appdb_collection_list` | List all AppDB collections | — |
| `appdb_collection_get` | Get a collection by ID | `collection_id` |
| `appdb_collection_create` | Create a new collection | `name`, `datastore_id` |
| `appdb_collection_update` | Update a collection's name | `collection_id`, `name` |
| `appdb_collection_delete` | Delete a collection and all documents | `collection_id` |
| `appdb_document_list` | List documents in a collection | `collection_id` |
| `appdb_document_get` | Get a document by ID | `collection_id`, `document_id` |
| `appdb_document_create` | Create a document in a collection | `collection_id`, `content` (JSON object) |
| `appdb_document_update` | Update a document | `collection_id`, `document_id`, `content` |
| `appdb_document_delete` | Delete a document | `collection_id`, `document_id` |
| `appdb_bulk_insert` | Insert multiple documents at once | `collection_id`, `documents` (array) |
| `health_check` | Verify AppDB API connectivity | — |

---

## API Details

**Base URL:** `https://{instance}.domo.com/api/datastores/v1`

**Authentication:** `X-DOMO-Developer-Token` header

**Key endpoints:**

| Action | Method | Endpoint |
|--------|--------|----------|
| List collections | GET | `/api/datastores/v1/collections` |
| Create collection | POST | `/api/datastores/v1/collections` |
| Get collection | GET | `/api/datastores/v1/collections/{id}` |
| Update collection | PUT | `/api/datastores/v1/collections/{id}` |
| Delete collection | DELETE | `/api/datastores/v1/collections/{id}` |
| List documents | GET | `/api/datastores/v1/collections/{id}/documents` |
| Create document | POST | `/api/datastores/v1/collections/{id}/documents` |
| Get document | GET | `/api/datastores/v1/collections/{id}/documents/{docId}` |
| Update document | PUT | `/api/datastores/v1/collections/{id}/documents/{docId}` |
| Delete document | DELETE | `/api/datastores/v1/collections/{id}/documents/{docId}` |
| Bulk insert | POST | `/api/datastores/v1/collections/{id}/documents/bulk` |

---

## Execution Flow — New Collection

### Step 1: Determine Storage Needs

Ask these questions:
- What data does the app need to persist? (settings, user prefs, form data, workflow state)
- How many documents are expected? (tens, hundreds, thousands)
- What is the read/write pattern? (read-heavy, write-heavy, balanced)
- Does the data need to be queried by cards/dashboards? (if yes, use a Dataset instead)

### Step 2: Design the Schema

Even though AppDB is schemaless, design a consistent document structure:

```json
{
  "type": "user_preference",
  "userId": "12345",
  "settings": {
    "theme": "dark",
    "defaultPage": "/dashboard",
    "notifications": true
  },
  "createdAt": "2026-03-16T00:00:00Z",
  "updatedAt": "2026-03-16T00:00:00Z"
}
```

### Step 3: Get the Datastore ID

Every collection belongs to a datastore. To find the datastore ID:

1. List existing collections: `appdb_collection_list()`
2. Look at any existing collection's `datastoreId` field
3. Use that `datastoreId` when creating new collections

If no collections exist yet, you may need to create one through the Domo UI first to establish the datastore, or check the app's manifest.json for the datastore reference.

### Step 4: Create the Collection

```
appdb_collection_create(
  name: "user-preferences",
  datastore_id: "<datastore-id>"
)
```

### Step 5: Seed Initial Documents (if needed)

For configuration collections, pre-populate with defaults:

```
appdb_bulk_insert(
  collection_id: "<collection-id>",
  documents: [
    { "key": "app_version", "value": "1.0.0" },
    { "key": "feature_flags", "value": { "newDashboard": true, "betaMode": false } },
    { "key": "default_filters", "value": { "dateRange": "last30days", "region": "all" } }
  ]
)
```

---

## Schema Design Patterns

### Pattern 1: Key-Value Configuration

Best for app-wide settings that apply to all users.

```json
// Collection: "app-config"
{ "key": "app_version", "value": "2.1.0" }
{ "key": "maintenance_mode", "value": false }
{ "key": "allowed_roles", "value": ["admin", "editor", "viewer"] }
```

**Access pattern:** Read by key on app load. Write rarely (admin only).

### Pattern 2: User Preferences

Best for per-user settings.

```json
// Collection: "user-prefs"
{
  "userId": "user-abc-123",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "dashboardLayout": "compact",
    "favoritePages": [12345, 67890]
  },
  "lastLogin": "2026-03-16T10:30:00Z"
}
```

**Access pattern:** Read/write per user session. Filter by `userId`.

### Pattern 3: Form Submissions / Workflow State

Best for capturing user input or tracking workflow progress.

```json
// Collection: "intake-requests"
{
  "requestId": "REQ-2026-001",
  "submittedBy": "user-abc-123",
  "status": "pending_review",
  "formData": {
    "projectName": "Q2 Dashboard Rebuild",
    "priority": "high",
    "deadline": "2026-04-15",
    "description": "Rebuild the executive dashboard with new KPIs"
  },
  "history": [
    { "action": "submitted", "by": "user-abc-123", "at": "2026-03-16T10:00:00Z" },
    { "action": "assigned", "by": "user-def-456", "at": "2026-03-16T11:00:00Z" }
  ],
  "createdAt": "2026-03-16T10:00:00Z",
  "updatedAt": "2026-03-16T11:00:00Z"
}
```

**Access pattern:** Create on form submit. Update on status change. List with filtering by status.

### Pattern 4: Cache / Materialized View

Best for pre-computed data that is expensive to recalculate.

```json
// Collection: "dashboard-cache"
{
  "cacheKey": "executive-kpis-2026-03",
  "computedAt": "2026-03-16T06:00:00Z",
  "ttlMinutes": 60,
  "data": {
    "totalRevenue": 4250000,
    "activeCustomers": 1847,
    "npsScore": 72
  }
}
```

**Access pattern:** Read on dashboard load. Write on schedule (Code Engine function).

---

## Manifest.json Wiring

To connect AppDB collections to a Pro-Code app, reference them in `manifest.json`:

```json
{
  "name": "My App",
  "version": "1.0.0",
  "size": { "width": 4, "height": 4 },
  "mapping": [
    {
      "dataSetId": "YOUR_DATASET_ID",
      "alias": "salesData"
    }
  ],
  "collections": [
    "user-preferences",
    "app-config",
    "intake-requests"
  ]
}
```

**Accessing collections from app code:**

```javascript
// Read all documents in a collection
const prefs = await domo.get('/domo/datastores/v1/collections/user-preferences/documents');

// Read a specific document
const doc = await domo.get('/domo/datastores/v1/collections/user-preferences/documents/DOC_ID');

// Create a document
await domo.post('/domo/datastores/v1/collections/user-preferences/documents', {
  userId: currentUser.id,
  preferences: { theme: 'dark' }
});

// Update a document
await domo.put('/domo/datastores/v1/collections/user-preferences/documents/DOC_ID', {
  preferences: { theme: 'light' }
});

// Delete a document
await domo.delete('/domo/datastores/v1/collections/user-preferences/documents/DOC_ID');
```

---

## Guardrails

- **AppDB is not for analytics.** If the data needs to power cards, Beast Modes, or SQL queries, use a Domo Dataset.
- **Design a consistent schema.** AppDB is schemaless, but inconsistent document shapes make the app fragile. Define the schema upfront.
- **Use meaningful collection names.** Collection names appear in the manifest and API calls. Use kebab-case descriptive names.
- **Bulk insert for seeding.** Use `appdb_bulk_insert` when creating multiple documents. Individual creates are slower and rate-limited.
- **Handle missing documents gracefully.** Always check for null/404 when reading a document by ID. Users may not have preferences set yet.
- **Collection deletion is irreversible.** Deleting a collection removes all documents. Always confirm before executing.

---

## MCP Server Required

- **domo-appdb** — for all AppDB collection and document operations

---

## Memory

### Before executing
- Call `memory_bundle` with `{account_id, engagement_id}` to load account context, engagement-working state, observations, and patterns. If no `engagement_id` is available, use `memory_recall` with scope `{account_id}` and intent `"prep"`.

### After executing
- Call `memory_remember` with scope `{account_id, engagement_id}`, hints `{layers: ["engagement-working"]}`, and content summarizing: collection name, collection ID, schema definition, documents created/updated, access patterns configured.

## Related Skills

- **ProCode App Builder** (Build) — apps that use AppDB for persistent storage
- **Code Engine Builder** (Build) — serverless functions that read/write AppDB
- **App Orchestrator** (Build) — routes "needs storage" requests through AppDB Manager first
