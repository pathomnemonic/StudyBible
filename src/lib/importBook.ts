import { unzipSync, strFromU8 } from 'fflate';
import type { UserBook } from '../db/db';

type Sec = { title: string; paras: string[] };
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const words = (secs: Sec[]) => secs.reduce((n, s) => n + s.paras.join(' ').split(/\s+/).length, 0);

/** Merge very short sections into the one before, so a book of one-line pages does not become hundreds of tiny chapters. */
function tidy(secs: Sec[]): Sec[] {
  const out: Sec[] = [];
  for (const s of secs) {
    const len = s.paras.join(' ').length;
    if (!s.paras.length) continue;
    if (out.length && len < 500 && !/^(chapter|book|part|section|\d+|[ivxlc]+\b)/i.test(s.title)) out[out.length - 1].paras.push(...(s.title ? [s.title] : []), ...s.paras);
    else out.push({ title: s.title || `Part ${out.length + 1}`, paras: [...s.paras] });
  }
  return out;
}
/** Split a long run of paragraphs into sections of about 6,000 characters. */
function chunkParas(paras: string[], title = 'Part'): Sec[] {
  const out: Sec[] = [];
  let cur: string[] = [], n = 0;
  for (const p of paras) { cur.push(p); n += p.length; if (n > 6000) { out.push({ title: `${title} ${out.length + 1}`, paras: cur }); cur = []; n = 0; } }
  if (cur.length) out.push({ title: `${title} ${out.length + 1}`, paras: cur });
  return out;
}

export function fromText(text: string, name: string): { title: string; author: string; sections: Sec[] } {
  const lines = text.replace(/\r/g, '').split('\n');
  const secs: Sec[] = [];
  let cur: Sec | null = null;
  let para: string[] = [];
  const flush = () => { if (para.length) { (cur ??= { title: '', paras: [] }).paras.push(clean(para.join(' '))); para = []; } };
  for (const l of lines) {
    const h = /^(#{1,3})\s+(.+)$/.exec(l) ?? (/^(chapter|book|part)\s+[\w.]+[^\n]{0,60}$/i.test(l.trim()) ? [l, '#', l.trim()] : null);
    if (h) { flush(); if (cur) secs.push(cur); cur = { title: clean(String(h[2])), paras: [] }; }
    else if (!l.trim()) flush();
    else para.push(l.trim());
  }
  flush(); if (cur) secs.push(cur);
  const sections = secs.length > 1 ? tidy(secs) : chunkParas(secs[0]?.paras ?? [], 'Part');
  return { title: name, author: '', sections };
}

function blocks(root: Element): string[] {
  const out: string[] = [];
  root.querySelectorAll('p, li, blockquote, h4, h5, h6, pre').forEach((el) => { if (el.closest('nav')) return; if (el.tagName === 'LI' && el.querySelector('p')) return; if (el.tagName === 'BLOCKQUOTE' && el.querySelector('p')) return; const t = clean(el.textContent ?? ''); if (t) out.push(t); });
  return out;
}
export function fromHtml(html: string, name: string): { title: string; author: string; sections: Sec[] } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, nav').forEach((e) => e.remove());
  const title = clean(doc.querySelector('title')?.textContent ?? '') || name;
  const secs: Sec[] = [];
  let cur: Sec | null = null;
  doc.body.querySelectorAll('h1, h2, h3, p, li, blockquote').forEach((el) => {
    if (/^H[1-3]$/.test(el.tagName)) { if (cur) secs.push(cur); cur = { title: clean(el.textContent ?? ''), paras: [] }; return; }
    if ((el.tagName === 'LI' || el.tagName === 'BLOCKQUOTE') && el.querySelector('p')) return;
    const t = clean(el.textContent ?? ''); if (t) (cur ??= { title: '', paras: [] }).paras.push(t);
  });
  if (cur) secs.push(cur);
  return { title, author: clean(doc.querySelector('meta[name=author]')?.getAttribute('content') ?? ''), sections: secs.length > 1 ? tidy(secs) : chunkParas(secs[0]?.paras ?? [], 'Part') };
}

export async function fromEpub(buf: ArrayBuffer): Promise<{ title: string; author: string; sections: Sec[] }> {
  const zip = unzipSync(new Uint8Array(buf));
  const text = (p: string) => { const f = zip[p] ?? zip[decodeURIComponent(p)]; if (!f) throw new Error(`The book is missing ${p}.`); return strFromU8(f); };
  const xml = (p: string) => new DOMParser().parseFromString(text(p), 'application/xml');
  const container = xml('META-INF/container.xml');
  const opfPath = container.querySelector('rootfile')?.getAttribute('full-path');
  if (!opfPath) throw new Error('This does not look like an EPUB book.');
  const opf = xml(opfPath);
  const dir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const manifest = new Map<string, { href: string; type: string }>();
  opf.querySelectorAll('manifest > item').forEach((i) => manifest.set(i.getAttribute('id') ?? '', { href: i.getAttribute('href') ?? '', type: i.getAttribute('media-type') ?? '' }));
  const spine = [...opf.querySelectorAll('spine > itemref')].map((r) => manifest.get(r.getAttribute('idref') ?? '')).filter((x): x is { href: string; type: string } => !!x && /html|xml/.test(x.type));
  const title = clean(opf.getElementsByTagName('dc:title')[0]?.textContent ?? '') || 'Untitled';
  const author = clean(opf.getElementsByTagName('dc:creator')[0]?.textContent ?? '');
  const secs: Sec[] = [];
  for (const it of spine) {
    let html = '';
    try { html = text(dir + it.href.split('#')[0]); } catch { continue; }
    const doc = new DOMParser().parseFromString(html, 'application/xhtml+xml');
    const root = doc.querySelector('parsererror') ? new DOMParser().parseFromString(html, 'text/html').body : doc.querySelector('body');
    if (!root) continue;
    const heading = clean(root.querySelector('h1, h2, h3')?.textContent ?? '') || clean(doc.querySelector('title')?.textContent ?? '');
    const paras = blocks(root).filter((t) => t !== heading);
    if (paras.join('').length > 40) secs.push({ title: heading, paras });
  }
  if (!secs.length) throw new Error('No readable text was found in that book.');
  return { title, author, sections: tidy(secs) };
}

/** Read a book file from the reader's device into text sections. Supports EPUB, plain text, Markdown and HTML. */
export async function readBookFile(file: File): Promise<Omit<UserBook, 'id' | 'addedAt'>> {
  const base = file.name.replace(/\.[^.]+$/, '');
  const ext = (/\.([^.]+)$/.exec(file.name)?.[1] ?? '').toLowerCase();
  let r: { title: string; author: string; sections: Sec[] };
  if (ext === 'epub') r = await fromEpub(await file.arrayBuffer());
  else if (ext === 'html' || ext === 'htm' || ext === 'xhtml') r = fromHtml(await file.text(), base);
  else if (ext === 'txt' || ext === 'md' || ext === 'markdown' || ext === 'text' || file.type.startsWith('text/')) r = fromText(await file.text(), base);
  else if (ext === 'pdf') throw new Error('PDF files cannot be reflowed into a reading view. Export the book as EPUB or text and add that.');
  else throw new Error('Add an EPUB, text, Markdown or HTML file.');
  if (!r.sections.length) throw new Error('No readable text was found in that file.');
  return { title: r.title || base, author: r.author, format: ext || 'txt', sections: r.sections, words: words(r.sections) };
}
