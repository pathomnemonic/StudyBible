import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FEATURES, visible, type Feature } from '../lib/features';
import { useSync } from '../sync/state';
import { NewDot } from './Hints';
import Fold from './Fold';
import { useSettings } from '../lib/store';

/** One look for every tab's front page: a title, one big thing to do, then a few small groups of tiles. */
export const ICON: Record<string, string> = {
  'study.lexicon': '🔤', 'bible.books': '📑', 'bible.synopsis': '⚖️', 'bible.pauline': '✒️', 'bible.terms': '🏷️', 'bible.concordance': '🔍', 'bible.topical': '🗂️', 'bible.quotations': '💬', 'bible.dossier': '📄', 'bible.fulfilment': '🔗', 'bible.search': '🔎', 'bible.share': '🖼️', 'study.themes': '🧭', 'study.universe': '🌌', 'study.constellation': '✨', 'study.timespace': '🕰️', 'study.maps': '🗺️', 'study.world': '🏺', 'study.people': '🌳', 'study.manuscripts': '📜', 'study.textual': '🔎', 'study.voices': '🗣️', 'study.concepts': '🕸️', 'study.sources': '⚖️',
  'read.gallery': '🖼️', 'read.saints': '🕊️', 'read.encyclopedia': '📚', 'read.papal': '✉️', 'read.church': '🏛️', 'read.room': '📖', 'read.mine': '📘',
  'study.curriculum': '🎓', 'study.prepare': '🕯️', 'study.ya': '🧑', 'study.kids': '🧸', 'study.course': '⛪', 'read.catechism': '✝️', 'study.doctrine': '💡', 'study.visual': '🎨', 'learn.mass': '🍞', 'study.apologetics': '❓', 'study.paths': '🛤️', 'study.story': '📖',
  'pray.rosary': '📿', 'pray.mercy': '❤️', 'pray.devotions': '🙏', 'pray.mass': '🍷', 'pray.massef': '🕍', 'pray.life': '🗓️', 'pray.confession': '🕊️', 'pray.examination': '🪞', 'pray.examen': '🌙', 'pray.office': '🔔', 'pray.prayers': '📕', 'pray.novenas': '🔥', 'pray.lectio': '🕯️', 'pray.year': '🎄', 'pray.sunday': '☀️', 'pray.morning': '🌅', 'pray.sleep': '😴', 'pray.build': '🧩', 'pray.journal': '✍️', 'pray.liturgies': '⛪', 'pray.divineliturgy': '☦️', 'pray.intentions': '🙌', 'pray.memento': '⏳', 'pray.pilgrim': '🥾',
  'today.readings': '📜', 'today.plans': '📅', 'today.days': '⭐', 'today.session': '🧘', 'today.memorize': '🧠',
  'you.library': '🗒️', 'you.history': '🕘', 'you.year': '📊', 'you.kid': '🧒', 'learn.glossary': '📖', 'learn.map': '🗺️', 'bible.fathers': '📜', 'bible.progress': '📗', 'learn.whosaid': '💬', 'learn.chain': '🔗', 'learn.whichbook': '📖', 'learn.crossword': '✏️', 'learn.pilgrim': '📍', 'read.saintnames': '🪪', 'you.mysaints': '🎂', 'pray.home': '🏡', 'pray.calendar': '🗓️', 'read.choosesaint': '🧭', 'learn.saintguess': '🕊️', 'learn.whoami': '🧔', 'pray.familysheet': '👨‍👩‍👧', 'teach.bell': '🔔', 'learn.wordsearch': '🔍', 'learn.artdetective': '🖼️', 'learn.doctrineladder': '🪜', 'learn.verbum': '🟨', 'learn.charades': '🎭', 'learn.games': '🎲', 'learn.quartets': '🔶', 'learn.cloister': '🔤', 'learn.prophet': '🔮', 'learn.compare': '⚖️', 'learn.ask': '❓', 'you.goals': '🎯', 'you.downloads': '⬇️', 'you.privacy': '🔒', 'you.settings': '⚙️', 'you.account': '☁️', 'you.about': 'ℹ️',
  'listen.biay': '🎧', 'listen.foryou': '⭐', 'listen.videos': '▶️', 'listen.podcasts': '🎙️', 'listen.audiobooks': '📚', 'listen.programmes': '📻',
  'teach.classes': '👩‍🏫', 'teach.join': '🔑', 'teach.handbook': '📋', 'teach.run': '🎒',
};
const byId = new Map(FEATURES.map((f) => [f.id, f]));
export const feature = (id: string) => byId.get(id);

/** The title of a tab's front page. On the tab roots the title is only for screen readers: the tab you just tapped already says where you are. */
export function HubHeader({ title, sub, action, quiet }: { title: string; sub?: string; action?: ReactNode; quiet?: boolean }) {
  if (quiet) return (
    <header className="hub-head quiet">
      <h1 className="sr-only">{title}</h1>
      {(sub || action) && <div className="hub-quiet-row">{sub && <p className="hub-sub">{sub}</p>}{action}</div>}
    </header>
  );
  return (
    <header className="hub-head">
      <div><h1>{title}</h1>{sub && <p className="hub-sub">{sub}</p>}</div>
      {action}
    </header>
  );
}

export function HubHero({ tone, eyebrow, title, text, children }: { tone: string; eyebrow?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className={`hub-hero tone-${tone}`}>
      {eyebrow && <p className="hub-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children && <div className="hub-hero-acts">{children}</div>}
    </section>
  );
}

/** A titled set of tiles. In the compact layout only the groups marked `open` show; the rest fold away under their title, so a tab fits one screen. */
export function Group({ title, hint, children, open }: { title: string; hint?: string; children: ReactNode; open?: boolean }) {
  const [s] = useSettings();
  if (s.layout === 'compact' && !open) return <Fold id={`grp:${title}`} title={title}>{children}</Fold>;
  return <section className="hub-group"><div className="hub-group-head"><h2>{title}</h2>{hint && s.layout !== 'compact' && <span>{hint}</span>}</div>{children}</section>;
}

export function Tile({ f, icon }: { f: Feature; icon?: string }) {
  return (
    <Link to={f.to} data-seen={f.id} className="hub-tile">
      <span className="hub-ico" aria-hidden="true">{icon ?? ICON[f.id] ?? '•'}</span>
      <span className="hub-tile-t">{f.title}</span>
      <span className="hub-dot"><NewDot id={f.id} label="New" /></span>
      <span className="hub-tile-d">{f.blurb}</span>
    </Link>
  );
}

/** Tiles for the given feature ids, in that order. Unknown ids are skipped. */
export function Tiles({ ids, overrides }: { ids: string[]; overrides?: Record<string, Partial<Feature>> }) {
  useSync();
  const list = ids.map((id) => byId.get(id)).filter((f): f is Feature => !!f && visible(f));
  return <div className="hub-tiles">{list.map((f) => <Tile key={f.id} f={overrides?.[f.id] ? { ...f, ...overrides[f.id] } : f} />)}</div>;
}

/** One full-width row: a title, an optional note on the right, a chevron. The only kind of big tap target on a tab front page, always the same height. */
export function RowLink({ to, title, meta, strong }: { to: string; title: string; meta?: string; strong?: boolean }) {
  return (
    <Link to={to} className={`rowlink${strong ? ' strong' : ''}`}>
      <span className="rowlink-t">{title}</span>
      {meta && <span className="rowlink-m">{meta}</span>}
      <span className="rowlink-go" aria-hidden="true">›</span>
    </Link>
  );
}
