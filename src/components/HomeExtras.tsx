import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useSettings } from '../lib/store';
import { getJson } from '../data/loader';
import { butlerFor } from '../study/butler';
import { litDay } from '../liturgy/litcal';
import { setAmbience, stopAmbience } from '../lib/ambience';
import { newCard } from '../lib/srs';
import { refId, type Ref } from '../lib/refs';
import type { Season } from '../liturgy/compute';

const PATH_FOR: Partial<Record<Season, [string, string]>> = {
  advent: ['advent-hope', 'Advent hope'], christmas: ['mary-in-scripture', 'Mary in Scripture'], lent: ['lent-journey', 'Lenten journey'], triduum: ['resurrection', 'The Risen Lord'], easter: ['resurrection', 'The Risen Lord'],
};
interface Galaxy { works: { id: string; author: string; authorId: string; title: string }[] }

/** Small links under the day: your plan, something for the season, the saint, and a few one-tap actions. Kept to a line or two so the screen stays still. */
export default function HomeExtras({ date, season, ref, label, onRandom }: { date: string; season: Season; ref: Ref | null; label: string; onRandom?: () => void }) {
  const [s] = useSettings();
  const plans = useLiveQuery(() => db.planProgress.filter((p) => p.status === 'active' && p.planId !== 'biay').toArray(), []) ?? [];
  const fav = useLiveQuery(() => db.cache.get(`daily-fav:${date}`), [date]);
  const memoed = useLiveQuery(() => (ref ? db.memory.where('ref').equals(refId(ref)).count() : 0), [ref && refId(ref)]) ?? 0;
  const [saint, setSaint] = useState<{ name: string; authorId?: string; life?: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => { if (playing) stopAmbience(); }, [playing]);
  useEffect(() => {
    let live = true;
    setSaint(null);
    Promise.all([litDay(s.diocese, date), getJson<Galaxy>('library/galaxy.json', true)]).then(([ev, g]) => {
      if (!live || !ev) return;
      const e = ev.filter((x) => x.grade >= 1 && x.grade <= 4 && /^(saint|st\.|blessed)|\b(saint|martyr|virgin|doctor|bishop|pope|abbot)\b/i.test(x.name)).sort((a, b) => b.grade - a.grade)[0];
      if (!e) return;
      const nm = e.name.toLowerCase();
      const hit = g?.works.find((w) => w.author.toLowerCase().split(/[ ,]+/).filter((t) => t.length > 4 && !['great', 'blessed', 'hippo', 'milan', 'lisieux'].includes(t)).some((t) => nm.includes(t)));
      const nm2 = e.name.replace(/, .*$/, '');
      butlerFor(e.name, date).then((md) => live && setSaint({ name: nm2, authorId: hit?.authorId, life: md ?? undefined }));
      setSaint({ name: nm2, authorId: hit?.authorId });
    });
    return () => { live = false; };
  }, [date, s.diocese]);
  const season2 = PATH_FOR[season];
  const toggleFav = () => (fav ? db.cache.delete(`daily-fav:${date}`) : db.cache.put({ key: `daily-fav:${date}`, value: label, ts: Date.now() }));
  const remember = async () => { if (ref && !memoed) await db.memory.add({ ref: refId(ref), ...newCard(), createdAt: Date.now() } as any); };
  const listen = () => {
    if (playing) { stopAmbience(); setPlaying(false); return; }
    setAmbience(season === 'ordinary' ? 'chant' : season === 'christmas' || season === 'advent' ? 'hymn' : 'chant', s.ambience.volume || 0.25);
    setPlaying(true);
  };
  return (
    <div className="home-extras">
      <Link to={`/pray/readings/${date}`}>Mass readings</Link>
      {onRandom && <button onClick={onRandom}>Random verse</button>}
      {plans.length > 0 && <Link to="/pray/plans">Your reading plan →</Link>}
      {season2 && <Link to={`/study/path/${season2[0]}`}>{season2[1]} (study path)</Link>}
      {season !== 'ordinary' && <button onClick={listen} aria-pressed={playing}>{playing ? '■ Stop' : '♪ Listen: chant and hymns for the season'}</button>}
      {saint && <Link to={saint.authorId ? `/study/fathers?author=${saint.authorId}` : `/study/saints/${saint.life ?? date.slice(5)}?name=${encodeURIComponent(saint.name.replace(/^(saint|st\.)\s+/i, ''))}`}>{saint.name}{saint.authorId ? ': read their words' : saint.life ? ': read the life' : ': saints of the day'}</Link>}
      {ref && <Link to={`/share?ref=${encodeURIComponent(label)}`}>Make a picture of this verse</Link>}
      {ref && <button onClick={remember} disabled={memoed > 0}>{memoed > 0 ? '✓ In memorize' : 'Memorize this verse'}</button>}
      <button onClick={toggleFav} aria-pressed={!!fav} title="Keep this day in your favourites">{fav ? '★ Favourite' : '☆ Favourite day'}</button>
    </div>
  );
}
