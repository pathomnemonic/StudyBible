import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getJson } from '../../data/loader';
import { useSettings } from '../../lib/store';
import { useEditions } from '../../data/EditionsContext';
import { parseRefs, formatRef, type Ref } from '../../lib/refs';
import { convertRef } from '../../lib/versification';
import { passageText } from '../../lib/bibleText';
import { readerPath } from '../../lib/nav';
import { moreArtFor } from '../../study/inlineArt';
import { videosFor, type Video } from '../../data/videos';
import InlinePlayer from '../../components/InlinePlayer';
import { embedFor } from '../../lib/embed';

type Age = '4-6' | '7-9' | '10-12';
interface Story { id: string; title: string; testament: 'OT' | 'NT'; refs: string[]; emoji: string; text: Record<Age, string>; talk: string[]; memory?: string; hue: number }
const AGES: [Age, string, string][] = [['4-6', 'Ages 4 to 6', 'Short and simple'], ['7-9', 'Ages 7 to 9', 'The whole story'], ['10-12', 'Ages 10 to 12', 'Story and meaning']];
let cache: Promise<Story[]> | null = null;
const load = () => (cache ??= getJson<{ stories: Story[] }>('kids_stories.json', true).then((d) => d?.stories ?? []));
const anchorRefs = (s: Story): Ref[] => s.refs.flatMap((r) => { const p = parseRefs(r); return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : []; });
/** stories whose passage overlaps this one, for the study panel */
export async function kidsStoriesFor(sel: Ref[]): Promise<Story[]> {
  return (await load()).filter((s) => anchorRefs(s).some((a) => sel.some((x) => x.book === a.book && x.c1 <= a.c2 && a.c1 <= x.c2)));
}

function AgePicker() {
  const [s, set] = useSettings();
  return (
    <div className="kids-ages" role="group" aria-label="Reading level">
      {AGES.map(([a, l, d]) => (
        <button key={a} className={s.kidsAge === a ? 'on' : ''} aria-pressed={s.kidsAge === a} onClick={() => set({ kidsAge: a })}><strong>{l}</strong><span>{d}</span></button>
      ))}
    </div>
  );
}

/** A Children's Bible: Bible stories retold at three reading levels, each pointing to the real passage. */
export default function KidsPage() {
  const { id } = useParams();
  const [stories, setStories] = useState<Story[]>([]);
  useEffect(() => { load().then(setStories); }, []);
  if (id) return <StoryView story={stories.find((x) => x.id === id)} stories={stories} />;
  const groups: [string, Story[]][] = [['Old Testament', stories.filter((x) => x.testament === 'OT')], ['New Testament', stories.filter((x) => x.testament === 'NT')]];
  return (
    <div className="page kids">
      <h1>Children’s Bible</h1>
      <p className="lede">Bible stories to read, or read aloud, at the right level. Every story points to the real passage, so a child can grow into the Bible itself.</p>
      <AgePicker />
      {groups.map(([name, list]) => (
        <section key={name}>
          <h2>{name}</h2>
          <div className="kids-grid">
            {list.map((x) => (
              <Link key={x.id} to={`/study/kids/${x.id}`} className="kids-card" style={{ ['--h' as string]: x.hue }}>
                <span className="em" aria-hidden="true">{x.emoji}</span>
                <strong>{x.title}</strong>
                <span className="muted small">{x.refs[0]}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="muted small">These retellings were written for this app. They keep to what the Bible says, in simpler words; the older levels add a little of what the Church teaches about each story.</p>
    </div>
  );
}

function StoryView({ story, stories }: { story?: Story; stories: Story[] }) {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const nav = useNavigate();
  const ed = get(s.defaultEdition) ?? editions[0];
  const [mem, setMem] = useState('');
  const [art, setArt] = useState<{ id: string; file: string; title: string; artist: string }[]>([]);
  const [vids, setVids] = useState<Video[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [aloud, setAloud] = useState(false);
  const refs = useMemo(() => (story ? anchorRefs(story) : []), [story]);
  useEffect(() => {
    setAloud(false); setPlaying(null);
    try { speechSynthesis.cancel(); } catch { /* none */ }
    if (!story) return;
    moreArtFor(refs).then((a) => setArt(a.slice(0, 2) as never)).catch(() => setArt([]));
    videosFor(refs, true).then(setVids);
    const m = story.memory ? parseRefs(story.memory) : null;
    if (m?.ok && ed) passageText(ed, convertRef('kjv', 'vulgate', m.refs[0].ref).ref, 4).then((t) => setMem(t.map((v) => v.text).join(' ')));
    return () => { try { speechSynthesis.cancel(); } catch { /* none */ } };
  }, [story?.id, ed?.id]);
  if (!story) return <div className="page"><Link to="/study/kids">← Children’s Bible</Link><p>Loading…</p></div>;
  const i = stories.findIndex((x) => x.id === story.id);
  const text = story.text[s.kidsAge];
  const read = () => {
    if (aloud) { speechSynthesis.cancel(); setAloud(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = s.kidsAge === '4-6' ? 0.85 : 0.95;
    u.onend = () => setAloud(false);
    speechSynthesis.speak(u);
    setAloud(true);
  };
  return (
    <div className="page kids story" style={{ ['--h' as string]: story.hue }}>
      <Link to="/study/kids" className="small">← Children’s Bible</Link>
      <div className="kids-hero"><span aria-hidden="true">{story.emoji}</span><h1>{story.title}</h1></div>
      <AgePicker />
      <p className="kids-text">{text}</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {typeof speechSynthesis !== 'undefined' && <button className="btn" onClick={read}>{aloud ? '■ Stop' : '🔊 Read it to me'}</button>}
        {ed && refs[0] && <button className="btn primary" onClick={() => nav(readerPath(ed, refs[0]))}>Read it in the Bible ({story.refs.join('; ')})</button>}
      </div>
      {art.length > 0 && (
        <div className="kids-art">{art.map((a) => <figure key={a.id}><img src={import.meta.env.BASE_URL + (a as { file: string }).file} alt={a.title} loading="lazy" /><figcaption className="small muted">{a.title}, {a.artist}</figcaption></figure>)}</div>
      )}
      {mem && <blockquote className="kids-verse"><p>{mem}</p><footer>{story.memory}</footer></blockquote>}
      <section className="kids-talk"><h2>Talk about it</h2><ul>{story.talk.map((q) => <li key={q}>{q}</li>)}</ul></section>
      {vids.length > 0 && (
        <section><h2>Watch</h2>
          <div className="kids-vids">{vids.map((v) => (
            <div key={v.id} className="card">
              {playing === v.id ? <InlinePlayer embed={embedFor(`https://www.youtube.com/watch?v=${v.id}`)!} title={v.title} /> : <button className="btn" onClick={() => setPlaying(v.id)}>▶ {v.title}</button>}
              <div className="muted small">{v.channel}</div>
            </div>
          ))}</div>
        </section>
      )}
      <nav className="row between" style={{ marginTop: 18 }}>
        {i > 0 ? <Link className="btn" to={`/study/kids/${stories[i - 1].id}`}>← {stories[i - 1].title}</Link> : <span />}
        {i < stories.length - 1 && <Link className="btn" to={`/study/kids/${stories[i + 1].id}`}>{stories[i + 1].title} →</Link>}
      </nav>
      <p className="muted small">{formatRef(refs[0] ?? { book: 'GEN', c1: 1, c2: 1 })} and what follows: the story is retold from it.</p>
    </div>
  );
}
