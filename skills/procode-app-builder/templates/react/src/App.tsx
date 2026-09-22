import React, { useEffect, useState } from 'react';

/**
 * Domo Pro-Code App — React Template
 *
 * Uses the global `domo` SDK (injected by Domo runtime) for data access.
 * Dataset alias "mainData" must be mapped in manifest.json.
 */

// Domo SDK type declaration — the global `domo` object is injected by Domo runtime
declare const domo: {
  get: (url: string) => Promise<any>;
  post: (url: string, body?: any) => Promise<any>;
  put: (url: string, body?: any) => Promise<any>;
  delete: (url: string) => Promise<any>;
  navigate: (url: string, external?: boolean) => void;
  env: { userId: string; locale: string };
};

// ── Configuration ──────────────────────────────────────────────────
const DATASET_ALIAS = 'mainData';
const VALUE_COLUMN = 'Revenue';   // Replace with your measure column
const LABEL_COLUMN = 'Region';    // Replace with your dimension column

// ── Types ──────────────────────────────────────────────────────────
interface DataRow {
  [key: string]: string | number;
}

interface KPIs {
  total: number;
  average: number;
  count: number;
}

// ── Main App Component ─────────────────────────────────────────────
const App: React.FC = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [kpis, setKpis] = useState<KPIs>({ total: 0, average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Verify Domo SDK is available
      if (typeof domo === 'undefined') {
        throw new Error('Domo SDK (domo) is not available. Ensure ryuu.js is loaded before the app script.');
      }

      const rows: DataRow[] = await domo.get(`/data/v1/${DATASET_ALIAS}`);
      setData(rows);

      // Calculate KPIs
      const values = rows.map(row => parseFloat(String(row[VALUE_COLUMN])) || 0);
      const total = values.reduce((sum, v) => sum + v, 0);
      setKpis({
        total,
        average: values.length > 0 ? total / values.length : 0,
        count: rows.length,
      });
    } catch (err: any) {
      console.error('Data loading error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <p style={styles.hint}>Check the browser console for details.</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>My Domo App</h1>
        <p style={styles.subtitle}>React + TypeScript + Domo SDK</p>
      </header>

      {/* KPI Row */}
      <div style={styles.kpiRow}>
        <KPICard label="Total" value={formatNumber(kpis.total)} />
        <KPICard label="Average" value={formatNumber(kpis.average)} />
        <KPICard label="Count" value={formatNumber(kpis.count)} />
      </div>

      {/* Data Table */}
      <div style={styles.tableSection}>
        <DataTable data={data.slice(0, 100)} />
      </div>
    </div>
  );
};

// ── KPI Card Component ─────────────────────────────────────────────
const KPICard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={styles.kpiCard}>
    <span style={styles.kpiLabel}>{label}</span>
    <span style={styles.kpiValue}>{value}</span>
  </div>
);

// ── Data Table Component ───────────────────────────────────────────
const DataTable: React.FC<{ data: DataRow[] }> = ({ data }) => {
  if (data.length === 0) return <p>No data available.</p>;

  const columns = Object.keys(data[0]);

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col} style={styles.th}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => (
              <td key={col} style={styles.td}>{String(row[col] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ── Utilities ──────────────────────────────────────────────────────
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1) + 'K';
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

// ── Inline Styles ──────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  app: {
    padding: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  kpiRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  },
  kpiCard: {
    flex: 1,
    minWidth: 120,
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    padding: 16,
    textAlign: 'center' as const,
  },
  kpiLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    display: 'block',
    fontSize: 24,
    fontWeight: 700,
    color: '#0090CF',
  },
  tableSection: {
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    padding: '8px 12px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#555',
  },
  td: {
    border: '1px solid #e0e0e0',
    padding: '6px 12px',
  },
  loading: {
    padding: 40,
    textAlign: 'center' as const,
    color: '#888',
  },
  error: {
    padding: 20,
    textAlign: 'center' as const,
    color: '#d32f2f',
  },
  hint: {
    fontSize: 12,
    color: '#666',
  },
};

export default App;
