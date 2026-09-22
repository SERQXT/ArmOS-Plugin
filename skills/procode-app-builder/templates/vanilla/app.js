/**
 * Domo Pro-Code App — Vanilla Template
 *
 * Uses the global `domo` SDK (injected by Domo runtime) for data access.
 * Uses Phoenix charts for visualization.
 *
 * Dataset alias "mainData" must be mapped in manifest.json.
 */

// ── Configuration ──────────────────────────────────────────────────
const DATASET_ALIAS = 'mainData';
const VALUE_COLUMN = 'Revenue';   // Replace with your measure column
const LABEL_COLUMN = 'Region';    // Replace with your dimension column

// ── Initialization ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadData();
    renderKPIs(data);
    renderChart(data);
    renderTable(data);
  } catch (err) {
    console.error('App initialization error:', err);
    showError(err.message);
  }
});

// ── Data Loading ───────────────────────────────────────────────────
async function loadData() {
  // domo.get() returns an array of row objects
  // The alias must match manifest.json mapping
  const rows = await domo.get(`/data/v1/${DATASET_ALIAS}`);
  console.log(`Loaded ${rows.length} rows from ${DATASET_ALIAS}`);
  return rows;
}

// ── KPI Rendering ──────────────────────────────────────────────────
function renderKPIs(data) {
  const values = data.map(row => parseFloat(row[VALUE_COLUMN]) || 0);

  const total = values.reduce((sum, v) => sum + v, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const count = data.length;

  setKPI('kpi-total', formatNumber(total));
  setKPI('kpi-average', formatNumber(average));
  setKPI('kpi-count', formatNumber(count));
}

function setKPI(elementId, value) {
  const el = document.querySelector(`#${elementId} .kpi-value`);
  if (el) el.textContent = value;
}

// ── Chart Rendering ────────────────────────────────────────────────
function renderChart(data) {
  const container = document.getElementById('chart-container');
  if (!container || typeof Phoenix === 'undefined') {
    console.warn('Phoenix charts not available');
    return;
  }

  // Aggregate data by label column
  const aggregated = {};
  data.forEach(row => {
    const label = row[LABEL_COLUMN] || 'Unknown';
    const value = parseFloat(row[VALUE_COLUMN]) || 0;
    aggregated[label] = (aggregated[label] || 0) + value;
  });

  const labels = Object.keys(aggregated);
  const values = Object.values(aggregated);

  const chart = new Phoenix.Chart({
    element: container,
    type: 'bar',
    data: {
      columns: [
        { name: LABEL_COLUMN, type: 'STRING', mapping: 'ITEM' },
        { name: VALUE_COLUMN, type: 'DOUBLE', mapping: 'VALUE', aggregation: 'SUM' }
      ],
      rows: labels.map((label, i) => [label, values[i]])
    },
    options: {
      title: `${VALUE_COLUMN} by ${LABEL_COLUMN}`,
      colors: ['#0090CF']
    }
  });

  chart.render();
}

// ── Table Rendering ────────────────────────────────────────────────
function renderTable(data) {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  const thead = document.getElementById('table-head');
  const tbody = document.getElementById('table-body');

  // Header
  thead.innerHTML = '<tr>' + columns.map(col => `<th>${col}</th>`).join('') + '</tr>';

  // Body (limit to 100 rows for performance)
  const displayRows = data.slice(0, 100);
  tbody.innerHTML = displayRows.map(row =>
    '<tr>' + columns.map(col => `<td>${row[col] ?? ''}</td>`).join('') + '</tr>'
  ).join('');
}

// ── Utilities ──────────────────────────────────────────────────────
function formatNumber(value) {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function showError(message) {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="padding: 20px; color: #d32f2f; text-align: center;">
        <h2>Error</h2>
        <p>${message}</p>
        <p style="font-size: 12px; color: #666;">Check the browser console for details.</p>
      </div>
    `;
  }
}
