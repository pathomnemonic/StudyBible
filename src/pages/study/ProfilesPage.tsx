import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { findProfiles, validateProfiles, type Profile, type ProfileFile, type ProfileKind } from '../../lib/profiles';

const KIND_LABEL: Record<ProfileKind, string> = { saint: 'Saint', person: 'Person in Scripture', place: 'Place' };
const SOURCE_LABEL = { scripture: 'Scripture', magisterium: 'Church teaching', historical: 'Historical source', editorial: 'Editorial note' } as const;

/** Profiles of saints, people and places, from reviewed data only. With no data yet it says so and does not guess. */
export default function ProfilesPage() {
  const { kind, id } = useParams();
  const [list, setList] = useState<Profile[] | null>(null);
  const [bad, setBad] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => {
    getJson<ProfileFile>('profiles/profiles.json', true).then((f) => { if (!f || validateProfiles(f).length) { setBad(true); setList([]); } else setList(f.profiles); }).catch(() => setList([]));
  }, []);
  const one = list?.find((p) => p.kind === kind && p.id === id);
  if (id && list) return one ? <Profile p={one} all={list} /> : <div className="page"><h1>Profile not found</h1><p><Link to="/study/profiles">Back to profiles</Link></p></div>;
  const shown = list ? (q.trim() ? findProfiles(list, q) : list) : [];
  return (
    <div className="page">
      <h1>Saints, people and places</h1>
      <p className="lede">A profile gathers what the app can show about a saint, a person in Scripture or a place, each statement with its source and, where it is uncertain, how sure it is.</p>
      <input type="search" aria-label="Search profiles" placeholder="Search by name or another name" value={q} onChange={(e) => setQ(e.target.value)} />
      {list && list.length === 0 && (
        <div className="empty">{bad ? 'The profile data did not pass its checks, so it is not shown.' : 'No profiles are loaded yet. Profiles are added only from reviewed sources, so none are invented. Meanwhile, the saints and the people of Scripture each have their own pages.'}
          <p><Link to="/study/saints">Saints</Link> · <Link to="/study/people">People of Scripture</Link> · <Link to="/study/maps">Maps</Link></p></div>
      )}
      <ul className="list">{shown.map((p) => <li key={`${p.kind}:${p.id}`}><Link to={`/study/profile/${p.kind}/${p.id}`}>{p.name}</Link> <span className="muted small">{KIND_LABEL[p.kind]}</span></li>)}</ul>
    </div>
  );
}

function Profile({ p, all }: { p: Profile; all: Profile[] }) {
  return (
    <div className="page">
      <p className="small"><Link to="/study/profiles">All profiles</Link></p>
      <h1>{p.name}</h1>
      <p className="muted">{KIND_LABEL[p.kind]}{p.alternateNames?.length ? ` · also: ${p.alternateNames.join(', ')}` : ''}{p.feast ? ` · feast ${p.feast}` : ''}{p.period ? ` · ${p.period.from ?? '?'}–${p.period.to ?? '?'}` : ''}</p>
      {p.identification && <section className="card"><h2 className="card-title">Identification ({p.identification.confidence})</h2><p>{[p.identification.ancient, p.identification.modern].filter(Boolean).join(' → ')}</p><p className="muted small">{SOURCE_LABEL[p.identification.source.kind]}: {p.identification.source.label}</p></section>}
      <section className="card">
        <h2 className="card-title">What the sources say</h2>
        <ul className="list">{p.facts.map((f, i) => <li key={i}>{f.text}<div className="muted small">{SOURCE_LABEL[f.source.kind]}: {f.source.url ? <a href={f.source.url} target="_blank" rel="noreferrer">{f.source.label} ↗</a> : f.source.label}{f.confidence && f.confidence !== 'certain' ? ` · ${f.confidence}` : ''}</div></li>)}</ul>
      </section>
      {p.related?.length ? <section className="card"><h2 className="card-title">Related</h2><ul className="list">{p.related.map((r) => { const t = all.find((x) => x.id === r.id && x.kind === p.kind); return <li key={r.id}>{r.relation}: {t ? <Link to={`/study/profile/${t.kind}/${t.id}`}>{t.name}</Link> : r.id}<div className="muted small">{SOURCE_LABEL[r.source.kind]}: {r.source.label}</div></li>; })}</ul></section> : null}
      {p.passages?.length ? <section className="card"><h2 className="card-title">Passages</h2><p>{p.passages.map((x, i) => <span key={x}>{i ? ', ' : ''}<Link to={`/study/passage/${x}`}>{x}</Link></span>)}</p></section> : null}
      {p.authorId && <p><Link to={`/room?author=${p.authorId}`}>Writings in the library</Link></p>}
    </div>
  );
}
