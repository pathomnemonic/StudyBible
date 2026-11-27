import { accountsEnabled } from '../lib/accountsFlag';
import { Link } from 'react-router-dom';

const OUT: [string, string, string][] = [
  ['Looking up a word in the reader', 'Wiktionary', 'The single word you tapped.'],
  ['Searching for a podcast', 'Apple’s iTunes search', 'Your search words.'],
  ['Opening a podcast feed', 'The feed’s own host, through a public relay service (corsproxy.io or allorigins.win) when the host blocks direct reading', 'The feed address.'],
  ['The calendar of another country', 'LitCal', 'The year and the country you chose.'],
  ['Eastern Churches’ daily readings', 'Orthocal', 'The date and which calendar you chose.'],
  ['Maps and Time and place', 'OpenStreetMap tile servers', 'Your IP address and the map area you view, as with any website that shows a map.'],
  ['Watching a video or hearing a podcast player', 'YouTube (privacy-enhanced embed), Vimeo, Apple Podcasts or Spotify', 'Whatever those players collect when they load, as on their own sites.'],
  ['Viewing the original scan of a library text', 'The Internet Archive (archive.org), only after you press “View the original scan”', 'Your IP address and the book you opened, as on archive.org itself.'],
  ['Bible in a Year, LibriVox and the Creedal recordings', 'The publishers’ own audio servers', 'Your IP address, as for any download.'],
  ['Back up to Google Drive (you turn it on)', 'Google', 'Your backup file, under your own Google account.'],
  ['Host or join a live class', 'Public message relays (such as EMQX, HiveMQ or Mosquitto)', 'Sealed messages and your IP address. The relays cannot read the contents.'],
  ['Opening the public website', 'Sentry (error reports) and PostHog (page counts)', 'The error itself and the first part of the address only: that the reader was opened, for example, never which book, chapter, search or note. No cookies, no person profiles, no session recording. You can turn this off in Settings.'],
  ['Opening a link to another website', 'That website', 'Whatever the website collects.'],
];

/** only listed when accounts are switched on (src/lib/accountsFlag.ts) */
const SYNC_ROW: [string, string, string] = ['Sign in to sync (you turn it on)', 'The sync server you enter', 'Your account and your synced notes, highlights, journal and progress.'];

/** What stays on your device, what leaves it and when, in plain words. */
export default function PrivacyPage() {
  return (
    <div className="page">
      <h1>Privacy</h1>
      <p className="lede">Your notes and prayers belong to you. This page says exactly where they live and when anything leaves your device.</p>
      <h2>Stays on your device</h2>
      <ul>
        <li>Notes, highlights, bookmarks, folders, journal, plans, memorization, your prayer list and prayer log, class rosters and scores, and every setting.</li>
        <li>It lives in this browser’s own storage (IndexedDB and local storage). Clearing site data removes it, so use <Link to="/library?tab=export">Export and backup</Link> first.</li>
        <li>There is no advertising in this app, and nothing you read, search for or write is tracked. On the public website only, the app can send anonymous error reports and a count of which section is opened; both are named in the table of outside services on this page and can be turned off in Settings.</li>
        <li>The Bible text, the Catechism, the library and the lessons are part of the app, so reading them sends nothing anywhere.</li>
      </ul>
      <h2>When something leaves your device</h2>
      <p className="muted small">Only when you use these features, and only what is listed.</p>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="priv-table">
          <thead><tr><th scope="col">When you…</th><th scope="col">It talks to</th><th scope="col">What it sees</th></tr></thead>
          <tbody>{[...OUT, ...(accountsEnabled() ? [SYNC_ROW] : [])].map(([a, b, c]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>
      <h2>Your choices</h2>
      <ul>
        <li>Everything above is optional. Without sync and Drive backup, your writing never leaves the device.</li>
        <li>Error reports and page counts run only on the public website: never in the store apps, never in Kid mode, and never when your browser sends Do Not Track or Global Privacy Control. In the EU, the UK and the EEA nothing is sent until you agree, through the banner the app shows there or in Settings. The off switch is in Settings.</li>
        <li><Link to="/settings">Settings</Link> can delete all data on this device in one step.</li>
        <li>Live classes send messages through public relay servers while a class is running. The messages are sealed with a key made from the class code together with a random room key that the host device creates; the room key appears only on the host screen and in the join link and QR code. The relays cannot read them, and neither can anyone who knows the code alone, but they can see that traffic exists. Anyone who has the full join link can read the class, so treat the link like a room key and do not post it publicly.</li>
        <li>Notifications are scheduled on this device. Nothing is sent from a server.</li>
      </ul>
      <p className="muted small">If you find something that does not match this page, please tell us so we can fix the page or the app.</p>
    </div>
  );
}
