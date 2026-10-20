import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { getJson } from '../data/loader';
import { getBook } from '../lib/canon';

interface PathMeta { id: string; title: string; steps: number }

/** The last few things you were in the middle of: the chapter, a saint's work, a study path, an episode. */
export default function ContinueRow({ max = 4 }: { max?: number }) {
  const [s] = useSettings();
  const hist = useLiveQuery(() => db.history.orderBy('ts').reverse().limit(60).toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.cache.filter((r) => r.key.startsWith('path:')).toArray(), []) ?? [];
  const [paths, setPaths] = useState<PathMeta[]>([]);
  useEffect(() => { getJson<{ paths: PathMeta[] }>('paths/index.json', true).then((d) => setPaths(d?.paths ?? [])); }, []);
  const items: { key: string; to: string; kind: string; label: string; ts: number }[] = [];
  if (s.last) items.push({ key: 'read', to: `/read/${s.last.edition}/${s.last.book}/${s.last.chapter}`, kind: 'Bible', label: `${getBook(s.last.book)?.name ?? s.last.book} ${s.last.chapter}`, ts: hist.find((h) => h.type === 'read')?.ts ?? 0 });
  const w = hist.find((h) => h.type === 'work');
  if (w) items.push({ key: 'work', to: `/study/works/${w.ref}`, kind: 'Reading room', label: w.label, ts: w.ts });
  const ep = hist.find((h) => h.type === 'episode');
  if (ep) items.push({ key: 'ep', to: `/listen/episode/${ep.ref}`, kind: 'Bible in a Year', label: ep.label, ts: ep.ts });
  const open = progress.map((r) => ({ r, p: paths.find((x) => r.key === `path:${x.id}`) })).filter((x) => x.p && (x.r.value as number) > 0 && (x.r.value as number) < x.p.steps).sort((a, b) => b.r.ts - a.r.ts)[0];
  if (open?.p) items.push({ key: 'path', to: `/study/path/${open.p.id}`, kind: 'Study path', label: `${open.p.title}: step ${(open.r.value as number) + 1} of ${open.p.steps}`, ts: open.r.ts });
  items.sort((a, b) => b.ts - a.ts);
  if (!items.length) return null;
  return (
    <section className="continue-row" aria-label="Continue where you left off">
      <h2 className="eyebrow-h">Continue</h2>
      <div className="shelf">
        {items.slice(0, max).map((i) => (
          <Link key={i.key} className="shelf-card" to={i.to}>
            <span className="d">{i.kind}</span>
            <span className="t">{i.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
