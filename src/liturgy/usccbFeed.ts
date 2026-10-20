/**
 * The USCCB's own daily-readings RSS feed (https://bible.usccb.org/readings.rss), shown as published.
 * The USCCB's web-usage terms allow displaying the daily readings from that feed on a website that does not
 * charge or otherwise condition access. The file is fetched by the site's build (see .github/workflows/pages.yml)
 * and shown here with its copyright notice and a link back to the source. Nothing else is taken from usccb.org.
 */
export interface FeedSection { label: string; ref: string; href: string; paragraphs: { html: string }[] }
export interface FeedDay { date: string; title: string; link: string; sections: FeedSection[]; copyright: string }

let cache: Promise<Map<string, FeedDay>> | null = null;

const ALLOWED = new Set(['STRONG', 'EM', 'B', 'I', 'BR']);
/** keep only line breaks and emphasis from the feed's markup */
function clean(node: Node): string {
  let out = '';
  node.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += (n.textContent ?? '').replace(/ /g, ' ').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
    else if (n.nodeType === 1) {
      const el = n as Element;
      if (ALLOWED.has(el.tagName)) out += el.tagName === 'BR' ? '<br>' : `<${el.tagName.toLowerCase()}>${clean(el)}</${el.tagName.toLowerCase()}>`;
      else out += clean(el);
    }
  });
  return out;
}

export function parseFeed(xml: string): Map<string, FeedDay> {
  const out = new Map<string, FeedDay>();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const copyright = doc.querySelector('channel > copyright')?.textContent?.trim() ?? '';
  doc.querySelectorAll('item').forEach((it) => {
    const link = it.querySelector('link')?.textContent?.trim() ?? '';
    const m = /readings\/(\d{2})(\d{2})(\d{2})\.cfm/.exec(link);
    if (!m) return;
    const date = `20${m[3]}-${m[1]}-${m[2]}`;
    const html = new DOMParser().parseFromString(it.querySelector('description')?.textContent ?? '', 'text/html');
    const sections: FeedSection[] = [];
    html.body.querySelectorAll('h4').forEach((h) => {
      const a = h.querySelector('a');
      const label = (h.textContent ?? '').replace(a?.textContent ?? '\u0000', '').replace(/\s+/g, ' ').trim();
      const body = h.nextElementSibling;
      const paragraphs = body ? [...body.querySelectorAll('p')].map((p) => ({ html: clean(p) })).filter((p) => p.html.trim()) : [];
      sections.push({ label, ref: (a?.textContent ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim(), href: a?.getAttribute('href')?.trim() ?? '', paragraphs });
    });
    if (sections.length) out.set(date, { date, title: it.querySelector('title')?.textContent?.trim() ?? '', link, sections, copyright });
  });
  return out;
}

export function loadFeed(): Promise<Map<string, FeedDay>> {
  return (cache ??= fetch(`${import.meta.env.BASE_URL}data/usccb/feed.xml`).then((r) => (r.ok ? r.text() : '')).then((t) => (t ? parseFeed(t) : new Map())).catch(() => new Map()));
}

export async function feedDay(date: string): Promise<FeedDay | null> {
  return (await loadFeed()).get(date) ?? null;
}
