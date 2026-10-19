import { getSettings } from '../lib/store';

/**
 * Gentle, opt-in reminders. A web page cannot be woken by the operating system, so this works while the app is open
 * (or installed and running in the background); real background delivery would need a push service or a native
 * wrapper and is documented as future work. Nothing is sent to any server.
 */
let timer: number | undefined;
export function scheduleReminder() {
  if (timer) clearTimeout(timer);
  const { reminders } = getSettings();
  if (!reminders.enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const [h, m] = reminders.time.split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  timer = window.setTimeout(() => {
    new Notification('Study Bible', { body: getSettings().reminders.message, tag: 'studybible-reminder' });
    scheduleReminder();
  }, next.getTime() - now.getTime());
}

export async function enableReminders(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  return p === 'granted' ? 'granted' : 'denied';
}
