import { Link } from 'react-router-dom';

const OUT: [string, string, string][] = [
  ['Looking up a word in the reader', 'Wiktionary', 'The single word you tapped.'],
  ['Searching for a podcast', 'Apple’s iTunes search', 'Your search words.'],
  ['Opening a podcast feed', 'The feed’s own host, through a public relay service (corsproxy.io or allorigins.win) when the host blocks direct reading', 'The feed address.'],
  ['The calendar of another country', 'LitCal', 'The year and the country you chose.'],
  ['Eastern Churches’ daily readings', 'Orthocal', 'The date and which calendar you chose.'],
  ['Maps and Time and place', 'OpenStreetMap tile servers', 'Your IP address and the map area you view, as with any website that shows a map.'],
  ['Watching a video or hearing a podcast player', 'YouTube (privacy-enhanced embed), Vimeo, Apple Podcasts or Spotify', 'Whatever those players collect when they load, as on their own sites.'],
  ['Bible in a Year, LibriVox and the Creedal recordings', 'The publishers’ own audio servers', 'Your IP address, as for any download.'],
  ['Back up to Google Drive (you turn it on)', 'Google', 'Your backup file, under your own Google account.'],
  ['Sign in to sync (you turn it on)', 'The sync server you enter', 'Your account and your synced notes, highlights, journal and progress.'],
  ['Host or join a live class', 'Public message relays (such as EMQX, HiveMQ or Mosquitto)', 'Sealed messages and your IP address. The relays cannot read the contents.'],
  ['Opening a link to another website', 'That website', 'Whatever the website collects.'],
];

/** What stays on your device, what leaves it and when, in plain words. */
export default function PrivacyPage() {
  return (
    <div className="page">
      <p><Link to="/about">← About</Link></p>
      <h1>Privacy</h1>
      <p className="lede">Your notes and prayers belong to you. This page says exactly where they live and when anything leaves your device.</p>
      <h2>Stays on your device</h2>
      <ul>
        <li>Notes, highlights, bookmarks, folders, journal, plans, memorization, your prayer list and prayer log, class rosters and scores, and every setting.</li>
        <li>It lives in this browser’s own storage (IndexedDB and local storage). Clearing site data removes it, so use <Link to="/library?tab=export">Export and backup</Link> first.</li>
        <li>There is no advertising, no tracking and no analytics in this app.</li>
        <li>The Bible text, the Catechism, the library and the lessons are part of the app, so reading them sends nothing anywhere.</li>
      </ul>
      <h2>When something leaves your device</h2>
      <p className="muted small">Only when you use these features, and only what is listed.</p>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="priv-table">
          <thead><tr><th scope="col">When you…</th><th scope="col">It talks to</th><th scope="col">What it sees</th></tr></thead>
          <tbody>{OUT.map(([a, b, c]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td><td>{c}</td></tr>)}</tbody>
        </table>
      </div>
      <h2>Your choices</h2>
      <ul>
        <li>Everything above is optional. Without sync and Drive backup, your writing never leaves the device.</li>
        <li><Link to="/settings">Settings</Link> can delete all data on this device in one step.</li>
        <li>Live classes send messages through public relay servers while a class is running. The messages are sealed with a key made from the class code, so the relays cannot read them, but they can see that traffic exists. Anyone who has the class code can read the class, so treat it like a room key and do not post it publicly.</li>
        <li>Notifications are scheduled on this device. Nothing is sent from a server.</li>
      </ul>
      <p className="muted small">If you find something that does not match this page, please tell us so we can fix the page or the app.</p>
    </div>
  );
}
