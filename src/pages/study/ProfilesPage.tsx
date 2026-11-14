import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getPlaces } from '../../data/content';
import { type Profile, type ProfileKind } from '../../lib/profiles';
import { useProfiles } from '../../lib/useProfiles';
import { extendTrail, placePoint, profilePath, relatedEntries, searchProfiles, shareTheirPassages, type Trail } from '../../lib/profileView';
import { formatRef, parseRefId } from '../../lib/refs';
import ProfileCard, { KIND_LABEL } from '../../components/ProfileCard';
import AddToCollection from '../../components/AddToCollection';
import ShareLinkButton from '../../components/ShareLinkButton';

const ProfilesMap = lazy(() => import('../../components/ProfilesMap'));
const SOURCE_LABEL = { scripture: 'Scripture', magisterium: 'Church teaching', historical: 'Historical source', editorial: 'Editorial note' } as const;
const KINDS: ProfileKind[] = ['saint', 'person', 'place'];
const KIND_PLURAL: Record<ProfileKind, string> = { saint: 'Saints', person: 'People', place: 'Places' };

const passageLabel = (x: string) => { const r = parseRefId(x); return r ? formatRef(r) : x; };

type MapPlaceRow = { n: string; lat: number; lon: number };
function usePlaces() {
  const [places, setPlaces] = useState<(MapPlaceRow | null)[] | null>(null);
  useEffect(() => { let live = true; getPlaces().then((p) => live && setPlaces(p ?? [])).catch(() => live && setPlaces([])); return () => { live = false; }; }, []);
  return places;
}

/** Profiles of saints, people and places, from reviewed data only. With no data yet it says so and does not guess. */
export default function ProfilesPage() {
  const { kind, id } = useParams();
  const { list, bad } = useProfiles();
  const loc = useLocation();
  const from = (loc.state as { from?: Trail } | null)?.from;
  if (id && list) {
    const one = list.find((p) => p.kind === kind && p.id === id);
    return one ? <ProfileView p={one} all={list} from={from} /> : <div className="page" data-state="not-found"><h1>Profile not found</h1><p className="muted">This record is not in the profile data (it may have been renamed or removed).</p><p><Link to="/study/profiles">Back to profiles</Link></p></div>;
  }
  return <ProfileList list={list} bad={bad} from={from} />;
}

function ProfileList({ list, bad, from }: { list: Profile[] | null; bad: boolean; from?: Trail }) {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const kindParam = sp.get('kind');
  const kind = KINDS.includes(kindParam as ProfileKind) ? (kindParam as ProfileKind) : undefined;
  const view = sp.get('view') === 'map' ? 'map' : 'list';
  const nav = useNavigate();
  const loc = useLocation();
  const places = usePlaces();
  const set = (k: string, v: string) => setSp((o) => { const n = new URLSearchParams(o); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });
  const hits = useMemo(() => (list ? searchProfiles(list, q, kind) : []), [list, q, kind]);
  const here = { path: `${loc.pathname}${loc.search}`, label: 'Saints, people and places' };
  const pins = useMemo(() => (places ? hits.flatMap(({ profile: p }) => { const pt = placePoint(p, places); return pt ? [{ key: p.id, name: p.name, lat: pt.lat, lon: pt.lon, href: profilePath(p) }] : []; }) : []), [hits, places]);
  const showMap = view === 'map' && pins.length > 0;
  return (
    <div className="page">
      {from && <p className="small"><button className="btn small ghost" onClick={() => nav(from.path, { state: from.prev ? { from: from.prev } : undefined })}>← Back to {from.label}</button></p>}
      <h1>Saints, people and places</h1>
      <p className="lede">A profile gathers what the app can show about a saint, a person in Scripture or a place, each statement with its source and, where it is uncertain, how sure it is.</p>
      <input type="search" aria-label="Search profiles" placeholder="Search by name or another name" value={q} onChange={(e) => set('q', e.target.value)} style={{ maxWidth: '100%' }} />
      <div className="row" role="group" aria-label="Show only" style={{ gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
        <button className="chip" aria-pressed={!kind} onClick={() => set('kind', '')}>All</button>
        {KINDS.map((k) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => set('kind', k)}>{KIND_PLURAL[k]}</button>)}
        {pins.length > 0 && (
          <span className="row" role="group" aria-label="View" style={{ gap: 6, marginLeft: 'auto' }}>
            <button className="chip" aria-pressed={!showMap} onClick={() => set('view', '')}>List</button>
            <button className="chip" aria-pressed={showMap} onClick={() => set('view', 'map')}>Map ({pins.length} places)</button>
          </span>
        )}
      </div>
      {list && list.length === 0 && (
        <div className="empty">{bad ? 'The profile data did not pass its checks, so it is not shown.' : 'No profiles are loaded yet. Profiles are added only from reviewed sources, so none are invented. Meanwhile, the saints and the people of Scripture each have their own pages.'}
          <p><Link to="/study/saints">Saints</Link> · <Link to="/study/people">People of Scripture</Link> · <Link to="/study/maps">Maps</Link></p></div>
      )}
      {list && list.length > 0 && hits.length === 0 && <p className="empty" role="status">No profile matches “{q}”{kind ? ` among ${KIND_PLURAL[kind].toLowerCase()}` : ''}. Names and other names are searched.</p>}
      {showMap && <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}><ProfilesMap pins={pins} label={`Map of ${pins.length} places`} onOpen={(href) => nav(href, { state: { from: extendTrail(from, here) } })} /></Suspense>}
      <p className="muted small" role="status" aria-live="polite">{list ? `${hits.length} ${hits.length === 1 ? 'profile' : 'profiles'}` : ''}</p>
      <ul className="list">{hits.map(({ profile, via }) => <li key={`${profile.kind}:${profile.id}`}><ProfileCard profile={profile} via={via} from={from} here={here} /></li>)}</ul>
    </div>
  );
}

function ProfileView({ p, all, from }: { p: Profile; all: Profile[]; from?: Trail }) {
  const nav = useNavigate();
  const loc = useLocation();
  const places = usePlaces();
  const [map, setMap] = useState(false);
  const here = { path: loc.pathname, label: p.name };
  const trail = extendTrail(from, here);
  const point = places ? placePoint(p, places) : null;
  const related = relatedEntries(p, all);
  const alsoHere = shareTheirPassages(p, all);
  return (
    <div className="page">
      <p className="small row" style={{ gap: 8, flexWrap: 'wrap' }} aria-label="Breadcrumb">
        {from && <button className="btn small ghost" onClick={() => nav(from.path, { state: from.prev ? { from: from.prev } : undefined })}>← Back to {from.label}</button>}
        <Link to="/study/profiles">All profiles</Link>
        <span className="muted">› {KIND_PLURAL[p.kind]}</span>
        <span className="muted">› {p.name}</span>
      </p>
      {from?.prev && <p className="small muted">Earlier: {(() => { const t: Trail[] = []; for (let x: Trail | undefined = from.prev; x && t.length < 4; x = x.prev) t.push(x); return t.map((x, i) => <button key={i} className="btn small ghost" onClick={() => nav(x.path, { state: x.prev ? { from: x.prev } : undefined })}>{x.label}</button>); })()}</p>}
      <h1>{p.name}</h1>
      <p className="muted">{KIND_LABEL[p.kind]}{p.alternateNames?.length ? ` · also: ${p.alternateNames.join(', ')}` : ''}{p.feast ? ` · feast ${p.feast}` : ''}{p.period ? ` · ${p.period.from ?? '?'}–${p.period.to ?? '?'}` : ''}</p>
      <p className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <AddToCollection target={{ type: 'link', url: `#${profilePath(p)}`, label: `${p.name} (${KIND_LABEL[p.kind].toLowerCase()} profile)` }} label="＋ Collection" />
        <ShareLinkButton path={profilePath(p)} title={p.name} />
        {point && <button className="btn small ghost" aria-pressed={map} onClick={() => setMap(!map)}>{map ? 'Hide map' : 'Show on map'}</button>}
      </p>
      {point && map && <Suspense fallback={<div className="skeleton" style={{ height: 320 }} />}><ProfilesMap pins={[{ key: p.id, name: p.name, lat: point.lat, lon: point.lon, href: profilePath(p) }]} label={`Map showing ${p.name}`} onOpen={() => undefined} /></Suspense>}
      {p.identification && <section className="card"><h2 className="card-title">Identification ({p.identification.confidence})</h2><p>{[p.identification.ancient, p.identification.modern].filter(Boolean).join(' → ')}</p><p className="muted small">{SOURCE_LABEL[p.identification.source.kind]}: {p.identification.source.label}</p></section>}
      <section className="card">
        <h2 className="card-title">What the sources say</h2>
        <ul className="list">{p.facts.map((f, i) => <li key={i}>{f.text}<div className="muted small">{SOURCE_LABEL[f.source.kind]}: {f.source.url ? <a href={f.source.url} target="_blank" rel="noreferrer">{f.source.label} ↗</a> : f.source.label}{f.confidence && f.confidence !== 'certain' ? ` · ${f.confidence}` : ''}</div></li>)}</ul>
      </section>
      {related.length > 0 && (
        <section className="card" aria-label="Related profiles">
          <h2 className="card-title">Related</h2>
          <ul className="list">{related.map((r) => (
            <li key={`${r.direction}:${r.id}:${r.relation}`}>
              <ProfileCard profile={r.profile} name={r.id} relation={r.direction === 'incoming' ? `${r.profile?.name ?? r.id} is ${r.relation}` : r.relation} from={from} here={here} />
              <div className="muted small">{SOURCE_LABEL[r.source.kind]}: {r.source.label}</div>
            </li>))}</ul>
        </section>
      )}
      {p.passages?.length ? <section className="card"><h2 className="card-title">Passages</h2><p>{p.passages.map((x, i) => <span key={x}>{i ? ', ' : ''}<Link to={`/study/passage/${x}`} state={{ from: trail }}>{passageLabel(x)}</Link></span>)}</p></section> : null}
      {alsoHere.length > 0 && (
        <section className="card" aria-label="Named in the same passages">
          <h2 className="card-title">Named in the same passages</h2>
          <ul className="list">{alsoHere.map(({ profile, passages }) => <li key={`${profile.kind}:${profile.id}`}><ProfileCard profile={profile} from={from} here={here} note={`In ${passages.map(passageLabel).join(', ')}`} /></li>)}</ul>
        </section>
      )}
      {p.authorId && <p><Link to={`/room?author=${p.authorId}`}>Writings in the library</Link></p>}
    </div>
  );
}
