import { Component, type ReactNode } from 'react';
import { refreshApp } from '../lib/recover';

/** If a page fails to load (often an old cached copy of the app after an update), say so plainly and offer a one-tap fix instead of a blank screen. */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { err: Error | null; key?: string; offline: boolean }> {
  state = { err: null as Error | null, key: this.props.resetKey, offline: false };
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
          <button className="btn primary" onClick={() => void refreshApp().then((done) => { if (!done) this.setState({ offline: true }); })}>Refresh the app</button>
          <button className="btn" onClick={() => this.setState({ err: null })}>Try again</button>
        </div>
        {this.state.offline && <p className="notice" role="status">You are offline, so the app was left as it is (the copy on this device may be the only one that works). Connect to the internet and try again.</p>}
        <p className="muted small">Refreshing replaces the app's own downloaded code only. Your notes, settings, offline Bibles and offline audio are kept.</p>
        <details className="small"><summary>Details</summary><code>{String(this.state.err.message ?? this.state.err)}</code></details>
      </div>
    );
  }
}
