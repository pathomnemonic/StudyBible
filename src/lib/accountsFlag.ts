/**
 * The master switch for accounts and sync.
 * The whole feature (server, sign-in, sync, the Account page and every link to it) is built and tested but OFF by default,
 * so a normal build shows nothing about it and never looks for a server.
 *
 * To turn it on for everyone: build with VITE_ACCOUNTS=1 (and run the server; see docs/ACCOUNTS_ROLLOUT.md).
 * To try it privately: build with VITE_ACCOUNTS_PREVIEW=1, then open the app once with ?accounts=on in the address
 * (and ?accounts=off to remove it again). A build without either variable ignores the address entirely.
 */
import { supabaseConfigured } from '../sync/supabaseApi';

const KEY = 'sb:accounts';

export function accountsEnabled(): boolean {
  if (import.meta.env.VITE_ACCOUNTS === '1') return true;
  if (import.meta.env.VITE_ACCOUNTS_PREVIEW !== '1') return false;
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; }
}

/** the switch is read as soon as this file loads, before the router decides whether the account page exists (reading it later, in a start-up effect, sent a first visit to ?accounts=on#/account back to the home page and stripped the hash) */
const AUTH_ERROR_KEY = 'sb:auth-error';
/**
 * An expired or already-used email link comes back as /?error=access_denied&error_code=otp_expired#error=… . The router would read that "#error=…" as a page that does
 * not exist (a 404). Instead the message is kept for the Account page, the address is tidied to #/account, and the person is told the link no longer works.
 */
function takeAuthErrorFromAddress() {
  if (typeof location === 'undefined' || !supabaseConfigured()) return;
  const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
  const code = q.get('error_code') ?? h.get('error_code');
  const err = q.get('error') ?? h.get('error');
  if (!code && !err) return;
  const msg = code === 'otp_expired' ? 'That link has expired or was already used. Request a new one.' : 'That sign-in link did not work. Try again, or request a new link.';
  try { sessionStorage.setItem(AUTH_ERROR_KEY, msg); localStorage.setItem(KEY, 'on'); history.replaceState(null, '', location.pathname + '#/account'); } catch { /* storage blocked */ }
}
/** leaves a message for the Account page to show once (used when a link did not sign anyone in) */
export function setAuthError(msg: string) { try { sessionStorage.setItem(AUTH_ERROR_KEY, msg); } catch { /* storage blocked */ } }
/** the message left by a failed email-link return (shown once) */
export function consumeAuthError(): string | null {
  try { const m = sessionStorage.getItem(AUTH_ERROR_KEY); if (m) sessionStorage.removeItem(AUTH_ERROR_KEY); return m; } catch { return null; }
}

export const applyPreviewSwitchNow = () => {
  if (import.meta.env.VITE_ACCOUNTS_PREVIEW === '1' || import.meta.env.VITE_ACCOUNTS === '1') takeAuthErrorFromAddress(); if (typeof location !== 'undefined') applyPreviewSwitch(location.search + (location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?')) : '')); };

/** reads ?accounts=on|off from the address (only honoured in a preview build) and remembers it on this device */
export function applyPreviewSwitch(search: string): void {
  if (import.meta.env.VITE_ACCOUNTS_PREVIEW !== '1') return;
  const params = new URLSearchParams(search);
  const v = params.get('accounts');
  // coming back from a sign-in, confirmation or reset link (they return to the app with ?code=): that link can be opened in another browser than the one that
  // started it, where the switch was never turned on, so it must work there too. Only someone who asked for such an email or sign-in ever follows one.
  const returning = supabaseConfigured() && params.has('code');
  try { if (v === 'on' || returning) localStorage.setItem(KEY, 'on'); else if (v === 'off') localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
applyPreviewSwitchNow();
