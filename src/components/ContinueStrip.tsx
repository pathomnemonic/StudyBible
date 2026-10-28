import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';

type Kind = 'read' | 'work' | 'episode' | 'catechism';
const LABEL: Record<Kind, string> = { read: 'Bible', work: 'Library', episode: 'Listening', catechism: 'Catechism' };

/** The last thing you opened in each of a few areas, as one row of buttons. Nothing shows until there is something to continue. */
export default function ContinueStrip({ kinds }: { kinds: Kind[] }) {
  const [s] = useSettings();
  const items = useLiveQuery(async () => {
    const rows = await db.history.orderBy('ts').reverse().limit(200).toArray();
    return kinds.map((k) => rows.find((r) => r.type === k)).filter((r): r is NonNullable<typeof r> => !!r);
  }, [kinds.join(',')]);
  if (!items?.length) return null;
  const to = (type: string, ref: string) => {
    if (type === 'read') { const [b, c] = ref.split('.'); return `/read/${s.defaultEdition}/${b}/${c}`; }
    if (type === 'work') return `/room/work/${ref}`;
    if (type === 'episode') return `/listen/episode/${ref}`;
    return `/study/catechism/${ref}`;
  };
  return (
    <nav className="continue-strip" aria-label="Continue where you left off">
      {items.map((r) => (
        <Link key={r.type} className="continue-chip" to={to(r.type, r.ref)}>
          <span className="continue-k">{LABEL[r.type as Kind]}</span>
          <span className="continue-t">{r.label}</span>
        </Link>
      ))}
    </nav>
  );
}
