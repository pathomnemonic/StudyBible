// The layout detector must catch real faults. This feeds it deliberately broken pages and a clean one: a detector that cannot fail proves nothing.
import { chromium } from 'playwright';
import { INVARIANTS } from './lib/invariants.mjs';
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 360, height: 640 } })).newPage();
const run = async (html, scroll = 0) => { await p.setContent(`<!doctype html><meta name=viewport content="width=device-width"><style>body{margin:0;font:16px sans-serif}button,a{display:inline-block;padding:8px 12px;border:1px solid #888}</style><main>${html}</main>`); if (scroll) await p.evaluate((y) => window.scrollTo(0, y), scroll); await p.waitForTimeout(50); return p.evaluate(INVARIANTS); };
const has = (r, re) => r.some((x) => re.test(x));

// 1. two buttons on top of each other
let r = await run('<button style="position:absolute;left:20px;top:20px;width:160px">Alpha button</button><button style="position:absolute;left:60px;top:30px;width:160px">Beta button</button>');
if (!has(r, /overlaps/)) fail('two overlapping buttons must be reported: ' + JSON.stringify(r));
// 2. a clean layout reports nothing
r = await run('<button>One</button> <button>Two</button> <a href="#x">Three</a>');
if (r.length) fail('a clean layout must report nothing: ' + JSON.stringify(r));
// 3. an unknown sticky bar over content after scrolling is a fault
const tall = '<div style="height:2000px"><button style="position:absolute;top:900px;left:20px;width:200px">Content under the bar</button></div>';
r = await run(`<div class="rogue" style="position:sticky;top:0;z-index:5;background:#eee"><button style="position:fixed;top:0;left:10px;width:200px;z-index:9">Rogue bar button</button></div>${tall}`, 800);
// the rogue bar is fixed at top 0 and the content button sits at 900-800=100: not overlapping; move the content under it
r = await run(`<button class="rogue" style="position:fixed;top:90px;left:10px;width:200px;z-index:9">Rogue bar</button><div style="height:2000px"><button style="position:absolute;top:900px;left:20px;width:200px">Content under the bar</button></div>`, 800);
if (!has(r, /overlaps/)) fail('an unknown fixed element covering a control after scrolling must be reported (the old rule exempted it): ' + JSON.stringify(r));
// 4. a KNOWN sticky bar passing over content is allowed
r = await run(`<button class="lp-head" style="position:sticky;top:90px;left:10px;width:200px;z-index:9">Lesson steps</button><div style="height:2000px"><button style="position:absolute;top:900px;left:20px;width:200px">Content under the bar</button></div>`, 800);
if (has(r, /overlaps/)) fail('a known sticky bar passing over content must not be reported: ' + JSON.stringify(r));
// 5. tabs hidden behind a sideways scroll
r = await run('<div role="tablist" aria-label="Demo" style="display:flex;overflow-x:auto;width:200px;white-space:nowrap"><button role="tab">First tab here</button><button role="tab">Second tab here</button><button role="tab">Third tab here</button></div>');
if (!has(r, /hides tabs behind a sideways scroll/)) fail('a tab row that scrolls sideways must be reported: ' + JSON.stringify(r));
// 6. text spilling out of its box
r = await run('<a href="#" style="display:block;width:80px;overflow:visible;white-space:nowrap">A very long label that cannot fit in its box at all</a>');
if (!has(r, /spills out/)) fail('spilling text must be reported: ' + JSON.stringify(r));
// 7. the page scrolls sideways
r = await run('<div style="width:900px;height:10px;background:#ccc"></div>');
if (!has(r, /page scrolls sideways/)) fail('a page wider than the screen must be reported: ' + JSON.stringify(r));
// 8. a popup menu floating over the page is allowed
r = await run('<details open><summary>Menu</summary><div role="menu" style="position:absolute;left:10px;top:10px;width:200px"><a href="#a">Item one</a><a href="#b">Item two</a></div></details><button style="position:absolute;left:12px;top:14px;width:150px">Under the menu</button>');
if (has(r, /overlaps/)) fail('a popup menu over the page must not be reported: ' + JSON.stringify(r));
// 9. leaked code values
r = await run('<p>Value: undefined and NaN</p>');
if (!has(r, /undefined|NaN/)) fail('leaked values must be reported: ' + JSON.stringify(r));
await b.close(); console.log('invariants-selftest ok (9 fixtures)');
