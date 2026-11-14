// Profiles: alias search + kind filter, relation labels, return-to-origin trail, share/collection controls, map/list only where places have points.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const fail = (m) => { console.error('FAIL', m); process.exit(1); };
for (const width of [320, 1280]) {
  const ctx = await b.newContext({ viewport: { width, height: 800 } });
  await ctx.addInitScript(() => { localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:tour', '1'); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/#/study/profiles`);
  await p.waitForSelector('.pcard');
  await p.fill('input[aria-label="Search profiles"]', 'cephas');
  await p.waitForFunction(() => document.querySelectorAll('.pcard').length === 2);
  const t = await p.locator('.pcard').first().innerText();
  if (!/Peter/.test(t) || !/also known as Cephas/.test(t)) fail(`alias search: ${t}`);
  if (!/#\/study\/profiles\?.*q=cephas/.test(p.url())) fail('search is not in the address');
  await p.fill('input[aria-label="Search profiles"]', '');
  // kind filter + map/list toggle exist only with places
  await p.click('button.chip:has-text("People")');
  if (await p.locator('button.chip:has-text("Map (")').count()) fail('people have no map');
  await p.click('button.chip:has-text("Places")');
  await p.waitForSelector('button.chip:has-text("Map (")');
  await p.click('button.chip:has-text("Map (")');
  await p.waitForSelector('.profiles-map .leaflet-container, .profiles-map.leaflet-container');
  await p.click('button.chip:has-text("List")');
  // a profile: relation label, share, collection, return to origin
  await p.goto(`${BASE}/#/study/profiles?q=adam`);
  await p.waitForSelector('.pcard a');
  await p.click('.pcard a:text-is("Adam")');
  await p.waitForSelector('h1:has-text("Adam")');
  if (!(await p.locator('button:has-text("Back to Saints, people and places")').count())) fail('no way back to the list');
  if (!(await p.locator('button[aria-label^="Share a link to Adam"]').count())) fail('no share');
  if (!(await p.locator('button:has-text("Collection")').count())) fail('no collection button');
  const rel = p.locator('section[aria-label="Related profiles"]');
  if (!/husband of:/.test(await rel.innerText())) fail('relation label missing');
  await rel.locator('a:has-text("Eve")').click();
  await p.waitForSelector('h1:has-text("Eve")');
  if (!/wife of/.test(await p.locator('section[aria-label="Related profiles"]').innerText())) fail('Eve does not show her relation');
  await p.click('button:has-text("Back to Adam")');
  await p.waitForSelector('h1:has-text("Adam")');
  await p.click('button:has-text("Back to Saints, people and places")');
  await p.waitForSelector('input[aria-label="Search profiles"]');
  // a place with a point offers the map; a person does not
  await p.goto(`${BASE}/#/study/profile/place/jerusalem`);
  await p.click('button:has-text("Show on map")');
  await p.waitForSelector('.profiles-map');
  await p.goto(`${BASE}/#/study/profile/person/adam`);
  await p.waitForSelector('h1:has-text("Adam")');
  if (await p.locator('button:has-text("Show on map")').count()) fail('person offers a map');
  if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) fail(`sideways scroll at ${width}`);
  // an unknown profile says so
  await p.goto(`${BASE}/#/study/profile/person/nobody`);
  await p.waitForSelector('[data-state="not-found"]');
  if (errs.length) fail(errs[0]);
  await ctx.close();
}
await b.close();
console.log('profiles nav e2e ok');
