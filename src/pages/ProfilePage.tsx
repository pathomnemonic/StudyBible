import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSync } from '../sync/state';
import WhatsNew from '../components/WhatsNew';
import WeekCard from '../components/WeekCard';
import ContinueRow from '../components/ContinueRow';
import DriveBackup from '../components/DriveBackup';

type Row = [string, string, string];
const GROUPS: { title: string; items: Row[] }[] = [
  { title: 'My reading', items: [
    ['/pray/plans', 'Reading plans', 'Follow a plan through the Bible or a theme, with progress kept.'],
    ['/memorize', 'Memorize Scripture', 'Spaced repetition and audio recall.'],
    ['/days', 'Favourite days', 'Days you starred on Today, and a date picker for any other day.'],
    ['/pray/readings', 'Mass readings', 'The day’s readings, in full in your translation.'],
  ] },
  { title: 'My prayer', items: [
    ['/pray', 'Prayer', 'Everything for prayer in one place.'],
    ['/pray/lectio', 'Lectio Divina', 'Read, meditate, pray, rest, with a gentle timer.'],
    ['/session', 'A quiet moment', 'A guided ten-minute pause.'],
    ['/pray/sleep', 'Sleep mode', 'A psalm read slowly while the sound fades.'],
    ['/pray/journal', 'Prayer journal', 'Reflections and intentions, private to this device.'],
  ] },
  { title: 'My notes', items: [
    ['/library', 'Notes, highlights and bookmarks', 'Everything you have written or marked.'],
    ['/settings#drive-backup', 'Back up to Google Drive', 'Keep a safe copy of your notes that updates itself.'],
    ['/library?tab=export', 'Export and backup', 'JSON, Markdown, PDF and EPUB.'],
    ['/share', 'Make a verse card', 'A picture of a verse, with a painting if you like.'],
  ] },
  { title: 'Settings and account', items: [
    ['/settings', 'Settings', 'Translation, language, theme, offline, reminders.'],
    ['/account', 'Account and sync', 'Optional; your data stays on this device without it.'],
    ['/study/sources', 'Sources and licensing', 'Where every text comes from and what is only linked.'],
    ['/about', 'About and feature status', 'What this app is, and what works.'],
    ['/profile#tour', 'Take the tour again', 'A short walkthrough of every part of the app.'],
    ['/more', 'Every page in the app', 'A plain list of everything, in case something is hard to find.'],
  ] },
];

/** Everything that is yours: where you left off, your plans, notes and settings. Anything educational lives under Study. */
export default function ProfilePage() {
  const sync = useSync();
  const notes = useLiveQuery(() => db.notes.count(), []) ?? 0;
  return (
    <div className="page">
      <h1>Profile</h1>
      <p className="lede">{sync.user ? `Signed in as ${sync.user.email}. ` : 'Your notes, plans and settings live on this device. '}{notes ? `${notes} note${notes === 1 ? '' : 's'} so far.` : 'Nothing written yet.'}</p>
      <DriveBackup compact />
      <WhatsNew />
      <WeekCard />
      <ContinueRow max={6} />
      <div className="tool-groups">
        {GROUPS.map((g) => (
          <section key={g.title} className="tool-group">
            <h2>{g.title}</h2>
            <ul>
              {g.items.map(([to, t, d]) => (
                <li key={to}><Link to={to} onClick={to.endsWith('#tour') ? (e) => { e.preventDefault(); window.dispatchEvent(new Event('studybible:tour')); } : undefined}><span className="t">{t}</span><span className="d">{d}</span><span className="go" aria-hidden="true">→</span></Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
