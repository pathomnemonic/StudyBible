import { chromium } from 'playwright';
import { startBroker } from '/home/user/StudyBible/scripts/dev/mini-broker.mjs';
const broker = await startBroker(0);
const b = await chromium.launch();
const BASE='http://127.0.0.1:5208';
const mk = async (w,h=900)=>{const c=await b.newContext({viewport:{width:w,height:h}});await c.addInitScript((B)=>{localStorage.setItem('sb:setup','2');localStorage.setItem('sb:tour','1');localStorage.setItem('sb:live:brokers',B)},`ws://127.0.0.1:${broker.port}/mqtt`);const p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));return p};
for (const w of [390,1280]) {
  const h=await mk(w); await h.goto(BASE+'/#/play/online');
  await h.screenshot({path:`/tmp/claude-0/shots/online-${w}.png`});
  await h.getByRole('radio',{name:'Crown Quest race'}).click(); await h.screenshot({path:`/tmp/claude-0/shots/online-crowns-${w}.png`});
  await h.getByRole('button',{name:'Open the room'}).click(); await h.waitForSelector('.live-code'); await h.waitForTimeout(1500);
  await h.screenshot({path:`/tmp/claude-0/shots/lobby-${w}.png`});
  const code=(await h.locator('.live-code').innerText()).trim();
  const p=await mk(w); await p.goto(BASE+'/#/join/'+code); await p.getByPlaceholder('A name everyone will know').fill('Ann'); await p.getByRole('button',{name:'Join',exact:true}).click(); await p.waitForSelector('text=You’re in!');
  await h.getByRole('button',{name:/^Start/}).first().click(); await h.waitForSelector('.lv-crownboard li');
  await p.getByRole('button',{name:/Spin/}).click(); await p.waitForTimeout(1500);
  await p.screenshot({path:`/tmp/claude-0/shots/cplay-${w}.png`}); await h.screenshot({path:`/tmp/claude-0/shots/chost-${w}.png`});
  const sw = await p.evaluate(()=>document.documentElement.scrollWidth); console.log(w,'scrollWidth',sw);
}
await b.close(); broker.close();
