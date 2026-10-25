import { Link } from 'react-router-dom';
import { useSettings } from '../lib/store';
import WhatsNew from '../components/WhatsNew';
import WeekCard from '../components/WeekCard';
import ContinueRow from '../components/ContinueRow';

type Row = [string, string, string];
const GROUPS: { title: string; items: Row[] }[] = [
  { title: 'Read', items: [
    ['/read', 'The Bible', 'Pick up where you left off, or choose any book and chapter.'],
    ['/pray/readings', 'Mass readings', 'The day’s readings, printed in full in your translation.'],
    ['/pray/plans', 'Reading plans', 'Follow a plan through the Bible or a theme, with progress kept.'],
    ['/listen', 'Bible in a Year', 'Daily episodes mapped to the passages they read.'],
    ['/days', 'Favourite days', 'Days you starred on Today, a date picker, and your week at a glance.'],
    ['/study/catechism', 'Catechism of the Catholic Church', 'The full text, paragraph by paragraph, with search and Scripture links.'],
    ['/study/gallery', 'Gallery', 'Paintings and engravings of Bible scenes; compare two of the same scene.'],
    ['/study/paths', 'Study paths', 'Guided journeys through a theme, with the Fathers and a question.'],
    ['/study/fathers', 'Reading room', 'Saints, Fathers and catechisms to read in full.'],
    ['/study/church', 'Councils and Church documents', 'Read in full where public domain, official links for the rest.'],
  ] },
  { title: 'Pray and rest', items: [
    ['/pray', 'Prayer', 'Everything for prayer in one place.'],
    ['/pray/lectio', 'Lectio Divina', 'Read, meditate, pray, rest, with a gentle timer.'],
    ['/session', 'A quiet moment', 'A guided ten-minute pause.'],
    ['/pray/sleep', 'Sleep mode', 'A psalm read slowly while the sound fades.'],
    ['/pray/journal', 'Prayer journal', 'Reflections and intentions, private to this device.'],
    ['/memorize', 'Memorize Scripture', 'Spaced repetition and audio recall.'],
  ] },
  { title: 'Study', items: [
    ['/study', 'Study home', 'Search and browse all the study tools.'],
    ['/study/search', 'Search everything', 'Verses, words, notes, the Fathers.'],
    ['/study/quotations', 'Who quoted this verse?', 'Every Father and saint who cites a passage.'],
    ['/study/terms', 'Key words and phrases', 'What they mean and where they occur.'],
    ['/study/books', 'Books and outlines', 'An introduction to each of the 73 books.'],
    ['/study/synopsis', 'Gospel comparison', 'Four Gospels side by side.'],
    ['/study/doctrine', 'Doctrine and Catechism', 'Topics with Scripture and Catechism links.'],
    ['/study/universe', 'Scripture universe', 'The canon and the library as a galaxy.'],
    ['/study/timespace', 'Time and place', 'Slide through the biblical story with the map.'],
    ['/study/maps', 'Maps', 'Places named in Scripture.'],
    ['/study/fulfilment', 'Promise and fulfilment', 'Types and prophecies in the Fathers’ words.'],
    ['/study/manuscripts', 'Manuscripts', 'Real pages, zoomable.'],
  ] },
  { title: 'Your things', items: [
    ['/library', 'Notes, highlights and bookmarks', 'Everything you have written or marked.'],
    ['/share', 'Share a verse', 'Make a picture of a verse, with a painting if you like.'],
    ['/library?tab=export', 'Export and backup', 'JSON, Markdown, PDF and EPUB.'],
  ] },
  { title: 'The app', items: [
    ['/settings', 'Settings', 'Translation, language, theme, offline, reminders.'],
    ['/account', 'Account and sync', 'Optional; your data stays on this device without it.'],
    ['/study/sources', 'Sources and licensing', 'Where every text comes from and what is only linked.'],
    ['/about', 'About', 'What this app is and is not.'],
  ] },
];

/** A plain map of everything in the app, so nothing depends on finding the right route. */
export default function MorePage() {
  const [s] = useSettings();
  return (
    <div className="page">
      <h1>Everything in Study Bible</h1>
      <p className="lede">Every part of the app, in one list. The five tabs (Profile, Study, Today, Bible, Listen) are shortcuts to the places you use most; this page is the full map.</p>
      <div className="tool-groups">
        {GROUPS.map((g) => (
          <section key={g.title} className="tool-group">
            <h2>{g.title}</h2>
            <ul>
              {g.items.map(([to, t, d]) => (
                <li key={to}>
                  <Link to={to === '/read' && s.last ? `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}` : to}>
                    <span className="t">{t}</span>
                    <span className="d">{d}</span>
                    <span className="go" aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
