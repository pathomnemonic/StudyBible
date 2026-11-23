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
export const applyPreviewSwitchNow = () => { if (typeof location !== 'undefined') applyPreviewSwitch(location.search + (location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?')) : '')); };

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
