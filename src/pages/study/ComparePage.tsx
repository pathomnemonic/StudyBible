import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDoctrine, type DoctrineData, type DoctrineTopic } from '../../data/content';
import { cccRange, type CccPara } from '../../data/ccc';
import { parseQuery, searchLibrary, type Snip } from '../../search/engine';

const clip = (t: string, n = 340) => (t.length > n ? `${t.slice(0, n).replace(/\s+\S*$/, '')}…` : t);

/** One doctrine, three witnesses side by side: what the Catechism says, what the Church's documents say, and what the Fathers wrote. */
export default function ComparePage() {
  const [sp, setSp] = useSearchParams();
  const [d, setD] = useState<DoctrineData | null>(null);
  const id = sp.get('topic') ?? '';
  const topic: DoctrineTopic | undefined = d?.topics.find((t) => t.id === id);
  const [paras, setParas] = useState<CccPara[]>([]);
  const [fathers, setFathers] = useState<Snip[]>([]);
  useEffect(() => { getDoctrine().then(setD); }, []);
  useEffect(() => {
    setParas([]); setFathers([]);
    if (!topic) return;
    let live = true;
    const [a, b] = topic.ccc[0] ?? [0, 0];
    if (a) cccRange(a, Math.min(b, a + 2)).then((r) => live && setParas(r));
    const word = topic.keywords.find((k) => /^[a-z]{5,}$/i.test(k)) ?? topic.title.split(/\s+/).find((w) => w.length >= 5) ?? topic.title;
    searchLibrary(parseQuery(word)).then((r) => live && setFathers(r.filter((s) => s.authority === 'father').slice(0, 4))).catch(() => undefined);
    return () => { live = false; };
  }, [topic?.id]);
  const docs = useMemo(() => (topic && d ? topic.docs.map((x) => d.documents[x]).filter(Boolean) : []), [topic, d]);
  return (
    <div className="page compare">
      <h1>Compare the sources</h1>
      <label className="small">Doctrine
        <select value={id} onChange={(e) => setSp(e.target.value ? { topic: e.target.value } : {}, { replace: true })} aria-label="Doctrine">
          <option value="">Choose a doctrine…</option>
          {(d?.topics ?? []).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </label>
      {!topic && <p className="muted">Pick a doctrine such as the Eucharist or Mary to see the Catechism, Church documents and the Fathers side by side.</p>}
      {topic && (
        <div className="compare-cols">
          <section className="card" aria-label="The Catechism">
            <h2 className="eyebrow-h">The Catechism</h2>
            {paras.map((p) => <p key={p.n}>{clip(p.t)} <Link className="chip" to={`/study/catechism/${p.n}`}>§{p.n}</Link></p>)}
            {!paras.length && <p className="muted small">Loading…</p>}
          </section>
          <section className="card" aria-label="Church documents">
            <h2 className="eyebrow-h">Church documents</h2>
            {docs.map((x) => <p key={x.title}><strong>{x.title}</strong><br />{clip(x.body, 220)} {x.url && <a className="chip" href={x.url} target="_blank" rel="noreferrer">Read</a>}</p>)}
            {!docs.length && <p className="muted small">No document is listed for this topic yet.</p>}
          </section>
          <section className="card" aria-label="The Fathers">
            <h2 className="eyebrow-h">The Fathers</h2>
            {fathers.map((f) => <p key={f.id}><strong>{f.subtitle}</strong><br />{clip(f.snippet ?? '', 240)} {f.href && <Link className="chip" to={f.href}>Read</Link>}</p>)}
            {!fathers.length && <p className="muted small">Searching the library…</p>}
          </section>
        </div>
      )}
      {topic && <p><Link className="btn small ghost" to={`/study/topics/${topic.id}`}>All about {topic.title}</Link></p>}
    </div>
  );
}
