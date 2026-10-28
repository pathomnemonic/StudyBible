import { chromium } from 'playwright';

/** The interactive prayers: the rosary bead by bead, Divine Mercy, the Angelus and the Stations, on a wide and a narrow screen. */
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const errs = [];
const fail = (m) => { console.error('FAIL', m); process.exitCode = 1; };
for (const [vw, vh, tag] of [[1280, 900, 'wide'], [390, 800, 'narrow']]) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } });
  await ctx.addInitScript(() => { try { { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); }; } catch {} });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|favicon|net::ERR|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const over = async (where) => { if (await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail(`${tag} horizontal overflow on ${where}`); };

  await p.goto(`${BASE}/#/pray/devotions`);
  await p.waitForSelector('.rosary-hero');
  await over('devotions');
  if ((await p.locator('.mystery-strip img').count()) < 5) { await p.waitForTimeout(800); }
  if ((await p.locator('.mystery-strip img').count()) < 5) fail(`${tag} mystery pictures missing`);
  await p.screenshot({ path: `/tmp/claude-0/pray-home-${tag}.png` });

  // Rosary: pray the first decade
  await p.goto(`${BASE}/#/pray/devotions/rosary?set=joyful`);
  await p.waitForSelector('.rosary-svg');
  await over('rosary');
  const primary = p.locator('.rosary-bar .btn.primary');
  const title = () => p.locator('.rosary-card .card-title').innerText();
  if (!/Sign of the Cross/i.test(await title())) fail('rosary should open at the Sign of the Cross');
  for (let n = 0; n < 7; n++) await primary.click(); // sign, creed, our father, 3 hail marys, glory
  if (!/first joyful mystery: The Annunciation/i.test(await title())) fail(`expected first mystery, got ${await title()}`);
  await p.waitForSelector('.rosary-art img');
  await p.waitForSelector('.reading-block .reading-text', { timeout: 8000 }).catch(() => fail('mystery scripture did not load'));
  await p.screenshot({ path: `/tmp/claude-0/pray-rosary-${tag}.png` });
  await primary.click(); // Our Father
  for (let n = 0; n < 11; n++) await primary.click(); // into the ten Hail Marys and past the last one
  if (!/Glory Be/i.test(await title())) fail(`expected Glory Be after ten Hail Marys, got ${await title()}`);
  await primary.click(); await primary.click();
  if (!/second joyful mystery: The Visitation/i.test(await title())) fail(`expected second mystery, got ${await title()}`);
  // resume after leaving
  await p.goto(`${BASE}/#/pray/devotions`);
  await p.goto(`${BASE}/#/pray/devotions/rosary?set=joyful`);
  await p.waitForSelector('.rosary-svg');
  if (!(await p.locator('.rosary-resume').count())) fail('rosary should offer to pick up where it was left');
  await p.locator('.rosary-resume .btn.primary').click();
  if (!/second joyful mystery/i.test(await title())) fail('rosary should resume where it was left');
  // jump by decade chip and back, keyboard
  await p.locator('.rosary-jump .chip', { hasText: /^4$/ }).click();
  if (!/fourth joyful mystery/i.test(await title())) fail('decade chip should jump to the fourth mystery');
  await p.keyboard.press('ArrowLeft');
  await p.keyboard.press('ArrowRight');
  await p.locator('.rosary-bar .btn', { hasText: 'Restart' }).click();
  if (!/Sign of the Cross/i.test(await title())) fail('restart should return to the crucifix');
  // other mystery sets use their own pictures
  for (const set of ['luminous', 'sorrowful', 'glorious']) {
    await p.goto(`${BASE}/#/pray/devotions/rosary?set=${set}`);
    await p.waitForSelector('.rosary-svg');
    await p.locator('.rosary-jump .chip', { hasText: /^1$/ }).click();
    await p.waitForSelector('.rosary-art img', { timeout: 6000 }).catch(() => fail(`${set}: no picture`));
  }
  // pace mode moves by itself
  await p.goto(`${BASE}/#/pray/devotions/rosary?set=joyful`);
  await p.waitForSelector('.rosary-svg');
  await p.locator('.mode', { hasText: 'Set the pace' }).click();
  await p.locator('.rosary-speed .btn', { hasText: 'Brisk' }).click();
  const before = await title();
  await p.waitForFunction((t) => document.querySelector('.rosary-card .card-title')?.textContent !== t, before, { timeout: 15000 }).catch(() => fail('pace mode did not advance'));
  // pray with me: the recording panel appears with its credit
  await p.locator('.mode', { hasText: 'Pray with me' }).click();
  await p.waitForSelector('.rosary-audio');
  if (!/Creedal/.test(await p.locator('.rosary-audio').innerText())) fail('recording panel should credit Creedal');
  await over('rosary audio');
  await p.screenshot({ path: `/tmp/claude-0/pray-audio-${tag}.png` });

  // Divine Mercy
  await p.goto(`${BASE}/#/pray/devotions/divine-mercy`);
  await p.waitForSelector('.rosary-svg');
  for (let n = 0; n < 5; n++) await primary.click();
  if (!/Decade 1: Eternal Father/i.test(await title())) fail(`mercy should reach decade 1, got ${await title()}`);
  await primary.click();
  if (!/of the Passion|sorrowful Passion/i.test(await p.locator('.rosary-text').innerText())) fail('mercy small bead text');
  await over('divine mercy');

  // Angelus and Stations
  await p.goto(`${BASE}/#/pray/devotions/angelus`);
  await p.waitForSelector('.rosary-card');
  for (let n = 0; n < 4; n++) await p.locator('.rosary-bar .btn.primary').click();
  await over('angelus');
  await p.goto(`${BASE}/#/pray/devotions/stations`);
  await p.waitForSelector('.rosary-card');
  await p.locator('.rosary-bar .btn.primary').click();
  await p.waitForSelector('.rosary-art img', { timeout: 6000 }).catch(() => fail('stations: no picture at the first station'));
  await over('stations');
  for (const more of ['holy-hour', 'loreto', 'litany-st-joseph', 'st-michael', 'litany-sacred-heart', 'litany-holy-name', 'litany-precious-blood', 'litany-humility']) {
    await p.goto(`${BASE}/#/pray/devotions/${more}`);
    await p.waitForSelector('.rosary-card');
    for (let n = 0; n < 3; n++) await p.locator('.rosary-bar .btn.primary').click();
    await over(more);
  }
  await p.goto(`${BASE}/#/pray/devotions/seven-sorrows`);
  await p.waitForSelector('.rosary-card');
  await over('sorrows');
  await ctx.close();
}
await b.close();
if (errs.length) { console.error('errors', errs); process.exitCode = 1; }
else if (!process.exitCode) console.log('pray e2e ok');
