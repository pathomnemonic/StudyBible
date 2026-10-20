import { Component, type ReactNode } from 'react';

async function refreshApp() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((regs ?? []).map((r) => r.unregister()));
    const keys = await caches?.keys();
    await Promise.all((keys ?? []).map((k) => caches.delete(k)));
  } catch { /* best effort */ }
  location.reload();
}

/** If a page fails to load (often an old cached copy of the app after an update), say so plainly and offer a one-tap fix instead of a blank screen. */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { err: Error | null; key?: string }> {
  state = { err: null as Error | null, key: this.props.resetKey };
  static getDerivedStateFromError(err: Error) { return { err }; }
  static getDerivedStateFromProps(p: { resetKey?: string }, s: { key?: string; err: Error | null }) {
    return p.resetKey !== s.key ? { err: null, key: p.resetKey } : null;
  }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="page" role="alert">
        <h1>This page did not load</h1>
        <p>Something went wrong while opening it. This often happens right after the app has been updated and your device still holds an older copy. Refreshing the app usually fixes it; your notes and settings are not touched.</p>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn primary" onClick={refreshApp}>Refresh the app</button>
          <button className="btn" onClick={() => this.setState({ err: null })}>Try again</button>
        </div>
        <details className="small"><summary>Details</summary><code>{String(this.state.err.message ?? this.state.err)}</code></details>
      </div>
    );
  }
}
