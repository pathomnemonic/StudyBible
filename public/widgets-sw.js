/* Widget handlers for the installed web app on Windows 11 (the Widgets board). They run inside the app's service worker, which loads this file.
   The verse of the day follows the same rule as the app: public/widgets/verses.json is in the same order as the app's list. */
const dayOfYear = (d) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);

async function todaysVerse() {
  const list = await (await fetch('widgets/verses.json')).json();
  const d = new Date();
  return list[(dayOfYear(d) - 1 + d.getFullYear()) % list.length];
}

async function updateVerseWidget() {
  if (!self.widgets) return;
  const widget = await self.widgets.getByTag('verse');
  if (!widget) return;
  const template = await (await fetch(widget.definition.msAcTemplate)).text();
  const v = await todaysVerse();
  await self.widgets.updateByTag('verse', { template, data: JSON.stringify({ verse: v.text, ref: v.ref }) });
}

self.addEventListener('widgetinstall', (e) => e.waitUntil(updateVerseWidget()));
self.addEventListener('widgetresume', (e) => e.waitUntil(updateVerseWidget()));
self.addEventListener('periodicsync', (e) => { if (e.tag === 'widget-verse') e.waitUntil(updateVerseWidget()); });
self.addEventListener('widgetclick', (e) => {
  if (e.action === 'open') e.waitUntil(self.clients.openWindow('./#/today'));
});
