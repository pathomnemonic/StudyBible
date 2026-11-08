import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { loadChains } from '../../chains/load';
import { contextLink } from '../../chains/links';
import { MODES, type Chain, type ChainMode, type Step } from '../../chains/types';
import ShareLinkButton from '../../components/ShareLinkButton';
import PrintButton from '../../components/PrintButton';

const KIND: Record<Step['kind'], string> = { scripture: 'Scripture', father: 'Father', council: 'Council', catechism: 'Catechism', magisterium: 'Church teaching', saint: 'Saint', liturgy: 'Liturgy' };

function StepCard({ s, timeline }: { s: Step; timeline?: boolean }) {
  const link = contextLink(s);
  return (
    <li className={`chain-step k-${s.kind}`}>
      <div className="chain-rail" aria-hidden="true"><span className="chain-dot" /></div>
      <div className="chain-body">
        <p className="chain-meta">
          <span className={`chain-kind k-${s.kind}`}>{KIND[s.kind]}</span>
          {s.when && <span className={timeline ? 'chain-when big' : 'chain-when'}>{s.when}</span>}
        </p>
        <h3 className="chain-label">{s.label}</h3>
        {s.quote && <blockquote className="chain-quote"><p>{s.quote}</p></blockquote>}
        <p className="chain-note">{s.note}</p>
        {link && <p className="small no-print"><Link to={link.to}>{link.text}</Link></p>}
      </div>
    </li>
  );
}

function ChainView({ c, mode }: { c: Chain; mode: ChainMode }) {
  const steps = mode === 'development' ? [...c.steps].sort((a, b) => (a.year ?? 0) - (b.year ?? 0)) : c.steps;
  const h = c.heresy;
  return (
    <article className="chain">
      <p className="small no-print"><Link to={MODES[mode].path}>← {MODES[mode].title}</Link></p>
      <h1>{c.title} <PrintButton /></h1>
      <p className="lede">{c.question}</p>
      {c.verdict && (
        <section className={`card chain-verdict v-${c.verdict.label.toLowerCase().replace(/[^a-z]+/g, '-')}`} aria-label="Verdict">
          <p className="chain-meta"><span className="chain-kind k-verdict">Verdict</span></p>
          <p className="chain-verdict-label">{c.verdict.label}</p>
          <p>{c.verdict.why}</p>
          <p><strong>Where it comes from.</strong> {c.verdict.origin}</p>
        </section>
      )}
      {h && (
        <section className="card chain-error" aria-label="The error at its strongest">
          <p className="chain-meta"><span className="chain-kind k-heresy">The error</span><span className="chain-when">{h.era}</span></p>
          <p className="small muted">Taught by {h.who}</p>
          <p>{h.claim}</p>
          <p><strong>Why it attracted people.</strong> {h.appeal}</p>
          {h.advocate.length > 0 && <>
            <h2 className="chain-h2">In their own words, as the Church’s writers preserved them</h2>
            <ol className="chain-steps">{h.advocate.map((s, i) => <StepCard key={i} s={s} />)}</ol>
          </>}
        </section>
      )}
      <section className="card chain-summary" aria-label="The short answer">
        <strong>{h ? 'What the Church teaches instead' : c.verdict ? 'What the Church actually teaches' : 'The short answer'}</strong>
        <p>{c.summary}</p>
      </section>
      <h2 className="chain-h2">{h ? 'Where it breaks' : mode === 'development' ? 'The teaching, in time order' : 'The chain of sources'}</h2>
      <ol className="chain-steps">{steps.map((s, i) => <StepCard key={i} s={s} timeline={mode === 'development'} />)}</ol>
      {h && <section className="card"><strong>Why it fails</strong><p>{h.whyItFails}</p></section>}
      {c.objections && c.objections.length > 0 && (
        <section aria-label="Objections">
          <h2 className="chain-h2">The strongest objections</h2>
          {c.objections.map((o, i) => (
            <details key={i} className="chain-obj">
              <summary>{o.q}</summary>
              <p>{o.a}</p>
              {o.steps && o.steps.length > 0 && <ol className="chain-steps">{o.steps.map((s, j) => <StepCard key={j} s={s} />)}</ol>}
            </details>
          ))}
        </section>
      )}
      {c.readNext && c.readNext.length > 0 && <p className="small">Read next in the Catechism: {c.readNext.map((n, i) => <span key={n}>{i > 0 && ', '}<Link to={`/study/catechism/${n}`}>§{n}</Link></span>)}</p>}
      <p className="no-print"><ShareLinkButton path={`${MODES[mode].path}/${c.id}`} title={c.title} /></p>
      <p className="muted small">Every quotation here is checked against the text of the source it cites, which is built into this app. The summaries are written for this app and are not magisterial texts.</p>
    </article>
  );
}

export default function ChainsPage({ mode }: { mode: ChainMode }) {
  const { id } = useParams();
  const [chains, setChains] = useState<Chain[] | null>(null);
  useEffect(() => { setChains(null); loadChains(mode).then(setChains); }, [mode]);
  if (!chains) return <div className="page"><p className="center-note">Loading…</p></div>;
  const c = id ? chains.find((x) => x.id === id) : undefined;
  if (c) return <div className="page">{<ChainView c={c} mode={mode} />}</div>;
  const m = MODES[mode];
  return (
    <div className="page">
      <h1>{m.title}</h1>
      <p className="lede">{m.blurb}</p>
      {id && <p className="callout">We couldn’t find that one. Here is the full list.</p>}
      {chains.length === 0 ? <p className="muted">Coming soon.</p> : (
        <ul className="list chain-list">
          {chains.map((x) => (
            <li key={x.id}>
              <Link className="t" to={`${m.path}/${x.id}`}>{x.title}</Link>
              <p className="muted small" style={{ margin: '2px 0 0' }}>{x.heresy ? `${x.heresy.era} · ${x.heresy.who}` : x.verdict ? `${x.verdict.label}: ${x.question}` : x.question}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">Each quotation is checked against the source text in this app. Other views: {Object.entries(MODES).filter(([k]) => k !== mode).map(([k, v], i) => <span key={k}>{i > 0 && ' · '}<Link to={v.path}>{v.title}</Link></span>)}</p>
    </div>
  );
}
