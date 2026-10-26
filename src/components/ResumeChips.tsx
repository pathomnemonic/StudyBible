import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { getBook } from '../lib/canon';

/** Three ways back in: the chapter you were reading, the work in the reading room, the Bible in a Year episode. Each starts something if there is nothing to resume. */
export default function ResumeChips() {
  const [s] = useSettings();
  const hist = useLiveQuery(() => db.history.orderBy('ts').reverse().limit(80).toArray(), []) ?? [];
  const plan = useLiveQuery(() => db.planProgress.get('biay'), []);
  const work = hist.find((h) => h.type === 'work');
  const ep = hist.find((h) => h.type === 'episode');
  const day = plan ? Math.min(365, Math.max(1, Math.floor((Date.now() - plan.startedAt) / 86400000) + 1 + plan.offsetDays)) : null;
  const bible = s.last ? { to: `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}`, text: `${getBook(s.last.book)?.name ?? s.last.book} ${s.last.chapter}` } : { to: `/read/${s.defaultEdition}/JHN/1`, text: 'Begin' };
  const short = (t: string) => (t.length > 70 ? t.slice(0, 68).trimEnd() + '…' : t);
  const chips = [
    { key: 'bible', to: bible.to, kind: 'Bible', text: bible.text, resume: !!s.last },
    { key: 'room', to: work ? `/study/works/${work.ref}` : '/room', kind: 'Reading room', text: work ? short(work.label.replace(/^.*?:\s*/, '')) : 'Browse', resume: !!work },
    { key: 'year', to: ep ? `/listen/episode/${ep.ref}` : '/listen', kind: 'Bible in a Year', text: ep ? short(ep.label.replace(/^Day (\d+).*$/, 'Day $1')) : day ? `Day ${day}` : 'Listen', resume: !!ep || !!day },
  ];
  return (
    <>
    <nav className="resume-chips" aria-label="Pick up where you left off">
      {chips.map((c) => (
        <Link key={c.key} className={`resume-chip${c.resume ? ' on' : ''}`} to={c.to}>
          <span className="k">{c.kind}</span>
          <span className="v">{c.text}</span>
        </Link>
      ))}
    </nav>
    </>
  );
}
