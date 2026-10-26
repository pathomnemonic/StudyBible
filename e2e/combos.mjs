// Optional features must never break the layout: switch on random mixes of themes, text modes, languages, memento mori, plans, goals,
// audiences and motion, then check every main page for sideways scrolling, script errors, clipped tab labels and a Today that scrolls.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4173';
let seed = Number(process.env.SEED || 11);
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const OPT = {
  theme: ['dawn', 'dark', 'sepia', 'contrast', 'amoled', 'nord', 'midnight', 'forest'],
  fontSize: [14, 18, 22, 28], lineHeight: [1.3, 1.6, 2.0], fontFamily: ['serif', 'sans', 'dyslexic', 'hyperlegible'], letterSpacing: [0, 0.08], wordSpacing: [0, 0.2],
  margin: ['narrow', 'normal', 'wide'], motion: ['full', 'calm', 'none'], haptics: [true, false],
  audience: ['', 'adult', 'youth', 'parent', 'teacher'], weeklyGoal: [0, 5, 14], activePlan: ['', 'bible-365', 'gospels-30', 'nt-90', 'psalter-30'],
  language: ['en', 'es', 'la'], atmosphere: ['off', 'book', 'passage'], motes: [true, false], sparkles: [true, false], inlineArt: [true, false], wordFx: [true, false],
  tradition: ['latin', 'byzantine', 'maronite'], showStreaks: [true, false], scriptureOnly: [false, true], hints: [true, false], showNoteMarks: [true, false], verseLines: [false, true],
};
const memento = () => pick([{ on: false, birthday: '', expectancy: 80, onHome: true, view: 'bar' }, { on: true, birthday: '1985-03-04', expectancy: 82, onHome: true, view: 'bar' }, { on: true, birthday: '1950-01-01', expectancy: 75, onHome: true, view: 'weeks' }]);
const routes = ['today', 'bible', 'read/webc/JHN/1', 'read/webc/PSA/23', 'learn', 'pray', 'listen', 'goals', 'library', 'study/visual', 'pray/year', 'memento', 'study/doctrine', 'study/apologetics'];
const N = Number(process.env.N || 10);
const viewports = [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }];
const b = await chromium.launch();
const bad = new Set();
for (let i = 0; i < N; i++) {
  const s = {}; for (const [k, v] of Object.entries(OPT)) s[k] = pick(v); s.memento = memento();
  const vp = viewports[i % viewports.length];
  const ctx = await b.newContext({ viewport: vp });
  await ctx.addInitScript((st) => { if (sessionStorage.getItem('i')) return; sessionStorage.setItem('i', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); localStorage.setItem('studybible.settings.v1', JSON.stringify(st)); }, s);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  for (const r of routes) {
    errs.length = 0;
    await p.goto(`${BASE}/#/${r}`).catch(() => {}); await p.waitForTimeout(1300);
    const m = await p.evaluate(() => {
      const se = document.scrollingElement;
      const clipped = [...document.querySelectorAll('.tabs a, .tabs .tab')].filter((a) => a.offsetParent).flatMap((a) => [a, ...a.querySelectorAll('span')]).filter((e) => e.scrollWidth > e.clientWidth + 1).length;
      return { over: se.scrollWidth - innerWidth, vert: se.scrollHeight - innerHeight, clipped, home: !!document.querySelector('.home') };
    });
    const tag = `#${i} ${vp.width}px #/${r} ${JSON.stringify({ t: s.theme, fs: s.fontSize, ff: s.fontFamily, lang: s.language, m: s.motion, aud: s.audience, plan: s.activePlan, goal: s.weeklyGoal, mem: s.memento.on ? s.memento.view : 'off', so: s.scriptureOnly })}`;
    if (m.over > 2) bad.add(`${tag}: sideways scroll ${m.over}px`);
    if (m.clipped) bad.add(`${tag}: clipped tab label`);
    if (r === 'today' && m.vert > 1) bad.add(`${tag}: Today scrolls by ${m.vert}px`);
    if (errs.length) bad.add(`${tag}: script error ${errs[0]}`);
  }
  await ctx.close();
}
await b.close();
if (bad.size) { console.error([...bad].join('\n')); console.error(bad.size + ' problems'); process.exit(1); }
console.log('combos ok');
