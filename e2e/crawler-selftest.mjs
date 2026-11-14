// The crawler's own loops must catch what they claim to. Each fixture is a small page driven by the same openAllFolds / exerciseTabRows the sweep uses;
// the "broken" ones must be reported, the "clean" ones must not. A crawler that cannot fail proves nothing.
import { chromium } from 'playwright';
import { openAllFolds, exerciseTabRows, routeMarkers } from './lib/crawl.mjs';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 760 } })).newPage();
p.on('pageerror', (e) => console.log('PAGEERR', e.message));

async function run(html, { ceiling } = {}) {
  await p.goto('about:blank'); // a fresh document: setContent would keep earlier let/const declarations
  await p.setContent(`<!doctype html><meta name=viewport content="width=device-width"><style>body{margin:0;font:16px sans-serif}summary,button{padding:6px 10px}</style><main>${html}</main>`);
  const problems = [], warnings = [], stats = { tabGroups: 0, tabs: 0 };
  const note = (w, x) => problems.push(x), warn = (w, x) => warnings.push(x);
  const click = async (loc, what) => { try { await loc.click({ timeout: 1500 }); return true; } catch { note('', `could not click ${what}`); return false; } };
  const check = async () => {};
  const folds = await openAllFolds(p, { note, where: 'fx', click, check, ceiling });
  await exerciseTabRows(p, { note, warn, where: 'fx', click, check, stats });
  return { problems, warnings, stats, folds };
}
const has = (r, re) => r.problems.some((x) => re.test(x));

// 1. ten folds nested inside each other: all are opened (the old loop stopped after six passes)
const nest = (n) => n === 0 ? '<p>deepest</p>' : `<details><summary>Level ${n}</summary>${nest(n - 1)}</details>`;
let r = await run(nest(10));
if (r.folds !== 10 || r.problems.length) fail(`ten nested folds must all be opened: opened ${r.folds}, ${JSON.stringify(r.problems)}`);
const left = await p.locator('main details:not([open])').count();
if (left) fail(`${left} folds were left closed`);
// 2. a fold that reveals a sibling fold only when opened
r = await run('<details id=a><summary>A</summary></details><script>document.querySelector("#a").addEventListener("toggle",()=>{if(!document.querySelector("#b")){const d=document.createElement("details");d.id="b";d.innerHTML="<summary>B</summary><p>x</p>";document.querySelector("main").appendChild(d)}})</script>');
if (r.folds !== 2) fail(`a fold revealed by opening another must be opened too: opened ${r.folds}`);
// 3. a pathological page that grows a new fold every time one opens: must FAIL at the ceiling, naming what is still closed
r = await run('<details><summary>Endless 0</summary></details><script>let n=0;document.addEventListener("toggle",()=>{const d=document.createElement("details");d.innerHTML="<summary>Endless "+(++n)+"</summary>";document.querySelector("main").appendChild(d)},true)</script>', { ceiling: 4 });
if (!has(r, /fold.*still closed after 4 passes/)) fail('an endless reveal must fail at the ceiling: ' + JSON.stringify(r.problems));
// 4. popup menus are not folds
r = await run('<details class="tool-menu"><summary>Tools</summary><p>menu</p></details><details class="act-more"><summary>More</summary></details>');
if (r.folds !== 0) fail('popup menus must not be opened as folds');

const tabs = (names, body) => `<div role=tablist aria-label=T>${names.map((n, i) => `<button role=tab aria-selected=${i === 0}>${n}</button>`).join('')}</div><div id=panel></div><script>
const names=${JSON.stringify(names)};const body=${body};
function show(i){document.querySelectorAll('[role=tab]').forEach((t,k)=>t.setAttribute('aria-selected',k===i));document.getElementById('panel').innerHTML=body(i)}
document.querySelectorAll('[role=tab]').forEach((t,i)=>t.addEventListener('click',()=>show(i)));show(0)</script>`;
const list = (n) => Array.from({ length: n }, (_, k) => `<li><a href="#item${k}">Item ${k}</a></li>`).join('');
// 5. clean tabs: stable content comes back as it was
r = await run(tabs(['One', 'Two', 'Three'], '(i)=>`<ul>${(' + list.toString() + ')(' + 3 + ' + i)}</ul><p>Count ${3+i}</p>`'));
if (r.problems.length) fail('clean tabs must report nothing: ' + JSON.stringify(r.problems));
if (r.stats.tabGroups !== 1 || r.stats.tabs !== 3) fail(`all three tabs must be exercised: ${JSON.stringify(r.stats)}`);
// 6. a list of 60 items where only item 55 changes on return: the old 40-item prefix would miss it
r = await run(`<div role=tablist><button role=tab aria-selected=true>A</button><button role=tab aria-selected=false>B</button></div><div id=panel></div><script>
let v=0;const mk=(flip)=>Array.from({length:60},(_,k)=>'<li><a href="#i'+(k===55&&flip?999:k)+'">Item '+k+'</a></li>').join('');
const tabs=document.querySelectorAll('[role=tab]');
tabs[0].onclick=()=>{v++;tabs[0].setAttribute('aria-selected',true);tabs[1].setAttribute('aria-selected',false);document.getElementById('panel').innerHTML='<ul>'+mk(v>2)+'</ul>'};
tabs[1].onclick=()=>{tabs[1].setAttribute('aria-selected',true);tabs[0].setAttribute('aria-selected',false);document.getElementById('panel').innerHTML='<p>Other tab</p>'};
tabs[0].click()</script>`);
if (!has(r, /does not come back as it was.*items differ at position 56/)) fail('a change deep in a long list on return must be reported: ' + JSON.stringify(r.problems));
// 7. same count, different ids
r = await run(`<div role=tablist><button role=tab aria-selected=true>A</button><button role=tab aria-selected=false>B</button></div><div id=panel></div><script>
let v=0;const tabs=document.querySelectorAll('[role=tab]');
tabs[0].onclick=()=>{v++;tabs[0].setAttribute('aria-selected',true);tabs[1].setAttribute('aria-selected',false);document.getElementById('panel').innerHTML=[1,2,3].map(k=>'<div data-id="r'+(v>2&&k===2?9:k)+'">Row '+k+'</div>').join('')};
tabs[1].onclick=()=>{tabs[1].setAttribute('aria-selected',true);tabs[0].setAttribute('aria-selected',false);document.getElementById('panel').innerHTML='<p>Elsewhere</p>'};
tabs[0].click()</script>`);
if (!has(r, /does not come back as it was.*ids differ at position 2/)) fail('same count but a different record id must be reported: ' + JSON.stringify(r.problems));
// 8. reordered items
r = await run(`<div role=tablist><button role=tab aria-selected=true>A</button><button role=tab aria-selected=false>B</button></div><div id=panel></div><script>
let v=0;const tabs=document.querySelectorAll('[role=tab]');
tabs[0].onclick=()=>{v++;tabs[0].setAttribute('aria-selected',true);tabs[1].setAttribute('aria-selected',false);const o=v>2?[2,1,3]:[1,2,3];document.getElementById('panel').innerHTML=o.map(k=>'<a href="#k'+k+'">Link '+k+'</a>').join(' ')};
tabs[1].onclick=()=>{tabs[1].setAttribute('aria-selected',true);tabs[0].setAttribute('aria-selected',false);document.getElementById('panel').innerHTML='<p>Elsewhere</p>'};
tabs[0].click()</script>`);
if (!has(r, /does not come back as it was.*items differ/)) fail('reordered items must be reported: ' + JSON.stringify(r.problems));
// 9. the same text with a number changed (a count that drifts)
r = await run(`<div role=tablist><button role=tab aria-selected=true>A</button><button role=tab aria-selected=false>B</button></div><div id=panel></div><script>
let v=0;const tabs=document.querySelectorAll('[role=tab]');
tabs[0].onclick=()=>{v++;tabs[0].setAttribute('aria-selected',true);tabs[1].setAttribute('aria-selected',false);document.getElementById('panel').innerHTML='<p>'+(v>2?'11':'12')+' items in this list</p>'};
tabs[1].onclick=()=>{tabs[1].setAttribute('aria-selected',true);tabs[0].setAttribute('aria-selected',false);document.getElementById('panel').innerHTML='<p>Elsewhere</p>'};
tabs[0].click()</script>`);
if (!has(r, /does not come back as it was.*text differs/)) fail('a changed number must be reported: ' + JSON.stringify(r.problems));
// 10. a middle tab (not the first) that changes on return: only revisiting every tab finds it
r = await run(`<div role=tablist><button role=tab aria-selected=true>A</button><button role=tab aria-selected=false>B</button><button role=tab aria-selected=false>C</button></div><div id=panel></div><script>
let v=0;const tabs=[...document.querySelectorAll('[role=tab]')];
const sel=(i)=>tabs.forEach((t,k)=>t.setAttribute('aria-selected',k===i));
tabs[0].onclick=()=>{sel(0);document.getElementById('panel').innerHTML='<p>A</p>'};
tabs[1].onclick=()=>{v++;sel(1);document.getElementById('panel').innerHTML='<ul><li><a href="#x'+(v>1?'2':'1')+'">B item</a></li></ul>'};
tabs[2].onclick=()=>{sel(2);document.getElementById('panel').innerHTML='<p>C</p>'};
tabs[0].click()</script>`);
if (!has(r, /tab "B" does not come back as it was/)) fail('a middle tab that changes on return must be reported: ' + JSON.stringify(r.problems));
// 11. panel identity: the panel id differs on return
r = await run(`<div role=tablist><button role=tab aria-selected=true>A</button><button role=tab aria-selected=false>B</button></div><div id=host></div><script>
let v=0;const tabs=[...document.querySelectorAll('[role=tab]')];
tabs[0].onclick=()=>{v++;tabs[0].setAttribute('aria-selected',true);tabs[1].setAttribute('aria-selected',false);host.innerHTML='<div role=tabpanel id="p'+(v>2?'x':'a')+'" aria-labelledby=t>Same text</div>'};
tabs[1].onclick=()=>{tabs[1].setAttribute('aria-selected',true);tabs[0].setAttribute('aria-selected',false);host.innerHTML='<div role=tabpanel id=pb>Elsewhere</div>'};
tabs[0].click()</script>`);
if (!has(r, /does not come back as it was.*panels differ/)) fail('a different panel on return must be reported: ' + JSON.stringify(r.problems));
// 12. a second tab row that only appears after a tab is clicked is found and exercised
r = await run(`<div role=tablist aria-label=Outer><button role=tab aria-selected=true>O1</button><button role=tab aria-selected=false>O2</button></div><div id=inner></div><script>
const o=[...document.querySelectorAll('[role=tab]')];
o[1].addEventListener('click',()=>{inner.innerHTML='<div role=tablist aria-label=Inner><button role=tab aria-selected=true>I1</button><button role=tab aria-selected=false>I2</button></div>';const i=[...inner.querySelectorAll('[role=tab]')];i.forEach((t,k)=>t.onclick=()=>i.forEach((u,j)=>u.setAttribute('aria-selected',j===k)))});
o.forEach((t,k)=>t.addEventListener('click',()=>o.forEach((u,j)=>u.setAttribute('aria-selected',j===k))))</script>`);
if (r.stats.tabGroups !== 2) fail(`the row revealed by clicking a tab must be found: ${JSON.stringify(r.stats)} ${JSON.stringify(r.problems)}`);
// 13. a tab that does not mark itself selected
r = await run('<div role=tablist><button role=tab aria-selected=true>A</button><button role=tab aria-selected=false>B</button></div><div>content</div>');
if (!has(r, /not marked selected/)) fail('a tab that never becomes selected must be reported: ' + JSON.stringify(r.problems));
// 14-18. route markers: a misrouted page, a missing not-found state, and the clean cases
const page = async (html, title = 'App') => { await p.goto('about:blank'); await p.setContent(`<!doctype html><title>${title}</title><main>${html}</main>`); };
await page('<div class="page"><h1>Saturday of the 32nd week</h1></div>');
let m = await routeMarkers(p, { path: '/study/catechism', kind: 'static', expect: 'Catechism of the Catholic Church' });
if (!m.some((x) => /should show a heading matching/.test(x))) fail('a misrouted page (Today where the Catechism belongs) must fail: ' + JSON.stringify(m));
await page('<div class="page"><h1>Catechism of the Catholic Church</h1></div>');
m = await routeMarkers(p, { path: '/study/catechism', kind: 'static', expect: 'Catechism of the Catholic Church' });
if (m.length) fail('the right page must pass: ' + JSON.stringify(m));
await page('<div class="page"><h1>Collection</h1><p>Nothing here yet.</p></div>');
m = await routeMarkers(p, { path: '/collection/__nope__', kind: 'unknown-id' });
if (!m.some((x) => /no explicit not-found state/.test(x))) fail('an unknown id that shows an ordinary page must fail: ' + JSON.stringify(m));
await page('<div class="page" data-state="not-found"><h1>Collection not found</h1></div>');
m = await routeMarkers(p, { path: '/collection/__nope__', kind: 'unknown-id' });
if (m.length) fail('an explicit not-found state must pass for an unknown id: ' + JSON.stringify(m));
m = await routeMarkers(p, { path: '/collection/1', kind: 'sample' });
if (!m.some((x) => /not-found state is showing for a route that should exist/.test(x))) fail('the not-found state on a real route must fail: ' + JSON.stringify(m));
await b.close();
console.log('crawler-selftest ok (18 fixtures: 4 fold, 9 tab, 5 route marker)');
