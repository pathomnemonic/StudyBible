/**
 * The switch for syncing between devices through the reader's own Google Drive (no server of ours).
 * Built and tested but OFF in every normal build: nothing about it is shown and nothing is sent anywhere.
 *
 * To turn it on for everyone: build with VITE_DRIVE_SYNC=1 (and give the app a Google client id; see docs/DRIVE_SYNC.md).
 * To try it privately: build with VITE_DRIVE_SYNC_PREVIEW=1, then open the app once with ?drivesync=on in the address (?drivesync=off removes it).
 * A build with neither variable ignores the address entirely.
 */
const KEY = 'sb:drivesync';

export function driveSyncEnabled(): boolean {
  if (import.meta.env.VITE_DRIVE_SYNC === '1') return true;
  if (import.meta.env.VITE_DRIVE_SYNC_PREVIEW !== '1') return false;
  try { return localStorage.getItem(KEY) === 'on'; } catch { return false; }
}

/** reads ?drivesync=on|off from the address (only honoured in a preview build) and remembers it on this device */
export function applyDriveSyncPreviewSwitch(search: string): void {
  if (import.meta.env.VITE_DRIVE_SYNC_PREVIEW !== '1') return;
  const v = new URLSearchParams(search).get('drivesync');
  try { if (v === 'on') localStorage.setItem(KEY, 'on'); else if (v === 'off') localStorage.removeItem(KEY); } catch { /* storage blocked */ }
}
