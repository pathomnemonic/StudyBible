import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../sync/api';
import { deleteAccount, signIn, signOut, signUp, syncNow, useSync, type AuthDecision } from '../sync/state';
import { download } from '../db/ops';
import { useToast } from '../components/Toast';

const decide = async (n: number): Promise<AuthDecision> =>
  confirm(`This device holds ${n} notes, highlights and other items from a different account.\n\nOK = remove them from this device before signing in (recommended on a shared device).\nCancel = merge them into the account you are signing in to.`) ? 'wipe' : 'merge';

export default function AccountPage() {
  const s = useSync();
  const toast = useToast();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [delPw, setDelPw] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (mode === 'in') await signIn(email, pw, decide);
      else await signUp(email, pw, name || undefined, decide);
      setPw('');
      toast(mode === 'in' ? 'Signed in. Your library is syncing.' : 'Account created. Your library is syncing.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (s.server === 'unknown') return <div className="center-note">Checking for the sync server…</div>;

  return (
    <div className="page narrow">
      <h1>Account & sync</h1>
      {s.server === 'unavailable' && (
        <div className="card">
          <h2 className="card-title">Accounts are not available on this copy of the app</h2>
          <p>
            Your notes and highlights are saved safely on <strong>this device</strong>. To sign in and sync across devices, the app has to be served by the Study Bible server, which provides accounts and storage. You can run it yourself in a minute:
          </p>
          <pre className="code">{`npm run build\nnpm run server        # http://localhost:8787`}</pre>
          <p className="muted small">See docs/SERVER.md for deployment (Docker, HTTPS, backups). Until then, Library → Export moves your data between devices.</p>
        </div>
      )}

      {s.server === 'available' && !s.user && (
        <form className="card auth" onSubmit={submit}>
          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'in'} onClick={() => setMode('in')}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'up'} disabled={s.registration === 'closed'} onClick={() => setMode('up')}>Create account</button>
          </div>
          <p className="muted">{mode === 'in' ? 'Welcome back. Sign in to load your notes, highlights and progress on this device.' : 'An account keeps your annotations safe and in sync across your devices. It is optional: the app works fully without one.'}</p>
          {mode === 'up' && (
            <label className="field">
              <span>Name (optional)</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" required minLength={mode === 'up' ? 10 : 1} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
            {mode === 'up' && <small className="muted">At least 10 characters. A short phrase is easier to remember and stronger than a clever word.</small>}
          </label>
          {err && <div className="notice" role="alert">{err}</div>}
          <button className="btn primary block" disabled={busy}>{busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
          <p className="muted small">Your notes belong to you. They are stored on the server only so they can sync, are never shared or used for advertising, and you can export or permanently delete everything from this page.</p>
        </form>
      )}

      {s.user && (
        <>
          <div className="card">
            <div className="row between">
              <div>
                <h2 className="card-title" style={{ marginBottom: 2 }}>{s.user.name || s.user.email}</h2>
                <div className="muted small">{s.user.email}</div>
              </div>
              <span className={`chip ${s.status === 'idle' ? 'good' : s.status === 'error' ? 'warn' : ''}`}>{{ idle: 'Synced', syncing: 'Syncing…', error: 'Sync problem', offline: 'Offline', 'signed-out': '' }[s.status]}</span>
            </div>
            <p className="muted small">{s.lastSyncAt ? `Last synced ${new Date(s.lastSyncAt).toLocaleTimeString()}.` : 'Not synced yet.'} Changes sync automatically a few seconds after you make them.</p>
            {s.error && <div className="notice">{s.error}</div>}
            <div className="row">
              <button className="btn" onClick={() => syncNow()}>Sync now</button>
              <button className="btn" onClick={async () => download('studybible-account-export.json', JSON.stringify(await api.exportAccount(), null, 1))}>Download my account data</button>
              <button className="btn" onClick={async () => { const clear = confirm('Sign out and also remove your notes from this device?\n\nOK = remove from this device (they stay in your account).\nCancel = keep a copy on this device.'); await signOut(clear); toast('Signed out.'); }}>Sign out</button>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Change password</h2>
            <div className="row">
              <input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
              <input type="password" placeholder="New password (10+ characters)" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
              <button className="btn" onClick={async () => { try { await api.changePassword(cur, next); setCur(''); setNext(''); toast('Password changed. Other devices were signed out.'); } catch (e: any) { toast(e.message, 'error'); } }}>Change</button>
            </div>
          </div>

          <div className="card danger-zone">
            <h2 className="card-title">Delete my account</h2>
            <p className="muted small">Permanently deletes your account and every note, highlight and setting stored on the server. Copies on your own devices are not touched unless you choose so below. This cannot be undone.</p>
            <div className="row">
              <input type="password" placeholder="Confirm with your password" value={delPw} onChange={(e) => setDelPw(e.target.value)} autoComplete="current-password" />
              <button className="btn danger" disabled={!delPw} onClick={async () => { if (!confirm('Delete your account and all server-side data permanently?')) return; try { await deleteAccount(delPw, confirm('Also remove the notes from this device?')); setDelPw(''); toast('Your account was deleted.'); } catch (e: any) { toast(e.message, 'error'); } }}>Delete account</button>
            </div>
          </div>
        </>
      )}

      <div className="card">
        <h2 className="card-title">How your data is handled</h2>
        <ul className="small bullets">
          <li><strong>Local first.</strong> Everything works offline and without an account; signing in only adds sync and backup.</li>
          <li><strong>What is stored.</strong> Notes, highlights, bookmarks, folders, collections, journal, plans and progress, links you attach, and reading settings. No analytics, no tracking.</li>
          <li><strong>Security.</strong> Passwords are hashed with scrypt; sessions use HttpOnly cookies; run the server behind HTTPS. Notes are not end-to-end encrypted yet, so the server operator can technically read them — host it yourself or trust your host (see docs/SERVER.md).</li>
          <li><strong>Backup & deletion.</strong> Download everything any time; deleting the account removes all server-side data.</li>
        </ul>
        <p className="small"><Link to="/settings">Back to settings</Link></p>
      </div>
    </div>
  );
}
