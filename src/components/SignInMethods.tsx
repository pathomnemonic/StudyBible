import { useEffect, useState } from 'react';
import { api, providerStartUrl, type SignInProvider } from '../sync/api';
import { useToast } from './Toast';

/** What each result code from a sign-in attempt means, in plain words. */
export const SIGN_IN_MESSAGES: Record<string, string> = {
  cancelled: 'Sign-in was cancelled.',
  expired: 'That sign-in took too long or was already used. Please try again.',
  email_in_use: 'An account with that email already exists. Sign in the usual way first, then add this service from your account page.',
  registration_closed: 'New accounts are not being opened on this server right now.',
  already_linked_elsewhere: 'That account is already linked to a different Cathology account.',
  not_signed_in: 'Sign in first, then add this service.',
  second_step_required: 'This account has a second step turned on. Sign in with your password and code.',
  too_many: 'Too many sign-ups from this address. Try again later.',
  provider_unreachable: 'Could not reach that service. Try again in a moment.',
};
export const signInMessage = (code: string) => SIGN_IN_MESSAGES[code] ?? 'Sign-in did not work. Please try again.';

/** "Continue with Google" and the like. Shows nothing at all unless the server offers a provider, so it stays invisible until the operator turns sign-in providers on. */
export function ProviderButtons({ providers }: { providers: SignInProvider[] }) {
  if (!providers.length) return null;
  return (
    <div className="provider-buttons" aria-label="Other ways to sign in">
      {providers.map((p) => <a key={p.id} className="btn block" href={providerStartUrl(p.id)}>Continue with {p.name}</a>)}
      <p className="muted small">Signing in with another service only proves who you are. Your notes stay in your account on this server.</p>
    </div>
  );
}

/** For a signed-in person: the services linked to the account, adding or removing them, and setting a password on an account made with a service. */
export function SignInMethodsCard() {
  const toast = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.identities>> | null>(null);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const load = () => { api.identities().then(setData).catch(() => setData(null)); };
  useEffect(load, []);
  if (!data || (!data.available.length && !data.identities.length && data.hasPassword)) return null;
  const linked = new Set(data.identities.map((i) => i.provider));
  return (
    <div className="card">
      <h2 className="card-title">Ways to sign in</h2>
      <ul className="small bullets">
        {data.hasPassword && <li>Email and password</li>}
        {data.identities.map((i) => (
          <li key={i.provider}>{i.name}{i.email ? ` (${i.email})` : ''}{' '}
            <button type="button" className="linklike" onClick={async () => { setErr(''); try { await api.unlinkIdentity(i.provider); toast(`${i.name} removed.`); load(); } catch (e: any) { setErr(e.message); } }}>Remove</button>
          </li>
        ))}
      </ul>
      {data.available.filter((p) => !linked.has(p.id)).map((p) => <a key={p.id} className="btn small" href={providerStartUrl(p.id, true)}>Add {p.name}</a>)}
      {!data.hasPassword && (
        <form className="stack" onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await api.setPassword(pw); setPw(''); toast('Password set.'); load(); } catch (x: any) { setErr(x.message); } }}>
          <p className="muted small">This account has no password yet. Some settings (changing your email, a second step, deleting the account) ask for one. Set one to use them.</p>
          <label>New password<input type="password" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></label>
          <button className="btn small">Set password</button>
        </form>
      )}
      {err && <div className="notice" role="alert">{err}</div>}
    </div>
  );
}
