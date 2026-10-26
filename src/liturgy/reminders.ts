import { BRAND } from '../lib/brand';
import { getSettings } from '../lib/store';
import { verseForDay } from '../study/verseOfDay';

/**
 * Gentle, opt-in reminders: one for daily reading plus any number of prayer reminders (morning, evening, the Angelus,
 * verse of the day…). A web page cannot be woken by the operating system, so these fire while the app is open or installed
 * and running in the background; true background delivery would need a push service or a native wrapper. Nothing is sent
 * to any server.
 */
const timers = new Map<string, number>();

function next(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const t = new Date(now);
  t.setHours(h, m, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  return t.getTime() - now.getTime();
}

function arm(id: string, time: string, body: () => string) {
  const old = timers.get(id);
  if (old) clearTimeout(old);
  timers.set(
    id,
    window.setTimeout(() => {
      try {
        new Notification(BRAND.name, { body: body(), tag: `studybible-${id}` });
      } catch {
        /* notifications blocked */
      }
      arm(id, time, body);
    }, next(time)),
  );
}

export function scheduleReminder() {
  for (const t of timers.values()) clearTimeout(t);
  timers.clear();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const s = getSettings();
  if (s.reminders.enabled) arm('reading', s.reminders.time, () => getSettings().reminders.message);
  for (const r of s.prayerReminders) {
    if (r.enabled) arm(r.id, r.time, () => (r.message === '{verse}' ? `Today’s verse: ${verseForDay()}` : r.message));
  }
}

export async function enableReminders(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  return p === 'granted' ? 'granted' : 'denied';
}

export const PRESETS: { label: string; time: string; message: string }[] = [
  { label: 'Morning prayer', time: '07:00', message: 'A moment for morning prayer.' },
  { label: 'The Angelus', time: '12:00', message: 'The Angelus: pause and pray.' },
  { label: 'Evening prayer', time: '20:30', message: 'A moment for evening prayer and an examination of the day.' },
  { label: 'Verse of the day', time: '08:00', message: '{verse}' },
  { label: 'Memorize: review', time: '19:00', message: 'Time to review the verses you are memorizing.' },
];
