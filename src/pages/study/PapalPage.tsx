import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getJson } from '../../data/loader';

interface PDoc { t: string; title: string; date: string; url: string; lang: string }
interface Pope { id: string; name: string; years: string; docs: PDoc[] }
const LANG: Record<string, string> = { en: 'English', la: 'Latin', it: 'Italian', fr: 'French', es: 'Spanish', de: 'German', pt: 'Portuguese' };

/** A catalogue of papal writings from Pius IX to today, linked to the official texts at the Vatican. The texts themselves are not copied. */
export default function PapalPage() {
  const [popes, setPopes] = useState<Pope[] | null>(null);
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const pope = sp.get('pope') ?? '';
  const type = sp.get('type') ?? '';
  useEffect(() => { getJson<Pope[]>('papal/index.json', true).then((x) => setPopes(x ?? [])); }, []);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const types = useMemo(() => [...new Set((popes ?? []).flatMap((p) => p.docs.map((d) => d.t)))].sort(), [popes]);
  const f = q.trim().toLowerCase();
  const shown = useMemo(() => (popes ?? []).filter((p) => !pope || p.id === pope).map((p) => ({ ...p, docs: p.docs.filter((d) => (!type || d.t === type) && (!f || `${d.title} ${d.t} ${d.date} ${p.name}`.toLowerCase().includes(f))) })).filter((p) => p.docs.length), [popes, pope, type, f]);
  const total = (popes ?? []).reduce((n, p) => n + p.docs.length, 0);
  return (
    <div className="page">
      <h1>Papal writings</h1>
      <p className="lede">{total ? total.toLocaleString() : 'More than a thousand'} documents from Pius IX (1846) to today: encyclicals, apostolic exhortations, constitutions and letters, motu proprio, bulls, briefs and letters. Each opens at the Vatican’s own site, in English where the Vatican has published it.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a title, a year or a pope…" aria-label="Find a papal document" style={{ flex: 1, minWidth: 220, maxWidth: 420 }} />
        <select value={pope} onChange={(e) => set('pope', e.target.value)} aria-label="Pope"><option value="">Every pope</option>{(popes ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.years})</option>)}</select>
        <select value={type} onChange={(e) => set('type', e.target.value)} aria-label="Kind of document"><option value="">Every kind</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <p className="muted small">Older encyclicals whose English translations are in the public domain can also be read in full, with notes, in <Link to="/study/church">Councils and Church documents</Link>. Speeches, homilies, audiences and messages are not listed here: the Vatican site has them by pope.</p>
      {!popes && <p className="muted">Loading…</p>}
      {shown.map((p) => (
        <section key={p.id} className="sect">
          <h2 className="eyebrow-h">{p.name} · {p.years} · {p.docs.length}</h2>
          <ul className="list">
            {p.docs.slice(0, f || pope || type ? 500 : 60).map((d) => (
              <li key={d.url}>
                <a className="t" href={d.url} target="_blank" rel="noreferrer">{d.title}</a>
                <span className="muted small"> · {d.t}{d.date ? ` · ${d.date}` : ''}{d.lang !== 'en' ? ` · ${LANG[d.lang] ?? d.lang} text only` : ''}</span>
              </li>
            ))}
          </ul>
          {p.docs.length > 60 && !(f || pope || type) && <button className="linklike small" onClick={() => set('pope', p.id)}>All {p.docs.length} from {p.name} →</button>}
        </section>
      ))}
      {popes && !shown.length && <p className="muted">Nothing matches.</p>}
      <p className="muted small">The list was gathered from the Vatican’s index pages and may miss recent or unlisted documents. Popes before Pius IX (including earlier encyclicals) are not yet listed. Texts are © their publisher (usually Libreria Editrice Vaticana); this page only links to them.</p>
    </div>
  );
}
