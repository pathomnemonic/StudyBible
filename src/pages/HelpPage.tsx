import { Link } from 'react-router-dom';
import { Group } from '../components/Hub';
import { RowLink } from '../components/Hub';

const FIND: [string, string, string][] = [
  ['/study/apologetics-tracks', 'Answers to hard questions', 'Learn tab, then Answer hard questions'],
  ['/learn', 'Concordance, outlines, key words, Greek and Hebrew', 'Learn tab, then Bible study (also the toolbox on the Bible page)'],
  ['/listen', 'Bible in a Year', 'Media tab, then Year'],
  ['/listen?tab=audiobooks', 'The saints’ books read aloud', 'Media tab, then Books'],
  ['/pray/readings', 'Today’s Mass readings', 'Pray tab'],
  ['/pray/rosary', 'The Rosary', 'Pray tab'],
  ['/play', 'Games, alone or with friends', 'Learn tab, then Games'],
  ['/study/curriculum', 'Catechism lessons for every age', 'Learn tab'],
  ['/library?tab=export', 'Back up your notes', 'You tab, then Backup'],
  ['/settings', 'Text size, colors, reminders, language', 'You tab, then Settings'],
];

/** Where things are, how the buttons work, and a way to see the tour again. */
export default function HelpPage() {
  return (
    <div className="page help">
      <Link to="/profile" className="small">← You</Link>
      <h1>Help</h1>
      <p className="lede">Short answers to “where is…?” and “how do I…?”.</p>
      <div className="btn-row" style={{ margin: '8px 0 16px' }}>
        <button className="btn primary" onClick={() => window.dispatchEvent(new Event('studybible:tour'))}>Take the tour again</button>
        <Link className="btn" to="/more">Every page in the app</Link>
      </div>

      <Group open title="Where do I find…?">
        <div className="rows">{FIND.map(([to, t, where]) => <RowLink key={to} to={to} title={t} meta={where} />)}</div>
      </Group>

      <Group open title="On the Bible page">
        <ul className="small bullets">
          <li><strong>The little number beside a verse</strong> opens everything gathered around it: the Church Fathers and saints, the Catechism, cross-references and more.</li>
          <li><strong>Arrows</strong> at either end of the top bar move to the next and previous chapter.</li>
          <li><strong>The books button</strong> (the library icon) changes the book and chapter, and also holds the translation, Find in this chapter and Compare translations.</li>
          <li><strong>Search</strong> finds any verse, word, saint or page in the app. On a keyboard, press Ctrl+K or ⌘K.</li>
          <li><strong>The toolbox</strong> holds read aloud, focus mode, reading settings and the study tools.</li>
        </ul>
      </Group>

      <Group title="Questions">
        <details><summary>How do I follow a different reading plan?</summary><p className="small">Open <Link to="/pray/plans">Reading plans</Link> and start one. Only one plan is followed at a time: starting another pauses the first, and you can pick it up again later.</p></details>
        <details><summary>How do I turn off the red dots and tips?</summary><p className="small">In <Link to="/settings">Settings</Link>, under Tips and red dots.</p></details>
        <details><summary>Does it work without a connection?</summary><p className="small">The app itself, your notes and your highlights work offline. A Bible translation, commentary or audio works offline only once you have opened it before or downloaded it. Check what is saved, and download more ahead of time, in <Link to="/downloads">Downloads</Link>.</p></details>
        <details><summary>Where is my data kept?</summary><p className="small">On this device. Nothing is sent anywhere unless you sign in to sync or connect a backup. See <Link to="/privacy">Privacy</Link>.</p></details>
        <details><summary>Something looks out of date or wrong</summary><p className="small">Close the app completely and open it again while online, so it can fetch the newest data. If a screen still misbehaves, <Link to="/about">About and feature status</Link> shows what is working.</p></details>
      </Group>
    </div>
  );
}
