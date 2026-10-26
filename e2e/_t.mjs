import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 360, height: 760 }, hasTouch: true });
await ctx.addInitScript(() => { localStorage.setItem('sb:tour', '1'); localStorage.setItem('sb:setup', '2'); });
const p = await ctx.newPage();
await p.goto('http://localhost:4173/#/profile'); await p.waitForTimeout(1500);
console.log(await p.evaluate(() => { const o=[]; for (const e of document.querySelectorAll('.page *')) { const r=e.getBoundingClientRect(); if (r.right>window.innerWidth+1) o.push(e.tagName+'.'+e.className+' '+Math.round(r.right)+' '+(e.parentElement.className)+' | '+(e.parentElement.textContent||'').slice(0,40)); } return [document.documentElement.scrollWidth, document.body.scrollWidth, innerWidth, o.slice(0,12)]; }));
await b.close();
