# Domo Toolkit API Patterns

> Reference guide for `@domoinc/toolkit` and `@domoinc/query` — the typed SDK layer used in React-based Domo custom apps. These replace raw `domo.get()`/`domo.post()` calls with structured, type-safe clients.

---

## Query Class (Recommended for Dataset Access)

The `Query` class from `@domoinc/query` is the preferred way to read datasets in React apps. It provides a fluent builder API that compiles to optimized SQL under the hood.

### Import

```typescript
import Query from '@domoinc/query';
```

### Basic Usage

```typescript
interface SalesRow {
  Region: string;
  Revenue: number;
  Date: string;
  Rep: string;
}

// Fetch all rows from a dataset alias (defined in manifest.json)
const data = await new Query()
  .select(['Region', 'Revenue', 'Date', 'Rep'])
  .fetch<SalesRow>('salesData');
// Returns: SalesRow[]
```

### Filtering

```typescript
// Single filter
const westData = await new Query()
  .select(['Region', 'Revenue'])
  .filter('Region', Query.EQ, 'West')
  .fetch<SalesRow>('salesData');

// Multiple filters (AND logic)
const highRevWest = await new Query()
  .select(['Region', 'Revenue', 'Rep'])
  .filter('Region', Query.EQ, 'West')
  .filter('Revenue', Query.GT, 50000)
  .fetch<SalesRow>('salesData');

// Filter operators
// Query.EQ   — equals
// Query.NE   — not equals
// Query.GT   — greater than
// Query.GTE  — greater than or equal
// Query.LT   — less than
// Query.LTE  — less than or equal
// Query.IN   — in array
// Query.LIKE — pattern match
```

### Aggregations

```typescript
interface RegionSummary {
  Region: string;
  TotalRevenue: number;
  DealCount: number;
  AvgDealSize: number;
}

const summary = await new Query()
  .select(['Region'])
  .sum('Revenue', 'TotalRevenue')
  .count('Region', 'DealCount')
  .avg('Revenue', 'AvgDealSize')
  .groupBy('Region')
  .fetch<RegionSummary>('salesData');
```

### Ordering and Limiting

```typescript
// Top 10 reps by revenue
const topReps = await new Query()
  .select(['Rep'])
  .sum('Revenue', 'TotalRevenue')
  .groupBy('Rep')
  .orderBy('TotalRevenue', 'descending')
  .limit(10)
  .fetch<{ Rep: string; TotalRevenue: number }>('salesData');
```

### Date Range Filtering

```typescript
// Last 30 days
const recentData = await new Query()
  .select(['Region', 'Revenue', 'Date'])
  .dateRange('Date', Query.LAST, 30, Query.DAYS)
  .fetch<SalesRow>('salesData');

// Specific date range
const q4Data = await new Query()
  .select(['Region', 'Revenue', 'Date'])
  .dateRange('Date', '2024-10-01', '2024-12-31')
  .fetch<SalesRow>('salesData');

// Date range units
// Query.DAYS, Query.WEEKS, Query.MONTHS, Query.YEARS
// Query.LAST, Query.THIS, Query.NEXT
```

### Multi-Dataset Queries

```typescript
// Query multiple datasets independently and combine in app logic
const [sales, targets] = await Promise.all([
  new Query()
    .select(['Region', 'Revenue'])
    .groupBy('Region')
    .sum('Revenue', 'TotalRevenue')
    .fetch<{ Region: string; TotalRevenue: number }>('salesData'),

  new Query()
    .select(['Region', 'Target'])
    .fetch<{ Region: string; Target: number }>('targetsData'),
]);

// Combine in app code
const combined = sales.map(s => ({
  ...s,
  Target: targets.find(t => t.Region === s.Region)?.Target ?? 0,
  Attainment: s.TotalRevenue / (targets.find(t => t.Region === s.Region)?.Target ?? 1),
}));
```

---

## SqlClient (Complex Queries)

For queries that exceed the `Query` builder's capabilities — complex JOINs, subqueries, window functions — use `SqlClient` with raw SQL.

### Import

```typescript
import { SqlClient } from '@domoinc/toolkit';
```

### Basic SQL Query

```typescript
interface RevenueByQuarter {
  Quarter: string;
  Region: string;
  Revenue: number;
}

const results = await SqlClient.query<RevenueByQuarter>(
  'salesData',
  `SELECT
     CONCAT('Q', QUARTER("Date")) AS Quarter,
     Region,
     SUM(Revenue) AS Revenue
   FROM table
   GROUP BY CONCAT('Q', QUARTER("Date")), Region
   ORDER BY Quarter, Region`
);
```

### Parameterized Queries (SQL Injection Prevention)

Never interpolate user input directly into SQL strings. Build WHERE clauses safely:

```typescript
// WRONG — vulnerable to SQL injection
const bad = await SqlClient.query('salesData',
  `SELECT * FROM table WHERE Region = '${userInput}'`);

// RIGHT — escape and validate
function sanitizeSqlString(input: string): string {
  return input.replace(/'/g, "''").replace(/;/g, '');
}

function buildWhereClause(filters: Record<string, string | number>): string {
  const conditions = Object.entries(filters).map(([col, val]) => {
    if (typeof val === 'number') {
      return `"${col}" = ${val}`;
    }
    return `"${col}" = '${sanitizeSqlString(String(val))}'`;
  });
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

// Usage
const where = buildWhereClause({ Region: userSelectedRegion, Year: 2024 });
const results = await SqlClient.query<SalesRow>(
  'salesData',
  `SELECT Region, Revenue, Rep FROM table ${where}`
);
```

### Pagination Pattern

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

async function fetchPaginated<T>(
  alias: string,
  baseQuery: string,
  page: number,
  pageSize: number
): Promise<PaginatedResult<T>> {
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    SqlClient.query<T>(alias, `${baseQuery} LIMIT ${pageSize} OFFSET ${offset}`),
    SqlClient.query<{ total: number }>(alias,
      `SELECT COUNT(*) AS total FROM (${baseQuery}) subq`),
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    data,
    total,
    page,
    pageSize,
    hasMore: offset + pageSize < total,
  };
}

// Usage
const page1 = await fetchPaginated<SalesRow>(
  'salesData',
  'SELECT Region, Revenue, Rep FROM table ORDER BY Revenue DESC',
  1,
  25
);
```

---

## AppDBClient (Collections)

`AppDBClient` provides typed access to Domo AppDB collections — NoSQL document stores defined in your manifest's `collections` array.

### Import

```typescript
import { AppDBClient } from '@domoinc/toolkit';
```

### Typed DocumentsClient

```typescript
interface UserPreference {
  userId: string;
  theme: 'light' | 'dark';
  dashboardLayout: string[];
  lastLogin: string;
}

// Create a typed client for a specific collection
const prefsClient = new AppDBClient.DocumentsClient<UserPreference>('UserPreferences');
```

### CRUD Operations

```typescript
// CREATE — add a new document
const newDoc = await prefsClient.create({
  content: {
    userId: 'user-123',
    theme: 'dark',
    dashboardLayout: ['sales', 'pipeline', 'forecast'],
    lastLogin: new Date().toISOString(),
  },
});
// Returns: { id: string, content: UserPreference }

// READ — get all documents
const allPrefs = await prefsClient.getAll();
// Returns: Array<{ id: string, content: UserPreference, owner: string }>

// READ — get a single document by ID
const doc = await prefsClient.get(documentId);

// UPDATE — replace document content
await prefsClient.update(documentId, {
  content: {
    ...doc.content,
    theme: 'light',
    lastLogin: new Date().toISOString(),
  },
});

// DELETE — remove a document
await prefsClient.delete(documentId);
```

### MongoDB-Style Queries

```typescript
// Query with filters
const darkThemeUsers = await prefsClient.query({
  filter: { 'content.theme': 'dark' },
});

// Query with sorting
const recentLogins = await prefsClient.query({
  filter: {},
  orderBy: 'content.lastLogin',
  order: 'DESC',
  limit: 10,
});

// Query with multiple conditions
const results = await prefsClient.query({
  filter: {
    'content.theme': 'dark',
    'content.userId': { $in: ['user-123', 'user-456'] },
  },
});
```

### Owner-Based Access Control Pattern

AppDB documents have an `owner` field set to the creating user's ID. Use this for row-level security:

```typescript
interface AuditEntry {
  action: string;
  target: string;
  timestamp: string;
  details: string;
}

const auditClient = new AppDBClient.DocumentsClient<AuditEntry>('AuditLog');

// Service layer: only return docs owned by the current user
async function getMyAuditEntries(userId: string): Promise<AuditEntry[]> {
  const all = await auditClient.getAll();
  return all
    .filter(doc => doc.owner === userId)
    .map(doc => doc.content);
}

// Admin pattern: fetch all documents (requires admin role check first)
async function getAllAuditEntries(): Promise<AuditEntry[]> {
  const all = await auditClient.getAll();
  return all.map(doc => doc.content);
}
```

### Common Collection Patterns

**User Preferences Store**
```typescript
const prefsClient = new AppDBClient.DocumentsClient<UserPreference>('UserPreferences');

async function getOrCreatePrefs(userId: string): Promise<UserPreference> {
  const all = await prefsClient.getAll();
  const existing = all.find(doc => doc.content.userId === userId);
  if (existing) return existing.content;

  const defaults: UserPreference = {
    userId,
    theme: 'light',
    dashboardLayout: ['overview'],
    lastLogin: new Date().toISOString(),
  };
  await prefsClient.create({ content: defaults });
  return defaults;
}
```

**Application Config Store**
```typescript
interface AppConfig {
  key: string;
  value: string;
  updatedBy: string;
  updatedAt: string;
}

const configClient = new AppDBClient.DocumentsClient<AppConfig>('AppConfig');

async function getConfig(key: string): Promise<string | null> {
  const all = await configClient.getAll();
  const entry = all.find(doc => doc.content.key === key);
  return entry?.content.value ?? null;
}

async function setConfig(key: string, value: string, userId: string): Promise<void> {
  const all = await configClient.getAll();
  const existing = all.find(doc => doc.content.key === key);

  const content: AppConfig = { key, value, updatedBy: userId, updatedAt: new Date().toISOString() };

  if (existing) {
    await configClient.update(existing.id, { content });
  } else {
    await configClient.create({ content });
  }
}
```

---

## IdentityClient & UserClient

### Getting the Current User

```typescript
import { IdentityClient } from '@domoinc/toolkit';

// Get current authenticated user
const currentUser = await IdentityClient.getCurrentUser();
// Returns: { id: string, displayName: string, emailAddress: string, role: string, ... }
```

### User Role Checks

```typescript
type DomoRole = 'Admin' | 'Privileged' | 'Editor' | 'Participant' | 'Social';

async function isAdmin(): Promise<boolean> {
  const user = await IdentityClient.getCurrentUser();
  return user.role === 'Admin';
}

async function hasMinimumRole(minimumRole: DomoRole): Promise<boolean> {
  const roleHierarchy: DomoRole[] = ['Admin', 'Privileged', 'Editor', 'Participant', 'Social'];
  const user = await IdentityClient.getCurrentUser();
  const userRoleIndex = roleHierarchy.indexOf(user.role as DomoRole);
  const requiredIndex = roleHierarchy.indexOf(minimumRole);
  return userRoleIndex <= requiredIndex; // Lower index = higher privilege
}
```

### Permission Validation Pattern

```typescript
async function requireRole(minimumRole: DomoRole): Promise<void> {
  const hasRole = await hasMinimumRole(minimumRole);
  if (!hasRole) {
    throw new Error(`This action requires ${minimumRole} role or higher.`);
  }
}

// Usage in a service function
async function deleteAllRecords(): Promise<void> {
  await requireRole('Admin');
  // ... proceed with deletion
}
```

---

## File Operations (ryuu.js)

### File Upload

```typescript
// Upload a file via the Domo file API
async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await domo.post('/domo/data-files/v1', formData);
  return response.id; // File ID for later retrieval
}
```

### File Download

```typescript
// Download a file by ID
async function downloadFile(fileId: string): Promise<Blob> {
  const response = await domo.get(`/domo/data-files/v1/${fileId}`, {
    responseType: 'blob',
  });
  return response;
}
```

### Code Engine Function Calls

```typescript
// Call a Code Engine package function
interface QueryResult {
  rows: Record<string, unknown>[];
  metadata: { rowCount: number };
}

async function callCodeEngine(
  functionName: string,
  params: Record<string, unknown>
): Promise<QueryResult> {
  return domo.post(`/domo/codeengine/v2/packages/${functionName}`, params);
}

// Usage
const result = await callCodeEngine('processQuery', {
  dataset: 'my-dataset-id',
  sql: 'SELECT * FROM table WHERE status = :status',
  parameters: { status: 'active' },
});
```

---

## Error Handling & Retry

### Service Layer Try/Catch Pattern

```typescript
import { toast } from 'react-toastify';

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

async function safeCall<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<ServiceResult<T>> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : errorMessage;
    console.error(`${errorMessage}:`, err);
    return { data: null, error: message };
  }
}

// Usage
const result = await safeCall(
  () => new Query().select(['Region', 'Revenue']).fetch<SalesRow>('salesData'),
  'Failed to load sales data'
);

if (result.error) {
  toast.error(result.error);
} else {
  setData(result.data!);
}
```

### Exponential Backoff

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * delay * 0.1;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }

  throw lastError;
}

// Usage
const data = await withRetry(
  () => new Query().select(['Region', 'Revenue']).fetch<SalesRow>('salesData'),
  3,
  1000
);
```

### Toast Notifications

```typescript
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// In your App component, include the container
function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} />
      <MainContent />
    </>
  );
}

// In service/handler code
toast.success('Record saved successfully');
toast.error('Failed to load data. Please try again.');
toast.info('Processing your request...');
toast.warning('You have unsaved changes');
```
