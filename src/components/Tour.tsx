import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import Icon from './Icon';

const KEY = 'sb:tour';
const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } };
const mark = () => { try { localStorage.setItem(KEY, '1'); localStorage.setItem('sb:whatsNew', '2026-10b'); } catch { /* private mode */ } };

interface Step { icon: string; title: string; body: string[]; to?: string; go?: string }
const STEPS: Step[] = [
  { icon: 'sun', title: 'Welcome to Study Bible', body: ['A Catholic study Bible that works on your phone, tablet or computer, and mostly without an internet connection. Five tabs run along the bottom (or down the side on a computer): Profile, Study, Today, Bible and Listen.', 'This short tour shows what each one does. You can skip it now and take it again any time from Profile.'] },
  { icon: 'sun', title: 'Today: your starting point', body: ['A verse for the day that matches the Church’s season, a line from a saint, and a question to take with you. Swipe or use the arrows to change the day.', 'Under it are three ways back in: continue the chapter you were reading, your place in the reading room, or your Bible in a Year episode. You can also open the Mass readings, hear chant for the season, make a picture of the verse, memorize it, or star the day.'], to: '/today', go: 'Open Today' },
  { icon: 'read', title: 'The Bible', body: ['Pick any book and chapter from the title at the top. Tap a verse and the study panel opens with what the Church has said about it: the Church Fathers, Haydock and Challoner, the Catechism paragraphs that cite it, cross-references, the Greek and Hebrew words, pictures and more. Tap the small number beside a verse to open its notes.', 'Choose a translation from the toggle at the top. Jesus’s words are in red, key words glow or move gently (a few per chapter), and the text settings let you change size, theme, sound and more. Douay-Rheims, Septuagint and others are in the Translations list; the Church-approved modern Bibles open at the publisher’s own site.'], to: '/read', go: 'Open the Bible' },
  { icon: 'listen', title: 'Listen: the Bible in a Year', body: ['Fr. Mike Schmitz’s daily episodes, matched to the chapters they read. Every chapter of the Bible is covered, and each chapter page in the Bible tab shows its episode at the top. Play, queue, and mark days done.'], to: '/listen', go: 'Open Listen' },
  { icon: 'study', title: 'Study: everything educational', body: ['The Catechism of the Catholic Church in full with search; the reading room of the Fathers, saints and councils; study paths that walk through a theme step by step; maps and a timeline; the Scripture universe (a galaxy of all 73 books with the Fathers around them); a gallery of paintings and engravings; who quoted which verse; key words; doctrine topics and more.'], to: '/study', go: 'Open Study' },
  { icon: 'user', title: 'Profile: what is yours', body: ['Your notes, highlights and bookmarks; reading plans; memorizing; prayer, a prayer journal and Lectio Divina; favourite days; your week at a glance; export and backup; settings; and an optional account to sync between devices. Everything stays on your device unless you sign in.'], to: '/profile', go: 'Open Profile' },
  { icon: 'search', title: 'Search and shortcuts', body: ['The Search button (or Ctrl or ⌘ plus K) jumps to any passage, searches the Bible and the library, and opens any page in the app. Press ? on a computer for the keyboard shortcuts. On a phone, swipe left or right in a chapter to move between chapters.'] },
  { icon: 'info', title: 'Honest about sources', body: ['Every text in the app says where it comes from. Public-domain texts are built in; modern copyrighted Bibles are linked, never copied; and where something is a translation made with AI help or a commentary from the 1800s, it is labelled. Settings has an offline section so you can download what you want to keep on your device.'], to: '/study/sources', go: 'See the sources' },
];

/** The first-run walkthrough. Shown once; reachable again from Profile (or the event `studybible:tour`). */
export default function Tour() {
  const [open, setOpen] = useState(() => !seen());
  const [i, setI] = useState(0);
  useEffect(() => {
    const h = () => { setI(0); setOpen(true); };
    window.addEventListener('studybible:tour', h);
    return () => window.removeEventListener('studybible:tour', h);
  }, []);
  if (!open) return null;
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  const close = () => { mark(); setOpen(false); };
  return (
    <Modal title={s.title} onClose={close}>
      <div className="tour">
        <div className="tour-ico" aria-hidden="true"><Icon name={s.icon} size={30} /></div>
        {s.body.map((p, k) => <p key={k}>{p}</p>)}
        <div className="tour-dots" role="group" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
          {STEPS.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}
        </div>
        <div className="row between tour-actions">
          <button className="btn ghost" onClick={close}>{last ? 'Close' : 'Skip the tour'}</button>
          <span className="row" style={{ gap: 8 }}>
            {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Back</button>}
            {s.to && <Link className="btn" to={s.to} onClick={close}>{s.go}</Link>}
            {last ? <button className="btn primary" onClick={close}>Get started</button> : <button className="btn primary" onClick={() => setI(i + 1)}>Next</button>}
          </span>
        </div>
      </div>
    </Modal>
  );
}
