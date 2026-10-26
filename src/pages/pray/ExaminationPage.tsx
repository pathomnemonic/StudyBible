import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Collapsible, { ExpandAll } from '../../components/Collapsible';
import { CONTRITION, LENSES, PRAYER_BEFORE } from '../../data/examination';

interface State { on: string[]; notes: Record<string, string>; free: string }
const KEY = 'sb:exam';
const EMPTY: State = { on: [], notes: {}, free: '' };
const load = (): State | null => { try { const r = localStorage.getItem(KEY); return r ? { ...EMPTY, ...JSON.parse(r) } : null; } catch { return null; } };

/** An examination of conscience: pick a lens, tick what applies, write what does not fit a box, and take the list to Confession. Private by default; saved on this device only if you ask. */
export default function ExaminationPage() {
  const saved = useMemo(load, []);
  const [remember, setRemember] = useState(!!saved);
  const [st, setSt] = useState<State>(saved ?? EMPTY);
  const [lensId, setLensId] = useState(LENSES[0].id);
  const [open, setOpen] = useState<Set<string>>(new Set([LENSES[0].sections[0].id]));
  const [copied, setCopied] = useState(false);
  const lens = LENSES.find((l) => l.id === lensId)!;
  useEffect(() => {
    try { if (remember) localStorage.setItem(KEY, JSON.stringify(st)); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  }, [remember, st]);
  const on = useMemo(() => new Set(st.on), [st.on]);
  const toggle = (k: string) => setSt((s) => ({ ...s, on: s.on.includes(k) ? s.on.filter((x) => x !== k) : [...s.on, k] }));
  const setNote = (id: string, v: string) => setSt((s) => ({ ...s, notes: { ...s.notes, [id]: v } }));
  const count = (id: string) => lens.sections.find((x) => x.id === id)!.qs.filter((_, j) => on.has(`${id}.${j}`)).length + (st.notes[id]?.trim() ? 1 : 0);
  const allOpen = lens.sections.every((x) => open.has(x.id));
  const setAll = (o: boolean) => setOpen(o ? new Set(lens.sections.map((x) => x.id)) : new Set());
  const flip = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // everything marked across all lenses, in order, plus anything written
  const list = useMemo(() => {
    const out: { head: string; items: string[] }[] = [];
    for (const l of LENSES) for (const s of l.sections) {
      const items = s.qs.filter((_, j) => on.has(`${s.id}.${j}`));
      const note = st.notes[s.id]?.trim();
      if (note) items.push(`(in my own words) ${note}`);
      if (items.length) out.push({ head: `${l.title}: ${s.title}`, items });
    }
    if (st.free.trim()) out.push({ head: 'In my own words', items: [st.free.trim()] });
    return out;
  }, [on, st.notes, st.free]);
  const total = list.reduce((n, g) => n + g.items.length, 0);
  const asText = () => list.map((g) => `${g.head}\n${g.items.map((i) => `- ${i}`).join('\n')}`).join('\n\n');
  const copy = async () => { try { await navigator.clipboard.writeText(asText()); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } };
  const clear = () => { if (!total || confirm('Clear everything you marked and wrote?')) setSt(EMPTY); };

  return (
    <div className="page exam">
      <p><Link to="/pray">← Pray</Link></p>
      <h1>Examination of conscience</h1>
      <p className="lede">A quiet look back before Confession. Ask the Holy Spirit for light, and be honest and gentle with yourself.</p>
      <p className="exam-prayer"><em>{PRAYER_BEFORE}</em></p>

      <div className="tabbar" role="tablist" aria-label="Choose a way to examine">
        {LENSES.map((l) => <button key={l.id} role="tab" aria-selected={lensId === l.id} onClick={() => { setLensId(l.id); setOpen(new Set([l.sections[0].id])); }}>{l.title}</button>)}
      </div>
      <div className="row between" style={{ margin: '0 0 8px' }}>
        <p className="muted small" style={{ margin: 0 }}>{lens.blurb}</p>
        <ExpandAll all={allOpen} onChange={setAll} />
      </div>

      {lens.sections.map((s, i) => {
        const n = count(s.id);
        return (
          <Collapsible key={s.id} open={open.has(s.id)} onToggle={() => flip(s.id)}
            title={lens.id === 'commandments' ? `${i + 1}. ${s.title}` : s.title} sub={s.ref}
            badge={n > 0 ? <span className="coll-badge" aria-label={`${n} marked`}>{n}</span> : undefined}>
            {s.intro && <p className="muted small">{s.intro}</p>}
            <ul className="exam-qs">
              {s.qs.map((q, j) => (
                <li key={j}><label><input type="checkbox" checked={on.has(`${s.id}.${j}`)} onChange={() => toggle(`${s.id}.${j}`)} /><span>{q}</span></label></li>
              ))}
            </ul>
            <label className="exam-own">Something else here, in my own words
              <textarea rows={2} value={st.notes[s.id] ?? ''} onChange={(e) => setNote(s.id, e.target.value)} placeholder="Anything that does not fit the questions above" />
            </label>
          </Collapsible>
        );
      })}

      <section className="card">
        <h2 className="card-title">Anything else on my heart</h2>
        <p className="muted small">For what does not fit any of the boxes: a situation, a relationship, a question to ask the priest.</p>
        <textarea className="exam-free" rows={4} value={st.free} onChange={(e) => setSt((s) => ({ ...s, free: e.target.value }))} placeholder="Write freely. Only you can see this." aria-label="Anything else on my heart" />
      </section>

      <section className="card exam-sum" aria-live="polite">
        <h2 className="card-title">To bring to Confession {total > 0 && <span className="coll-badge">{total}</span>}</h2>
        {total === 0 ? <p className="muted">Nothing marked yet. Tick what applies and it will gather here.</p> : (
          <>
            {list.map((g) => <div key={g.head}><h3 className="exam-h">{g.head}</h3><ul className="list">{g.items.map((it, i) => <li key={i}>{it}</li>)}</ul></div>)}
            <p className="muted small">Confess the kind of sin and, for serious sins, roughly how often. You do not have to remember every detail.</p>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button className="btn small" onClick={copy}>{copied ? 'Copied' : 'Copy the list'}</button>
              <button className="btn small" onClick={() => window.print()}>Print</button>
              <button className="btn small ghost" onClick={clear}>Clear</button>
            </div>
          </>
        )}
        <label className="row small" style={{ gap: 8, marginTop: 10 }}><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> <span>Keep this on this device until I clear it. Off by default: nothing is saved, synced or sent anywhere, and it is gone when you leave the page.</span></label>
      </section>

      <section className="card">
        <h2 className="card-title">How to go to Confession</h2>
        <ol className="list">
          <li>Make the Sign of the Cross. Say how long since your last confession.</li>
          <li>Confess your sins to the priest, beginning with the most serious. Be simple and honest.</li>
          <li>Listen to his counsel and accept the penance he gives.</li>
          <li>Pray an Act of Contrition, and receive absolution.</li>
          <li>Do the penance soon, and thank God.</li>
        </ol>
        {CONTRITION.map((c) => <details key={c.name} className="exam-act"><summary>{c.name}</summary><p className="scripture"><em>{c.text}</em></p></details>)}
        <p className="muted small">A sin is mortal when it is grave matter, committed with full knowledge and deliberate consent (CCC 1857). If you are unsure whether something is serious, or whether you consented fully, ask the priest: that is part of what he is there for. This is an aid, not a substitute for his guidance.</p>
        <p className="small"><Link to="/pray/devotions/confession">Walk me through Confession</Link></p>
      </section>
    </div>
  );
}
