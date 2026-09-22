# Redux State Management for Domo Apps

> Reference guide for integrating Redux Toolkit into React-based Domo custom apps. Use Redux when your app has complex shared state across multiple components — forms with validation, multi-step workflows, or dashboards with interdependent filters.

---

## When to Use Redux in a Domo App

| State Complexity | Recommendation |
|-----------------|----------------|
| Single component, local state | `useState` / `useReducer` — no Redux needed |
| 2-3 components sharing state | React Context + `useReducer` |
| Many components, async data, filters | Redux Toolkit |
| Multi-tab app with persistent state | Redux Toolkit + AppDB persistence |

Most Domo apps (59% are simple, 0-2 data mappings) do **not** need Redux. Reach for it when you have 3+ components that share and mutate the same state.

---

## Store Setup

### Install Dependencies

```bash
npm install @reduxjs/toolkit react-redux
```

### Configure Store

```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { salesReducer } from './slices/salesSlice';
import { filtersReducer } from './slices/filtersSlice';
import { preferencesReducer } from './slices/preferencesSlice';

export const store = configureStore({
  reducer: {
    sales: salesReducer,
    filters: filtersReducer,
    preferences: preferencesReducer,
  },
});

// Infer types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks

```typescript
// src/store/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Always use these typed hooks instead of plain useDispatch/useSelector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Provider Setup

```typescript
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

---

## Slice Pattern (Feature-Based)

### Basic Slice with Typed State

```typescript
// src/store/slices/filtersSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  region: string | null;
  dateRange: { start: string; end: string } | null;
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const initialState: FiltersState = {
  region: null,
  dateRange: null,
  searchQuery: '',
  sortBy: 'revenue',
  sortOrder: 'desc',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setRegion(state, action: PayloadAction<string | null>) {
      state.region = action.payload;
    },
    setDateRange(state, action: PayloadAction<{ start: string; end: string } | null>) {
      state.dateRange = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSortBy(state, action: PayloadAction<string>) {
      state.sortBy = action.payload;
    },
    toggleSortOrder(state) {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const {
  setRegion,
  setDateRange,
  setSearchQuery,
  setSortBy,
  toggleSortOrder,
  resetFilters,
} = filtersSlice.actions;

export const filtersReducer = filtersSlice.reducer;
```

---

## Async Thunks

### createAsyncThunk with Proper Typing

```typescript
// src/store/slices/salesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import Query from '@domoinc/query';

interface SalesRow {
  Region: string;
  Revenue: number;
  Rep: string;
  Date: string;
}

interface SalesState {
  data: SalesRow[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: SalesState = {
  data: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunk for fetching sales data
export const fetchSalesData = createAsyncThunk<
  SalesRow[],                    // Return type
  { region?: string },           // Argument type
  { rejectValue: string }        // ThunkAPI config (for rejectWithValue)
>(
  'sales/fetchData',
  async ({ region }, { rejectWithValue }) => {
    try {
      let query = new Query().select(['Region', 'Revenue', 'Rep', 'Date']);

      if (region) {
        query = query.filter('Region', Query.EQ, region);
      }

      const data = await query.fetch<SalesRow>('salesData');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sales data';
      return rejectWithValue(message);
    }
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearSalesData(state) {
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchSalesData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearSalesData } = salesSlice.actions;
export const salesReducer = salesSlice.reducer;
```

### Thunk with Optimistic Updates

```typescript
// src/store/slices/preferencesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AppDBClient } from '@domoinc/toolkit';

interface UserPreference {
  userId: string;
  theme: 'light' | 'dark';
  favoriteReports: string[];
}

interface PreferencesState {
  prefs: UserPreference | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

const initialState: PreferencesState = {
  prefs: null,
  loading: false,
  error: null,
  saving: false,
};

const prefsClient = new AppDBClient.DocumentsClient<UserPreference>('UserPreferences');

export const updateTheme = createAsyncThunk<
  UserPreference,
  { docId: string; theme: 'light' | 'dark' },
  { state: { preferences: PreferencesState }; rejectValue: string }
>(
  'preferences/updateTheme',
  async ({ docId, theme }, { getState, rejectWithValue }) => {
    const currentPrefs = getState().preferences.prefs;
    if (!currentPrefs) return rejectWithValue('No preferences loaded');

    const updated = { ...currentPrefs, theme };

    try {
      await prefsClient.update(docId, { content: updated });
      return updated;
    } catch (err) {
      return rejectWithValue('Failed to save theme preference');
    }
  }
);

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setPrefs(state, action: PayloadAction<UserPreference>) {
      state.prefs = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateTheme.pending, (state, action) => {
        state.saving = true;
        // Optimistic update — apply immediately
        if (state.prefs) {
          state.prefs.theme = action.meta.arg.theme;
        }
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.saving = false;
        state.prefs = action.payload;
      })
      .addCase(updateTheme.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? 'Unknown error';
        // Revert optimistic update — toggle theme back
        if (state.prefs) {
          state.prefs.theme = state.prefs.theme === 'dark' ? 'light' : 'dark';
        }
      });
  },
});

export const { setPrefs } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
```

---

## Selectors

### createSelector for Memoized Derived State

```typescript
// src/store/selectors/salesSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Base selectors
const selectSalesData = (state: RootState) => state.sales.data;
const selectFilters = (state: RootState) => state.filters;

// Memoized: filtered sales data based on current filters
export const selectFilteredSales = createSelector(
  [selectSalesData, selectFilters],
  (data, filters) => {
    let filtered = [...data];

    if (filters.region) {
      filtered = filtered.filter(row => row.Region === filters.region);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        row.Rep.toLowerCase().includes(query) ||
        row.Region.toLowerCase().includes(query)
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(row =>
        row.Date >= filters.dateRange!.start &&
        row.Date <= filters.dateRange!.end
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof typeof a];
      const bVal = b[filters.sortBy as keyof typeof b];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return filters.sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }
);

// Memoized: aggregate statistics from filtered data
export const selectSalesStats = createSelector(
  [selectFilteredSales],
  (filtered) => {
    const totalRevenue = filtered.reduce((sum, row) => sum + row.Revenue, 0);
    const avgRevenue = filtered.length > 0 ? totalRevenue / filtered.length : 0;
    const uniqueReps = new Set(filtered.map(row => row.Rep)).size;
    const uniqueRegions = new Set(filtered.map(row => row.Region)).size;

    return {
      totalRevenue,
      avgRevenue,
      dealCount: filtered.length,
      uniqueReps,
      uniqueRegions,
    };
  }
);

// Memoized: data grouped by region for chart consumption
export const selectRevenueByRegion = createSelector(
  [selectFilteredSales],
  (filtered) => {
    const grouped = new Map<string, number>();
    for (const row of filtered) {
      grouped.set(row.Region, (grouped.get(row.Region) ?? 0) + row.Revenue);
    }
    return Array.from(grouped.entries()).map(([region, revenue]) => ({
      Region: region,
      Revenue: revenue,
    }));
  }
);
```

### Using Selectors in Components

```typescript
// src/components/SalesDashboard.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSalesData } from '../store/slices/salesSlice';
import { selectFilteredSales, selectSalesStats } from '../store/selectors/salesSelectors';

export function SalesDashboard() {
  const dispatch = useAppDispatch();
  const filteredSales = useAppSelector(selectFilteredSales);
  const stats = useAppSelector(selectSalesStats);
  const loading = useAppSelector(state => state.sales.loading);
  const error = useAppSelector(state => state.sales.error);

  useEffect(() => {
    dispatch(fetchSalesData({}));
  }, [dispatch]);

  if (loading) return <div className="loading">Loading sales data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <div className="stats-bar">
        <span>Total Revenue: ${stats.totalRevenue.toLocaleString()}</span>
        <span>Deals: {stats.dealCount}</span>
        <span>Reps: {stats.uniqueReps}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Region</th>
            <th>Rep</th>
            <th>Revenue</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map((row, i) => (
            <tr key={i}>
              <td>{row.Region}</td>
              <td>{row.Rep}</td>
              <td>${row.Revenue.toLocaleString()}</td>
              <td>{row.Date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Listener Middleware for Side Effects

Use listener middleware for complex side effects that depend on dispatched actions — such as refetching data when filters change, or syncing state to AppDB.

```typescript
// src/store/listeners.ts
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';
import { setRegion, setDateRange, resetFilters } from './slices/filtersSlice';
import { fetchSalesData } from './slices/salesSlice';

export const listenerMiddleware = createListenerMiddleware();

const startListening = listenerMiddleware.startListening.withTypes<RootState, AppDispatch>();

// Re-fetch data when region or date filters change
startListening({
  matcher: isAnyOf(setRegion, setDateRange, resetFilters),
  effect: async (_action, listenerApi) => {
    // Debounce: cancel if another filter change comes within 300ms
    listenerApi.cancelActiveListeners();
    await listenerApi.delay(300);

    const state = listenerApi.getState();
    listenerApi.dispatch(fetchSalesData({ region: state.filters.region ?? undefined }));
  },
});
```

### Register Middleware in Store

```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { listenerMiddleware } from './listeners';
// ... slice imports

export const store = configureStore({
  reducer: {
    sales: salesReducer,
    filters: filtersReducer,
    preferences: preferencesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});
```

---

## Cross-Reducer Actions

When an action in one slice needs to update another slice's state:

```typescript
// src/store/slices/salesSlice.ts
import { resetFilters } from './filtersSlice';

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: { /* ... */ },
  extraReducers: (builder) => {
    // When filters are reset, also clear cached sales data
    builder.addCase(resetFilters, (state) => {
      state.data = [];
      state.lastFetched = null;
    });

    // ... other cases
  },
});
```

---

## Recommended File Structure

```
src/
  store/
    store.ts              # configureStore + type exports
    hooks.ts              # useAppDispatch, useAppSelector
    listeners.ts          # Listener middleware for side effects
    slices/
      salesSlice.ts       # Sales data state + async thunks
      filtersSlice.ts     # Filter state (region, date, search)
      preferencesSlice.ts # User preferences (synced to AppDB)
    selectors/
      salesSelectors.ts   # Memoized derived state
  components/
    SalesDashboard.tsx    # Uses selectors + dispatch
    FilterBar.tsx         # Dispatches filter actions
    StatsPanel.tsx        # Reads from selectors
```
