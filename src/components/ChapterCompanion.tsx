import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { providers, type StudyItem } from '../study/providers';
import { getCccScripture } from '../data/ccc';
import { getJson } from '../data/loader';
import { parseRefs } from '../lib/refs';
import type { Ref } from '../lib/refs';

interface Mass { date: string; slot: string }
const SLOT: Record<string, string> = { first_reading: 'First reading', second_reading: 'Second reading', gospel: 'Gospel', responsorial_psalm: 'Psalm' };
const shortDate = (iso: string) => new Date(iso + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

/** Everything that puts this chapter in context, folded under one line: where it happens, where else it is told, when the Church reads it, and its key verses. */
export default function ChapterCompanion({ book, anchorChapters, chapterRef }: { book: string; anchorChapters: number[]; chapterRef: Ref }) {
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<StudyItem[]>([]);
  const [related, setRelated] = useState<StudyItem[]>([]);
  const [mass, setMass] = useState<Mass[]>([]);
  const [keys, setKeys] = useState<{ v: number; n: number }[]>([]);
  const key = `${book}.${anchorChapters.join(',')}`;
  useEffect(() => {
    if (!open) return;
    let live = true;
    providers.places([chapterRef]).then((l) => live && setPlaces(l.slice(0, 8))).catch(() => undefined);
    providers.parallels([chapterRef]).then((l) => live && setRelated(l.filter((x) => ['Gospel parallel', 'Parable', 'Miracle', 'Biblical theme', 'Prophecy', 'Fulfilment'].includes(x.kind ?? '')).slice(0, 6))).catch(() => undefined);
    getCccScripture(book).then((cites) => {
      if (!live) return;
      const m = new Map<number, number>();
      for (const [c1, v1, c2, v2, , q] of cites ?? []) if (c1 === c2 && anchorChapters.includes(c1) && q) for (let v = v1; v <= Math.min(v2, v1 + 5); v++) m.set(v, (m.get(v) ?? 0) + 1);
      setKeys([...m.entries()].map(([v, n]) => ({ v, n })).sort((a, b) => b.n - a.n).slice(0, 4).sort((a, b) => a.v - b.v));
    });
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([2026, 2027].map((y) => getJson<{ days: Record<string, { t: string; r: Record<string, string> }> }>(`lectionary/${y}.json`, true).catch(() => null))).then((yrs) => {
      if (!live) return;
      const out: Mass[] = [];
      for (const y of yrs) for (const [date, d] of Object.entries(y?.days ?? {}).sort()) {
        if (date < today || out.length >= 3) continue;
        for (const [slot, txt] of Object.entries(d.r)) {
          if (!SLOT[slot]) continue;
          const p = parseRefs(txt);
          if (p.ok && p.refs.some(({ ref }) => ref.book === book && ref.c1 <= Math.max(...anchorChapters) && ref.c2 >= Math.min(...anchorChapters))) { out.push({ date, slot }); break; }
        }
      }
      setMass(out);
    });
    return () => { live = false; };
  }, [open, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <details className="chapter-companion" onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>About this chapter: where, when and how it connects</summary>
      {open && (
        <div className="cc-body">
          {places.length > 0 && <div><span className="eyebrow">Where</span><div className="chips">{places.map((p) => <Link key={p.id} className="chip" to={p.internal ?? '/study/maps'}>{p.title}</Link>)}</div></div>}
          {related.length > 0 && <div><span className="eyebrow">Connected</span><div className="chips">{related.map((r) => <Link key={r.id} className="chip" to={r.internal ?? '/study/synopsis'} title={r.excerpt}>{r.kind === 'Gospel parallel' ? `${r.title}: ${(r.excerpt ?? '').replace('See also: ', '').split(' · ')[0] || 'also in other Gospels'}` : `${r.kind}: ${r.title}`}</Link>)}</div></div>}
          {mass.length > 0 && <div><span className="eyebrow">Read at Mass</span><div className="chips">{mass.map((m) => <Link key={m.date + m.slot} className="chip" to={`/pray/readings/${m.date}`}>{shortDate(m.date)} · {SLOT[m.slot]}</Link>)}</div></div>}
          {keys.length > 0 && <div><span className="eyebrow">Key verses (quoted in the Catechism)</span><div className="chips">{keys.map((k) => <Link key={k.v} className="chip" to={`?v=${k.v}`} replace>verse {k.v}</Link>)}</div></div>}
          {!places.length && !related.length && !mass.length && !keys.length && <p className="muted small">Nothing to add for this chapter.</p>}
        </div>
      )}
    </details>
  );
}
