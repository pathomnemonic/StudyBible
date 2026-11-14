import { useEffect, useState } from 'react';
import { api } from '../sync/api';
import { updateUser, useSync } from '../sync/state';
import { download } from '../db/ops';
import { describeEvent, recoveryFile } from '../lib/securityLog';

/** The parts of the Account page about who you are and how you sign in. These only render when accounts are switched on (src/lib/accountsFlag.ts). */

export function ProfileCard() {
  const s = useSync();
  const [name, setName] = useState(s.user?.name ?? '');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  if (!s.user) return null;
  const run = async (f: () => Promise<void>, ok: string) => { setErr(''); setMsg(''); try { await f(); setMsg(ok); } catch (e: any) { setErr(e.message); } };
  return (
    <div className="card" aria-label="Your details">
      <h2 className="card-title">Your details</h2>
      <label className="field"><span>Name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
      <button className="btn" onClick={() => run(async () => updateUser((await api.updateProfile(name)).user), 'Name saved.')}>Save name</button>
      <h3>Change email</h3>
      <p className="muted small">Signs you out on your other devices. Your current password is needed.</p>
      <label className="field"><span>New email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="field"><span>Current password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
      <button className="btn" disabled={!email || !pw} onClick={() => run(async () => { updateUser((await api.changeEmail(email, pw)).user); setEmail(''); setPw(''); }, 'Email changed.')}>Change email</button>
      {msg && <p role="status">{msg}</p>}
      {err && <div className="notice" role="alert">{err}</div>}
    </div>
  );
}

export function TwoFactorCard() {
  const s = useSync();
  const [info, setInfo] = useState<{ enabled: boolean; recoveryCodesLeft: number } | null>(null);
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{ secret: string; otpauth: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [err, setErr] = useState('');
  const load = () => api.twoFactor().then(setInfo).catch(() => setInfo(null)).finally(() => window.dispatchEvent(new Event('sb:security-changed')));
  useEffect(() => { if (s.user) void load(); }, [s.user?.id]);
  if (!s.user || !info) return null;
  const run = async (f: () => Promise<void>) => { setErr(''); try { await f(); await load(); } catch (e: any) { setErr(e.message); } };
  return (
    <div className="card" aria-label="Two-factor sign-in">
      <h2 className="card-title">Two-factor sign-in</h2>
      <p className="muted small">Adds a six-digit code from an authenticator app (any standard one) to signing in, so a stolen password is not enough. {info.enabled ? `On. ${info.recoveryCodesLeft} recovery codes left.` : 'Off.'}</p>
      {codes && (
        <div className="notice" role="status">
          <strong>Save these recovery codes now.</strong> Each works once if you lose your phone. They will not be shown again.
          <pre style={{ userSelect: 'all' }}>{codes.join('\n')}</pre>
          <button className="btn small" onClick={() => download('recovery-codes.txt', recoveryFile(s.user!.email, codes), 'text/plain')}>Download as a file</button>{' '}
          <button className="btn small primary" onClick={() => setCodes(null)}>I have saved them</button>
        </div>
      )}
      {!info.enabled && !setup && (
        <>
          <label className="field"><span>Your password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
          <button className="btn" disabled={!pw} onClick={() => run(async () => { setSetup(await api.twoFactorStart(pw)); setPw(''); })}>Set up</button>
        </>
      )}
      {!info.enabled && setup && (
        <>
          <p>In your authenticator app, add an account and enter this key (choose “time-based”):</p>
          <p><code style={{ userSelect: 'all', wordBreak: 'break-all' }}>{setup.secret}</code></p>
          <p className="muted small">Or open this link on the phone that has the app: <a href={setup.otpauth}>add to authenticator</a></p>
          <label className="field"><span>Six-digit code from the app</span><input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" /></label>
          <button className="btn primary" disabled={code.replace(/\s/g, '').length !== 6} onClick={() => run(async () => { const r = await api.twoFactorConfirm(code); setCodes(r.recoveryCodes); setSetup(null); setCode(''); })}>Turn on</button>
        </>
      )}
      {info.enabled && (
        <>
          <label className="field"><span>Your password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></label>
          <div className="row">
            <button className="btn" disabled={!pw} onClick={() => run(async () => { setCodes((await api.twoFactorRecovery(pw)).recoveryCodes); setPw(''); })}>Get new recovery codes</button>
          </div>
          <label className="field"><span>To turn it off: a current code or a recovery code</span><input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" /></label>
          <button className="btn danger" disabled={!pw || !code} onClick={() => run(async () => { await api.twoFactorDisable(pw, code); setPw(''); setCode(''); })}>Turn off</button>
        </>
      )}
      {err && <div className="notice" role="alert">{err}</div>}
    </div>
  );
}

export function SecurityLogCard() {
  const s = useSync();
  const [events, setEvents] = useState<{ at: number; event: string; detail: string | null }[] | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { const f = () => setTick((n) => n + 1); window.addEventListener('sb:security-changed', f); return () => window.removeEventListener('sb:security-changed', f); }, []);
  useEffect(() => { if (s.user) api.securityLog().then((r) => setEvents(r.events)).catch(() => setEvents(null)); }, [s.user?.id, s.lastSyncAt, tick]);
  if (!s.user || !events) return null;
  return (
    <div className="card" aria-label="Security log">
      <h2 className="card-title">Recent security activity</h2>
      <p className="muted small">The last 50 things that happened to your account. If you see something you do not recognise, change your password and sign out other devices.</p>
      <ul className="small bullets">{events.map((e, i) => <li key={i}>{new Date(e.at).toLocaleString()}: {describeEvent(e.event)}{e.detail ? <span className="muted"> ({e.detail})</span> : null}</li>)}</ul>
    </div>
  );
}

/** For someone who forgot their password: the operator gives them a one-time code (nothing is emailed). */
export function ForgotPassword({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  return (
    <div className="card" aria-label="Forgot your password">
      <h2 className="card-title">Forgot your password?</h2>
      <p className="muted small">This server does not send email. Ask the person who runs it for a one-time reset code, then enter it here with a new password.</p>
      <label className="field"><span>Reset code</span><input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" /></label>
      <label className="field"><span>New password</span><input type="password" value={pw} minLength={10} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></label>
      {err && <div className="notice" role="alert">{err}</div>}
      {ok ? <p role="status">Password changed. You can sign in now. <button className="btn small" onClick={onDone}>Back to sign in</button></p> : <button className="btn primary" disabled={!code || pw.length < 10} onClick={async () => { setErr(''); try { await api.resetPassword(code, pw); setOk(true); } catch (e: any) { setErr(e.message); } }}>Set new password</button>}
    </div>
  );
}
