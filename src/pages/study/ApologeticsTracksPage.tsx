import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GROUPS, INAPP_LABEL, PROGRESS_KEY, RESOURCE_KINDS, TRACKS_BASE, APOL_EVENT, groupOf, isDone, levelPercent, loadTracks, levelComplete, nextStep, readNotes, readProgress, resolveInapp,
  resourceOf, saveNote, setStepDone, stepId, stepMinutes, trackMinutes, trackPath, trackPercent, validateTrack,
  type Level, type ProgressMap, type Resolved, type Resource, type Step, type Track,
} from '../../lib/apolTracks';
import ProgressRing from '../../components/apol/ProgressRing';
import DrillPlayer from '../../components/apol/DrillPlayer';

/** Live view of the saved progress; re-reads when it changes in this tab or another. */
function useProgress(): ProgressMap {
  const sub = useCallback((cb: () => void) => { window.addEventListener(APOL_EVENT, cb); window.addEventListener('storage', cb); return () => { window.removeEventListener(APOL_EVENT, cb); window.removeEventListener('storage', cb); }; }, []);
  const raw = useSyncExternalStore(sub, () => { try { return localStorage.getItem(PROGRESS_KEY) ?? ''; } catch { return ''; } }, () => '');
  return useMemo(() => readProgress(), [raw]);
}
function useTracks() {
  const [ts, setTs] = useState<Track[] | null>(null);
  useEffect(() => { loadTracks().then((x) => setTs(x.filter((t) => validateTrack(t).length === 0 || t.levels?.length === 4))); }, []);
  return ts;
}
const niceDate = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); return m ? `${+m[3]} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1]} ${m[1]}` : iso; };
const hours = (min: number) => (min >= 90 ? `about ${Math.round(min / 30) / 2} hours` : `about ${min} minutes`);

/* ---------------------------------------------------------------- hub */
function Hub() {
  const tracks = useTracks();
  const prog = useProgress();
  const [q, setQ] = useState('');
  if (!tracks) return <div className="page apt"><p className="center-note">Loading…</p></div>;
  const f = q.trim().toLowerCase();
  const match = (t: Track) => !f || `${t.title} ${t.tagline} ${groupOf(t.group)?.title ?? ''} ${t.resources.map((r) => `${r.title} ${r.creator}`).join(' ')}`.toLowerCase().includes(f);
  const cont = tracks.filter((t) => { const p = prog[t.id]; return p && p.done.length > 0 && trackPercent(t, prog) < 100; }).sort((a, b) => (prog[b.id].last ? 1 : 0) - (prog[a.id].last ? 1 : 0)).slice(0, 3);
  const shown = tracks.filter(match);
  return (
    <div className="page apt">
      <h1>Learn to answer</h1>
      <p className="lede">Pick a question people ask about the faith and grow step by step: understand it, make the case, meet the hard objections, then read the sources. Take it slowly. Listening well matters as much as knowing the answer.</p>
      <p className="apt-note"><strong>How these tracks are made.</strong> We point to the best free resources and to sourced material already in this app. Links were checked on the date shown beside each one. We do not write new arguments here, and a link is not an endorsement of everything its author says. Where another side speaks in its own voice, we say so.</p>
      <label className="visually-hidden" htmlFor="apt-search">Search the tracks</label>
      <input id="apt-search" type="search" className="apt-search" placeholder="Search: atheism, Mormon, Islam, natural law…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!tracks.length && <p className="callout">The tracks are still being prepared. Please check back soon.</p>}
      {!f && cont.length > 0 && (
        <section aria-labelledby="apt-cont">
          <h2 id="apt-cont">Continue where you left off</h2>
          <div className="apt-grid">{cont.map((t) => <TrackCard key={t.id} t={t} p={prog} cont />)}</div>
        </section>
      )}
      <h2>I want to answer…</h2>
      {GROUPS.map((g) => {
        const list = shown.filter((t) => t.group === g.id);
        if (!list.length) return null;
        return (
          <section key={g.id} aria-labelledby={`apt-g-${g.id}`}>
            <h3 id={`apt-g-${g.id}`} className="apt-gh"><span aria-hidden="true">{g.icon}</span> {g.title}</h3>
            <p className="muted small apt-gb">{g.blurb}</p>
            <div className="apt-grid">{list.map((t) => <TrackCard key={t.id} t={t} p={prog} />)}</div>
          </section>
        );
      })}
      {f && !shown.length && tracks.length > 0 && <p className="muted">Nothing matches “{q}”. Try a shorter word.</p>}
      <p className="muted small">Looking for quick answers to single questions? See <Link to="/study/apologetics">Questions about the faith</Link>. To practise on your own, try <Link to="/study/claims">Is that true?</Link> and <Link to="/study/arguments">the Argument Map</Link>.</p>
    </div>
  );
}

function TrackCard({ t, p, cont }: { t: Track; p: ProgressMap; cont?: boolean }) {
  const pct = trackPercent(t, p);
  const nx = nextStep(t, p);
  return (
    <Link className="apt-card" to={trackPath(t.id)}>
      <ProgressRing pct={pct} label={`${t.title}: ${pct} percent done`} />
      <span className="apt-card-body">
        <strong>{t.title}</strong>
        <span className="muted small">{t.tagline}</span>
        <span className="apt-meta small">{cont && nx ? `Next: level ${nx.level}, step ${nx.index + 1}` : `4 levels · ${hours(trackMinutes(t))}`}</span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------- track */
function ResourceCard({ r, why }: { r: Resource; why: string }) {
  const k = RESOURCE_KINDS[r.kind] ?? { label: r.kind, icon: '🔗' };
  return (
    <div className="apt-res">
      <div className="apt-chips">
        <span className="chip"><span aria-hidden="true">{k.icon}</span> {k.label}</span>
        <span className={`chip ${r.free ? 'good' : 'warn'}`}>{r.free ? 'Free' : 'Paid or sign-in'}</span>
        {r.minutes ? <span className="chip">{r.minutes} min</span> : null}
      </div>
      <h4 className="apt-title">{r.title}</h4>
      <p className="muted small apt-by">{r.creator}</p>
      <p className="apt-why">{why}</p>
      {r.note && <p className="muted small">{r.note}</p>}
      <p className="apt-open">
        <a className="btn small primary" href={r.url} target="_blank" rel="noopener noreferrer">Open <span aria-hidden="true">↗</span><span className="visually-hidden"> {r.title} (opens another site)</span></a>
        <span className="muted small"> Opens another site · checked {niceDate(r.verified)}</span>
      </p>
    </div>
  );
}

function InappCard({ s }: { s: Extract<Step, { kind: 'inapp' }> }) {
  const [r, setR] = useState<Resolved | null>(null);
  useEffect(() => { let live = true; resolveInapp(s).then((x) => live && setR(x)); return () => { live = false; }; }, [s.type, s.id, s.section]);
  const meta = INAPP_LABEL[s.type];
  return (
    <div className="apt-res">
      <div className="apt-chips"><span className="chip"><span aria-hidden="true">{meta?.icon}</span> {meta?.label ?? 'In this app'}</span><span className="chip good">In this app</span></div>
      <h4 className="apt-title">{r ? (r.found ? r.title : 'This item is not available') : 'Loading…'}</h4>
      <p className="apt-why">{s.why}</p>
      {r?.found && <p className="apt-open"><Link className="btn small primary" to={r.to}>Open</Link></p>}
    </div>
  );
}

function ReflectCard({ t, sid, prompt }: { t: Track; sid: string; prompt: string }) {
  const [text, setText] = useState(() => readNotes()[`${t.id}:${sid}`] ?? '');
  return (
    <div className="apt-res">
      <div className="apt-chips"><span className="chip"><span aria-hidden="true">✍️</span> Reflect</span></div>
      <p className="apt-why"><strong>{prompt}</strong></p>
      <label className="small muted" htmlFor={`n-${sid}`}>Your private note (saved only on this device, optional)</label>
      <textarea data-no-dirty id={`n-${sid}`} className="apt-ta" rows={3} value={text} onChange={(e) => { setText(e.target.value); saveNote(t.id, sid, e.target.value); }} />
    </div>
  );
}

function StepCard({ t, level, index, s, prog }: { t: Track; level: Level; index: number; s: Step; prog: ProgressMap }) {
  const sid = stepId(level.n, index);
  const done = isDone(prog, t.id, sid);
  const [msg, setMsg] = useState('');
  const mark = (on: boolean) => {
    const r = setStepDone(t, sid, on);
    setMsg(r.track ? 'Track finished. Well done!' : r.level ? `Level ${r.level} finished.` : '');
  };
  const res = s.kind === 'resource' ? resourceOf(t, s.id) : undefined;
  return (
    <li className={`apt-step${done ? ' done' : ''}`} id={`step-${sid.replace('.', '-')}`}>
      <div className="apt-stepnum" aria-hidden="true">{done ? '✓' : index + 1}</div>
      <div className="apt-stepbody">
        {s.kind === 'resource' && (res ? <ResourceCard r={res} why={s.why} /> : <p className="muted">This resource is missing.</p>)}
        {s.kind === 'inapp' && <InappCard s={s} />}
        {s.kind === 'reflect' && <ReflectCard t={t} sid={sid} prompt={s.prompt} />}
        {s.kind === 'drill' && (
          <div className="apt-res">
            <div className="apt-chips"><span className="chip"><span aria-hidden="true">🎯</span> Practice</span><span className="chip good">In this app</span></div>
            <h4 className="apt-title">How would you answer?</h4>
            <DrillPlayer trackId={t.id} sid={sid} source={s.source} onFinished={() => mark(true)} />
          </div>
        )}
        <div className="apt-actions">
          <button type="button" className={`btn small${done ? '' : ' ghost'}`} aria-pressed={done} onClick={() => mark(!done)}>{done ? 'Done. Undo' : 'Mark done'}</button>
          <span className="muted small">about {stepMinutes(t, s)} min</span>
          {msg && <span role="status" className="apt-msg">{msg}</span>}
        </div>
      </div>
    </li>
  );
}

function LevelReview({ t, level }: { t: Track; level: Level }) {
  const items = level.steps.filter((s): s is Extract<Step, { kind: 'inapp' }> => s.kind === 'inapp').slice(0, 6);
  const [rs, setRs] = useState<Resolved[]>([]);
  useEffect(() => { let live = true; Promise.all(items.map(resolveInapp)).then((x) => live && setRs(x.filter((y) => y.found))); return () => { live = false; }; }, [t.id, level.n]);
  if (!rs.length) return null;
  return (
    <div className="apt-review">
      <h4>Review: level {level.n}</h4>
      <p className="muted small">Come back to these when you want to refresh what you learned.</p>
      <ul>{rs.map((r) => <li key={r.to}><Link to={r.to}>{r.title}</Link> <span className="muted small">({r.typeLabel})</span></li>)}</ul>
    </div>
  );
}

function LevelSection({ t, level, open, onToggle, prog }: { t: Track; level: Level; open: boolean; onToggle: () => void; prog: ProgressMap }) {
  const pct = levelPercent(t, prog, level.n);
  const prevDone = level.n === 1 || levelComplete(t, prog[t.id]?.done ?? [], level.n - 1);
  const started = (prog[t.id]?.done ?? []).some((d) => d.startsWith(`${level.n}.`));
  const panel = `apt-lv-${level.n}`;
  return (
    <section className={`apt-level${open ? ' open' : ''}`} aria-labelledby={`${panel}-h`}>
      <h3 className="apt-lvh" id={`${panel}-h`}>
        <button type="button" className="apt-lvbtn" aria-expanded={open} aria-controls={panel} onClick={onToggle}>
          <span className="apt-lvn" aria-hidden="true">{pct >= 100 ? '✓' : level.n}</span>
          <span className="apt-lvt"><span className="apt-lvname">Level {level.n}: {level.title}</span><span className="muted small">{level.goal} · about {level.minutes} min · {pct}% done</span></span>
          <span className="apt-chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
        </button>
      </h3>
      {open && (
        <div id={panel} className="apt-lvbody">
          {!prevDone && !started && <p className="apt-gate">Do level {level.n - 1} first if you are new. You are free to look around.</p>}
          <ol className="apt-steps">{level.steps.map((s, i) => <StepCard key={i} t={t} level={level} index={i} s={s} prog={prog} />)}</ol>
          <LevelReview t={t} level={level} />
        </div>
      )}
    </section>
  );
}

function TrackView({ t }: { t: Track }) {
  const prog = useProgress();
  const nx = nextStep(t, prog);
  const [open, setOpen] = useState<number[]>(() => [nx?.level ?? 1]);
  const pct = trackPercent(t, prog);
  const g = groupOf(t.group);
  const toggle = (n: number) => setOpen((o) => (o.includes(n) ? o.filter((x) => x !== n) : [...o, n]));
  const goNext = () => { if (!nx) return; setOpen((o) => (o.includes(nx.level) ? o : [...o, nx.level])); setTimeout(() => document.getElementById(`step-${nx.id.replace('.', '-')}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60); };
  return (
    <div className="page apt">
      <p className="small"><Link to={TRACKS_BASE}>← All tracks</Link></p>
      <div className="kicker">{g?.icon} {g?.title}</div>
      <div className="apt-head">
        <div><h1>{t.title}</h1><p className="lede" style={{ marginBottom: 8 }}>{t.tagline}</p></div>
        <ProgressRing pct={pct} size={72} label={`${pct} percent of the track done`} />
      </div>
      <div className="apt-why-card">
        <h2 style={{ marginTop: 0 }}>Why it matters</h2>
        <p>{t.whyItMatters}</p>
        {t.ccc?.length > 0 && <p className="small">In the Catechism: {t.ccc.map((n, i) => <span key={n}>{i > 0 && ', '}<Link to={`/study/catechism/${n}`}>§{n}</Link></span>)}</p>}
      </div>
      <div className="apt-mind" role="note">
        <h2 style={{ marginTop: 0 }}>How to talk with people who think this</h2>
        <ul>{t.mindset.map((m, i) => {
          const r = m.resource ? resourceOf(t, m.resource) : undefined;
          return <li key={i}>{m.tip}{r && <> <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title} ↗<span className="visually-hidden"> (opens another site)</span></a></>}</li>;
        })}</ul>
      </div>
      <div className="apt-cta">
        {nx ? <button type="button" className="btn primary" onClick={goNext}>{pct === 0 ? 'Start here' : 'Continue'}: level {nx.level}, step {nx.index + 1}</button> : <p role="status"><strong>You have finished this track.</strong> Revisit any level, or try another track.</p>}
        <span className="muted small">{hours(trackMinutes(t))} in all. Go at your own pace; your progress stays on this device.</span>
      </div>
      <h2>The four levels</h2>
      {t.levels.map((l) => <LevelSection key={l.n} t={t} level={l} open={open.includes(l.n)} onToggle={() => toggle(l.n)} prog={prog} />)}
      <p className="muted small">Links go to other sites, which we do not control and which may change. Each was checked on the date shown. If one no longer works, tell us. Items marked “In this app” open sourced material built into this app.</p>
    </div>
  );
}

/** Apologetics tracks: pick a question people ask and grow step by step, from foundations to primary sources. */
export default function ApologeticsTracksPage() {
  const { trackId } = useParams();
  const tracks = useTracks();
  if (!trackId) return <Hub />;
  if (!tracks) return <div className="page apt"><p className="center-note">Loading…</p></div>;
  const t = tracks.find((x) => x.id === trackId);
  if (!t) return <div className="page apt" data-state="not-found"><p className="callout">We could not find that track.</p><p><Link to={TRACKS_BASE}>See all tracks</Link></p></div>;
  return <TrackView key={t.id} t={t} />;
}
