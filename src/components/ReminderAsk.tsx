import { useEffect, useState } from 'react';
import { updateSettings, useSettings } from '../lib/store';
import { enableReminders, scheduleReminder } from '../liturgy/reminders';

const DAYS = 'sb:visitDays', DISMISS = 'sb:reminderAsked';
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

/** Offered once, on the second day someone opens the app: a daily nudge to pray and read. Asking sooner, before the app has shown any value, is what makes a permission prompt feel like a demand. */
export default function ReminderAsk() {
  const [s] = useSettings();
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const days: string[] = JSON.parse(read(DAYS) ?? '[]');
      if (!days.includes(today)) { days.push(today); localStorage.setItem(DAYS, JSON.stringify(days.slice(-5))); }
      setShow(days.length >= 2 && !read(DISMISS));
    } catch { /* private mode */ }
  }, []);
  if (!show || s.reminders.enabled) return null;
  const close = () => { try { localStorage.setItem(DISMISS, '1'); } catch { /* private mode */ } setShow(false); };
  const yes = async () => {
    const r = await enableReminders();
    if (r === 'granted') { updateSettings({ reminders: { ...s.reminders, enabled: true } }); window.setTimeout(scheduleReminder, 50); close(); }
    else setMsg(r === 'denied' ? 'Notifications are blocked in your browser. You can allow them in its settings.' : 'This browser does not support notifications.');
  };
  return (
    <aside className="tip-card" role="note" aria-label="Daily reminder">
      <div className="tip-body"><strong>A gentle daily reminder?</strong><div className="tip-text">A nudge to pray and read, at {s.reminders.time}. You can change the time or turn it off in Settings.</div>{msg && <div className="tip-text" role="status">{msg}</div>}</div>
      <span className="row" style={{ gap: 6 }}><button className="btn small primary" onClick={() => void yes()}>Yes, remind me</button><button className="btn small ghost" onClick={close}>No thanks</button></span>
    </aside>
  );
}
