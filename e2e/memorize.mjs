// A verse can be put on the memory list straight from the Bible.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:4173';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage();
await p.goto(`${BASE}/#/read/webc/JHN/3`);
await p.waitForSelector('.v[data-v="16"]');
await p.tap('.v[data-v="16"]');
await p.click('button[aria-label="Memorize this passage"]');
await p.waitForSelector('button[aria-label^="Memorizing"]');
await p.goto(`${BASE}/#/memorize`);
await p.waitForSelector('text=/John 3:16/', { timeout: 8000 });
await b.close();
console.log('memorize e2e ok');
