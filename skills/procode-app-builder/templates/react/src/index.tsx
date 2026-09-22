import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Error boundary — crashes show a visible red banner, never a blank white page
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, background: '#fef2f2', border: '2px solid #dc2626', borderRadius: 8, margin: 16 }}>
          <h2 style={{ color: '#dc2626', margin: '0 0 8px' }}>App Error</h2>
          <pre style={{ color: '#991b1b', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </pre>
          <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Check the browser console for the full stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
