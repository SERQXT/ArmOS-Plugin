# Testing Domo Custom Apps

> Reference guide for testing React-based Domo custom apps using Jest and React Testing Library. Covers mocking the Domo SDK layer, testing components with Redux, and verifying service logic.

---

## Setup

### Install Dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest identity-obj-proxy
```

### Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterSetup: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    // Handle CSS imports (identity-obj-proxy returns class names as-is)
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    // Handle static asset imports
    '\\.(png|jpg|svg|gif)$': '<rootDir>/src/test/__mocks__/fileMock.ts',
    // Path aliases (match tsconfig paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/index.tsx',
  ],
};

export default config;
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';

// Mock the global domo object (injected by Domo runtime)
const mockDomo = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  navigate: jest.fn(),
  onFiltersUpdate: jest.fn(),
  env: {
    userId: 'test-user-123',
    locale: 'en-US',
    instanceId: 'test-instance',
  },
};

(globalThis as any).domo = mockDomo;
```

### File Mock

```typescript
// src/test/__mocks__/fileMock.ts
export default 'test-file-stub';
```

---

## Mocking Domo APIs

### Mock @domoinc/toolkit

```typescript
// src/test/__mocks__/@domoinc/toolkit.ts

// AppDBClient mock
const mockDocumentsClient = {
  getAll: jest.fn().mockResolvedValue([]),
  get: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: 'mock-doc-id', content: {} }),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue([]),
};

export const AppDBClient = {
  DocumentsClient: jest.fn(() => mockDocumentsClient),
};

// SqlClient mock
export const SqlClient = {
  query: jest.fn().mockResolvedValue([]),
};

// IdentityClient mock
export const IdentityClient = {
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'test-user-123',
    displayName: 'Test User',
    emailAddress: 'test@example.com',
    role: 'Admin',
  }),
};

// Export mock instances for test access
export const __mocks__ = {
  documentsClient: mockDocumentsClient,
};
```

### Mock @domoinc/query

```typescript
// src/test/__mocks__/@domoinc/query.ts

const mockQueryInstance = {
  select: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sum: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  avg: jest.fn().mockReturnThis(),
  dateRange: jest.fn().mockReturnThis(),
  fetch: jest.fn().mockResolvedValue([]),
};

const MockQuery = jest.fn(() => mockQueryInstance);

// Static filter operators
MockQuery.EQ = 'EQ';
MockQuery.NE = 'NE';
MockQuery.GT = 'GT';
MockQuery.GTE = 'GTE';
MockQuery.LT = 'LT';
MockQuery.LTE = 'LTE';
MockQuery.IN = 'IN';
MockQuery.LIKE = 'LIKE';
MockQuery.LAST = 'LAST';
MockQuery.THIS = 'THIS';
MockQuery.NEXT = 'NEXT';
MockQuery.DAYS = 'DAYS';
MockQuery.WEEKS = 'WEEKS';
MockQuery.MONTHS = 'MONTHS';
MockQuery.YEARS = 'YEARS';

export default MockQuery;

// Export mock instance for test access
export const __mocks__ = { queryInstance: mockQueryInstance };
```

### Mock ryuu.js (Global domo Object)

```typescript
// src/test/helpers/mockDomo.ts

export function mockDomoGet(data: unknown) {
  (globalThis as any).domo.get.mockResolvedValueOnce(data);
}

export function mockDomoPost(data: unknown) {
  (globalThis as any).domo.post.mockResolvedValueOnce(data);
}

export function mockDomoPut(data: unknown) {
  (globalThis as any).domo.put.mockResolvedValueOnce(data);
}

export function mockDomoDelete(data: unknown) {
  (globalThis as any).domo.delete.mockResolvedValueOnce(data);
}

export function mockDomoGetError(message: string) {
  (globalThis as any).domo.get.mockRejectedValueOnce(new Error(message));
}

export function resetDomoMocks() {
  (globalThis as any).domo.get.mockReset();
  (globalThis as any).domo.post.mockReset();
  (globalThis as any).domo.put.mockReset();
  (globalThis as any).domo.delete.mockReset();
  (globalThis as any).domo.navigate.mockReset();
  (globalThis as any).domo.onFiltersUpdate.mockReset();
}
```

### Mock Global Fetch

```typescript
// src/test/helpers/mockFetch.ts

export function mockFetch(response: unknown, status = 200) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  });
}

export function mockFetchError(message: string) {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error(message));
}
```

---

## Testing Patterns

### renderWithStore Helper

For components that depend on Redux, wrap them in a Provider with a preconfigured store:

```typescript
// src/test/helpers/renderWithStore.tsx
import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { salesReducer } from '../../store/slices/salesSlice';
import { filtersReducer } from '../../store/slices/filtersSlice';
import { preferencesReducer } from '../../store/slices/preferencesSlice';
import type { RootState } from '../../store/store';

interface RenderWithStoreOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  store?: EnhancedStore;
}

export function renderWithStore(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        sales: salesReducer,
        filters: filtersReducer,
        preferences: preferencesReducer,
      },
      preloadedState: preloadedState as any,
    }),
    ...renderOptions
  }: RenderWithStoreOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
```

### Component Tests

```typescript
// src/components/__tests__/SalesDashboard.test.tsx
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '../../test/helpers/renderWithStore';
import { SalesDashboard } from '../SalesDashboard';

// Mock the query module
jest.mock('@domoinc/query');
import MockQuery, { __mocks__ as queryMocks } from '@domoinc/query';

const mockSalesData = [
  { Region: 'West', Revenue: 50000, Rep: 'Alice', Date: '2024-01-15' },
  { Region: 'East', Revenue: 30000, Rep: 'Bob', Date: '2024-01-16' },
  { Region: 'West', Revenue: 25000, Rep: 'Carol', Date: '2024-01-17' },
];

describe('SalesDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryMocks.queryInstance.fetch.mockResolvedValue(mockSalesData);
  });

  it('renders loading state initially', () => {
    renderWithStore(<SalesDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays sales data after loading', async () => {
    renderWithStore(<SalesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('shows total revenue in stats bar', async () => {
    renderWithStore(<SalesDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/105,000/)).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    queryMocks.queryInstance.fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithStore(<SalesDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('renders with preloaded state', () => {
    renderWithStore(<SalesDashboard />, {
      preloadedState: {
        sales: {
          data: mockSalesData,
          loading: false,
          error: null,
          lastFetched: '2024-01-20T00:00:00Z',
        },
      },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

### Service Layer Tests

```typescript
// src/services/__tests__/salesService.test.ts
import { fetchSalesForRegion, saveSalesRecord } from '../salesService';
import { resetDomoMocks, mockDomoGet, mockDomoPost, mockDomoGetError } from '../../test/helpers/mockDomo';

jest.mock('@domoinc/query');
import MockQuery, { __mocks__ as queryMocks } from '@domoinc/query';

describe('salesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetDomoMocks();
  });

  describe('fetchSalesForRegion', () => {
    it('returns filtered sales data', async () => {
      const mockData = [
        { Region: 'West', Revenue: 50000, Rep: 'Alice' },
      ];
      queryMocks.queryInstance.fetch.mockResolvedValueOnce(mockData);

      const result = await fetchSalesForRegion('West');

      expect(queryMocks.queryInstance.filter).toHaveBeenCalledWith('Region', 'EQ', 'West');
      expect(result).toEqual(mockData);
    });

    it('throws on network error', async () => {
      queryMocks.queryInstance.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchSalesForRegion('West')).rejects.toThrow('Network error');
    });
  });

  describe('saveSalesRecord', () => {
    it('posts record to AppDB', async () => {
      mockDomoPost({ id: 'new-doc-id' });

      const record = { Region: 'West', Revenue: 50000, Rep: 'Alice' };
      const result = await saveSalesRecord(record);

      expect((globalThis as any).domo.post).toHaveBeenCalledWith(
        expect.stringContaining('/domo/datastores/v1/collections/'),
        expect.objectContaining({ content: record })
      );
    });
  });
});
```

### Redux Thunk Tests

```typescript
// src/store/slices/__tests__/salesSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import { salesReducer, fetchSalesData, clearSalesData } from '../salesSlice';

jest.mock('@domoinc/query');
import MockQuery, { __mocks__ as queryMocks } from '@domoinc/query';

const mockSalesData = [
  { Region: 'West', Revenue: 50000, Rep: 'Alice', Date: '2024-01-15' },
];

describe('salesSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({ reducer: { sales: salesReducer } });
  });

  describe('fetchSalesData thunk', () => {
    it('sets loading true on pending', () => {
      queryMocks.queryInstance.fetch.mockReturnValue(new Promise(() => {})); // Never resolves

      store.dispatch(fetchSalesData({}));

      const state = (store.getState() as any).sales;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('populates data on fulfilled', async () => {
      queryMocks.queryInstance.fetch.mockResolvedValueOnce(mockSalesData);

      await store.dispatch(fetchSalesData({}));

      const state = (store.getState() as any).sales;
      expect(state.loading).toBe(false);
      expect(state.data).toEqual(mockSalesData);
      expect(state.lastFetched).toBeTruthy();
    });

    it('sets error on rejected', async () => {
      queryMocks.queryInstance.fetch.mockRejectedValueOnce(new Error('Timeout'));

      await store.dispatch(fetchSalesData({}));

      const state = (store.getState() as any).sales;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Timeout');
      expect(state.data).toEqual([]);
    });

    it('applies region filter when provided', async () => {
      queryMocks.queryInstance.fetch.mockResolvedValueOnce(mockSalesData);

      await store.dispatch(fetchSalesData({ region: 'West' }));

      expect(queryMocks.queryInstance.filter).toHaveBeenCalledWith('Region', 'EQ', 'West');
    });
  });

  describe('clearSalesData reducer', () => {
    it('clears data and error', async () => {
      queryMocks.queryInstance.fetch.mockResolvedValueOnce(mockSalesData);
      await store.dispatch(fetchSalesData({}));

      store.dispatch(clearSalesData());

      const state = (store.getState() as any).sales;
      expect(state.data).toEqual([]);
      expect(state.error).toBeNull();
    });
  });
});
```

### Reducer Tests

```typescript
// src/store/slices/__tests__/filtersSlice.test.ts
import {
  filtersReducer,
  setRegion,
  setDateRange,
  setSearchQuery,
  setSortBy,
  toggleSortOrder,
  resetFilters,
} from '../filtersSlice';

describe('filtersSlice', () => {
  const initialState = {
    region: null,
    dateRange: null,
    searchQuery: '',
    sortBy: 'revenue',
    sortOrder: 'desc' as const,
  };

  it('handles setRegion', () => {
    const state = filtersReducer(initialState, setRegion('West'));
    expect(state.region).toBe('West');
  });

  it('handles setRegion to null (clear)', () => {
    const state = filtersReducer({ ...initialState, region: 'West' }, setRegion(null));
    expect(state.region).toBeNull();
  });

  it('handles setDateRange', () => {
    const range = { start: '2024-01-01', end: '2024-03-31' };
    const state = filtersReducer(initialState, setDateRange(range));
    expect(state.dateRange).toEqual(range);
  });

  it('handles setSearchQuery', () => {
    const state = filtersReducer(initialState, setSearchQuery('alice'));
    expect(state.searchQuery).toBe('alice');
  });

  it('handles toggleSortOrder', () => {
    const state1 = filtersReducer(initialState, toggleSortOrder());
    expect(state1.sortOrder).toBe('asc');

    const state2 = filtersReducer(state1, toggleSortOrder());
    expect(state2.sortOrder).toBe('desc');
  });

  it('handles resetFilters', () => {
    const modified = {
      region: 'West',
      dateRange: { start: '2024-01-01', end: '2024-03-31' },
      searchQuery: 'test',
      sortBy: 'rep',
      sortOrder: 'asc' as const,
    };

    const state = filtersReducer(modified, resetFilters());
    expect(state).toEqual(initialState);
  });
});
```

### Form Validation Tests

```typescript
// src/utils/__tests__/validation.test.ts
import { validateSalesRecord, ValidationErrors } from '../validation';

describe('validateSalesRecord', () => {
  const validRecord = {
    Region: 'West',
    Revenue: 50000,
    Rep: 'Alice Johnson',
    Date: '2024-01-15',
  };

  it('returns no errors for valid record', () => {
    const errors = validateSalesRecord(validRecord);
    expect(errors).toEqual({});
  });

  it('requires Region', () => {
    const errors = validateSalesRecord({ ...validRecord, Region: '' });
    expect(errors.Region).toBeDefined();
  });

  it('requires positive Revenue', () => {
    const errors = validateSalesRecord({ ...validRecord, Revenue: -100 });
    expect(errors.Revenue).toBeDefined();
  });

  it('requires Revenue to be a number', () => {
    const errors = validateSalesRecord({ ...validRecord, Revenue: NaN });
    expect(errors.Revenue).toBeDefined();
  });

  it('requires Rep name', () => {
    const errors = validateSalesRecord({ ...validRecord, Rep: '' });
    expect(errors.Rep).toBeDefined();
  });

  it('requires valid date format', () => {
    const errors = validateSalesRecord({ ...validRecord, Date: 'not-a-date' });
    expect(errors.Date).toBeDefined();
  });

  it('rejects future dates', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const errors = validateSalesRecord({
      ...validRecord,
      Date: futureDate.toISOString().split('T')[0],
    });
    expect(errors.Date).toBeDefined();
  });
});
```

---

## Test Organization

### Recommended File Structure

```
src/
  test/
    setup.ts                          # Global test setup (jest-dom, global mocks)
    helpers/
      renderWithStore.tsx              # Redux-wrapped render helper
      mockDomo.ts                      # domo.get/post/put/delete mock helpers
      mockFetch.ts                     # Global fetch mock helpers
    __mocks__/
      @domoinc/
        toolkit.ts                     # AppDBClient, SqlClient, IdentityClient mocks
        query.ts                       # Query class mock
      fileMock.ts                      # Static asset stub
  components/
    __tests__/
      SalesDashboard.test.tsx
      FilterBar.test.tsx
  services/
    __tests__/
      salesService.test.ts
  store/
    slices/
      __tests__/
        salesSlice.test.ts
        filtersSlice.test.ts
  utils/
    __tests__/
      validation.test.ts
```

### NPM Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

---

## Tips

- **Always clear mocks in beforeEach.** Domo SDK mocks accumulate call history across tests.
- **Use `mockResolvedValueOnce` over `mockResolvedValue`.** One-shot mocks prevent test bleeding.
- **Test loading, success, and error states.** Domo API calls can fail due to token expiration, dataset access, or network issues.
- **Mock at the module boundary.** Mock `@domoinc/query` and `@domoinc/toolkit` — not internal service functions — so you test real business logic.
- **Use `renderWithStore` with `preloadedState`** to skip async loading in component tests that focus on rendering behavior.
