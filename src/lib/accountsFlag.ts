/**
 * The master switch for accounts and sync.
 * The whole feature (server, sign-in, sync, the Account page and every link to it) is built and tested but OFF by default,
 * so a normal build shows nothing about it and never looks for a server.
 *
 * To turn it on for everyone: build with VITE_ACCOUNTS=1 (and run the server; see docs/ACCOUNTS_ROLLOUT.md).
 * To try it privately: build with VITE_ACCOUNTS_PREVIEW=1, then open the app once with ?accounts=on in the address
 * (and ?accounts=off to remove it again). A build without either variable ignores the address entirely.
 */
const KEY = 'sb:accounts';

export function accountsEnabled(): boolean {
  if (import.meta.env.VITE_ACCOUNTS === '1') return true;
  if (import.meta.env.VITE_ACCOUNTS_PREVIEW !== '1') return false;
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; }
}

/** reads ?accounts=on|off from the address (only honoured in a preview build) and remembers it on this device */
export function applyPreviewSwitch(search: string): void {
  if (import.meta.env.VITE_ACCOUNTS_PREVIEW !== '1') return;
  const v = new URLSearchParams(search).get('accounts');
  try { if (v === 'on') localStorage.setItem(KEY, 'on'); else if (v === 'off') localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
