import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getThemes, type Theme } from '../../study/refData';
import RefChips from '../../components/RefChips';

/** Biblical Theology Explorer: trace a theme from Genesis to Revelation, with the Church’s reading. */
export default function ThemesPage() {
  const [sp, setSp] = useSearchParams();
  const [themes, setThemes] = useState<Theme[]>([]);
  useEffect(() => {
    getThemes().then((d) => setThemes(d?.themes ?? []));
  }, []);
  const id = sp.get('t');
  const th = themes.find((t) => t.id === id);
  return (
    <div className="page">
      <h1>Biblical theology explorer</h1>
      {!th ? (
        <>
          <p className="lede">Follow a theme through the whole of Scripture, stage by stage, and see how the Church reads it.</p>
          <div className="grid">
            {themes.map((t) => (
              <button key={t.id} className="card linkcard" onClick={() => setSp({ t: t.id })}>
                <h2 className="card-title">{t.title}</h2>
                <p className="muted small">{t.summary}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="small"><button className="linklike" onClick={() => setSp({})}>← All themes</button></p>
          <h2>{th.title}</h2>
          <p className="lede">{th.summary}</p>
          <ol className="theme-path">
            {th.stages.map((s) => (
              <li key={s.label}>
                <strong>{s.label}</strong>
                <div><RefChips text={s.refs} /></div>
                <p className="muted small" style={{ margin: '2px 0 0' }}>{s.note}</p>
              </li>
            ))}
          </ol>
          <div className="card">
            <h3>How the Church reads it</h3>
            <p>{th.catholic}</p>
            {th.ccc.length > 0 && <p className="muted small">Catechism of the Catholic Church, on this theme: §{th.ccc.join(', §')}. (Pointers to the sections; read them at the Vatican’s or your own Catechism.)</p>}
          </div>
          {th.related.length > 0 && (
            <p className="small">Related themes: {th.related.map((r) => { const t = themes.find((x) => x.id === r); return t ? <button key={r} className="chip" onClick={() => setSp({ t: r })}>{t.title}</button> : null; })}</p>
          )}
          <p className="muted small">Themes are written for this app as study aids; they are not exhaustive and are not official Church texts. Compare with the <Link to="/study/index?tab=prophecies">prophecy and fulfilment index</Link> and the Fathers’ commentary.</p>
        </>
      )}
    </div>
  );
}
