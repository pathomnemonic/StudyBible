// The second-cycle study tools: compare authors on a passage, the glossary's plain-words label and cited Scripture, and the offline summary.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); localStorage.setItem('sb:audienceAsked', '1'); });
const p = await ctx.newPage(); p.setDefaultTimeout(15000);
const fail = (m) => { console.error('FAIL', m); process.exit(1); };

// 1. compare the authors on John 6:51
await p.goto(`${BASE}/#/read/webc/JHN/6`); await p.waitForSelector('.v');
await p.locator('.v[data-v="51"] .vn').first().click(); await p.waitForSelector('aside.panel'); await p.waitForTimeout(2500);
const fold = p.locator('details.fc-fold');
if (!(await fold.count())) fail('the panel should offer to compare the authors on this passage');
await fold.locator('summary').click(); await p.waitForTimeout(600);
const boxes = await fold.locator('.fc-pick input[type=checkbox]').count();
if (boxes < 2) fail('at least two authors should be selectable, got ' + boxes);
const cols0 = await fold.locator('.fc-col').count();
await fold.locator('.fc-pick label').nth(cols0 < boxes ? cols0 : 0).click(); await p.waitForTimeout(400);
const text = await fold.innerText();
if (!/Direct|Editorial/.test(text)) fail('each item says whether the link is direct or editorial');
if (!/Read in the original work|Open the source/.test(text)) fail('each item links to the original');
if (!/Apostolic|Patristic|Medieval|Early modern|Modern|Contemporary|·/.test(text)) fail('each item gives its period and source');

// 2. the glossary keeps plain words apart from the Church's own wording
await p.goto(`${BASE}/#/study/glossary`); await p.waitForSelector('.glossary li');
const li = p.locator('.glossary li').first();
if (!/plain words/i.test(await li.innerText())) fail('an entry says its explanation is in plain words');
if (!/Church.s own words: Catechism/.test(await li.innerText())) fail('an entry links the Church’s own words');
await li.locator('details.gl-extra summary').click(); await p.waitForTimeout(2500);
const extra = await li.locator('details.gl-extra').innerText();
if (!/[A-Z][a-z]+ \d+/.test(extra) && !/no Scripture passage/.test(extra)) fail('the cited-Scripture list should load or say there is none: ' + extra);

// 3. the offline summary
await p.goto(`${BASE}/#/downloads`); await p.waitForTimeout(2500);
if (!/On this device: \d+ of \d+ Bibles/.test(await p.locator('main, .page').first().innerText())) fail('Downloads summarises what is saved');
await b.close(); console.log('studytools ok');
