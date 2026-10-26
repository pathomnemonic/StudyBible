import { BRAND } from '../lib/brand';
import { zipSync, strToU8 } from 'fflate';
import { db, type Note } from './db';
import { parseRefId } from '../lib/refs';
import { BOOKS } from '../lib/canon';
import { renderMarkdown } from '../lib/markdown';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function where(n: Note): string {
  return n.targets
    .map((t) => {
      if (t.type === 'passage') {
        const r = parseRefId(t.ref);
        if (!r) return t.ref;
        const b = BOOKS.find((x) => x.id === r.book)?.name ?? r.book;
        return `${b} ${r.c1}${r.v1 ? ':' + r.v1 : ''}${r.c2 !== r.c1 || (r.v2 && r.v2 !== r.v1) ? '–' + (r.c2 !== r.c1 ? r.c2 + ':' : '') + (r.v2 ?? '') : ''}`;
      }
      return 'label' in t && t.label ? t.label : t.type;
    })
    .join('; ');
}

async function loadNotes() {
  return (await db.notes.orderBy('updatedAt').reverse().toArray()) as Note[];
}

/** One self-contained, printable HTML document of all notes (also what "Save as PDF" prints). */
export async function notesHtml(): Promise<string> {
  const notes = await loadNotes();
  const body = notes
    .map((n) => `<section><h2>${esc(n.title || where(n) || 'Note')}</h2>${where(n) ? `<p class="where">${esc(where(n))}</p>` : ''}${n.tags.length ? `<p class="tags">${n.tags.map((t) => '#' + esc(t)).join(' ')}</p>` : ''}${renderMarkdown(n.body)}</section>`)
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>My ${BRAND.name} notes</title><style>body{font:12pt/1.55 Georgia,serif;max-width:40em;margin:2em auto;padding:0 1em;color:#111}h1{font-size:22pt}h2{font-size:15pt;margin:1.4em 0 .2em;page-break-after:avoid}.where{font-style:italic;color:#444;margin:0}.tags{color:#666;font-size:10pt}section{page-break-inside:avoid;border-bottom:1px solid #ccc;padding-bottom:.8em}blockquote{border-left:3px solid #999;margin-left:0;padding-left:1em;color:#333}</style></head><body><h1>My ${BRAND.name} notes</h1><p>Exported ${new Date().toISOString().slice(0, 10)} · ${notes.length} notes</p>${body}</body></html>`;
}

/** Opens the print dialog on the notes; choose “Save as PDF” there. Returns false if the browser blocked the window. */
export async function printNotes(): Promise<boolean> {
  const html = await notesHtml();
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}

const xhtml = (html: string) => {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  return new XMLSerializer().serializeToString(doc.body.firstElementChild!).replace(/ xmlns="[^"]*"/, '');
};

/** A valid EPUB 3 file: one chapter per note, with a contents page. */
export async function notesEpub(): Promise<Uint8Array> {
  const notes = await loadNotes();
  const id = `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
  const chap = (n: Note, i: number) => ({
    file: `n${i + 1}.xhtml`,
    title: n.title || where(n) || `Note ${i + 1}`,
    xml: `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><head><meta charset="utf-8"/><title>${esc(n.title || where(n) || 'Note')}</title><link rel="stylesheet" href="style.css"/></head><body><h1>${esc(n.title || where(n) || 'Note')}</h1>${where(n) ? `<p class="where"><em>${esc(where(n))}</em></p>` : ''}${xhtml(renderMarkdown(n.body))}</body></html>`,
  });
  const chapters = notes.map(chap);
  const nav = `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><meta charset="utf-8"/><title>Contents</title></head><body><nav epub:type="toc" id="toc"><h1>My ${BRAND.name} notes</h1><ol>${chapters.map((c) => `<li><a href="${c.file}">${esc(c.title)}</a></li>`).join('')}</ol></nav></body></html>`;
  const opf = `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">${id}</dc:identifier><dc:title>My ${BRAND.name} notes</dc:title><dc:language>en</dc:language><dc:creator>${BRAND.name} reader</dc:creator><meta property="dcterms:modified">${new Date().toISOString().slice(0, 19)}Z</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="style.css" media-type="text/css"/>${chapters.map((c, i) => `<item id="c${i}" href="${c.file}" media-type="application/xhtml+xml"/>`).join('')}</manifest><spine>${chapters.map((_, i) => `<itemref idref="c${i}"/>`).join('')}</spine></package>`;
  const files: Record<string, Uint8Array | [Uint8Array, { level: 0 | 6 }]> = {
    mimetype: [strToU8('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': strToU8('<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'),
    'OEBPS/content.opf': strToU8(opf),
    'OEBPS/nav.xhtml': strToU8(nav),
    'OEBPS/style.css': strToU8('body{font-family:serif;line-height:1.5}.where{color:#555}blockquote{border-left:3px solid #999;margin-left:0;padding-left:1em}'),
  };
  for (const c of chapters) files[`OEBPS/${c.file}`] = strToU8(c.xml);
  return zipSync(files as any);
}

const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'untitled';
const yaml = (v: string) => JSON.stringify(v);

/**
 * A study vault: every note and journal entry as its own Markdown file (with front matter), plus `index.json` that lists
 * everything and the highlights and bookmarks. It opens in Obsidian, or any editor, and the format is documented in docs/DATA_API.md.
 */
export async function studyVault(): Promise<Uint8Array> {
  const notes = await loadNotes();
  const journal = await db.journal.toArray();
  const files: Record<string, Uint8Array> = {};
  const index: any = { format: 'studybible-vault', version: 1, exportedAt: new Date().toISOString(), notes: [], journal: [], highlights: [], bookmarks: [] };
  const used = new Set<string>();
  const name = (dir: string, base: string, stamp: number) => { let n = `${dir}/${new Date(stamp).toISOString().slice(0, 10)}-${slug(base)}`; let k = 2; while (used.has(n)) n = `${dir}/${new Date(stamp).toISOString().slice(0, 10)}-${slug(base)}-${k++}`; used.add(n); return `${n}.md`; };
  for (const n of notes) {
    const path = name(n.kind === 'question' ? 'questions' : 'notes', n.title || n.body.slice(0, 40), n.createdAt);
    const fm = ['---', `title: ${yaml(n.title ?? '')}`, `kind: ${n.kind}`, `passages: [${n.targets.filter((t) => t.type === 'passage').map((t) => yaml((t as any).ref)).join(', ')}]`, `where: ${yaml(where(n))}`, `tags: [${n.tags.map(yaml).join(', ')}]`, `created: ${new Date(n.createdAt).toISOString()}`, `updated: ${new Date(n.updatedAt).toISOString()}`, `uid: ${yaml(n.uid ?? '')}`, '---', ''].join('\n');
    files[path] = strToU8(`${fm}\n${n.body}\n`);
    index.notes.push({ path, uid: n.uid, title: n.title ?? null, kind: n.kind, tags: n.tags, targets: n.targets, created: n.createdAt, updated: n.updatedAt });
  }
  for (const j of journal) {
    const path = name('journal', j.title || j.kind, j.createdAt);
    files[path] = strToU8(`---\ntitle: ${yaml(j.title ?? '')}\nkind: ${j.kind}\ndate: ${j.date}\nrefs: [${(j.refs ?? []).map(yaml).join(', ')}]\n---\n\n${j.body}\n`);
    index.journal.push({ path, kind: j.kind, date: j.date, refs: j.refs ?? [] });
  }
  index.highlights = (await db.highlights.toArray()).map((h) => ({ ref: h.ref, color: h.color, created: h.createdAt }));
  index.bookmarks = (await db.bookmarks.toArray()).map((b) => ({ ref: b.ref, kind: b.kind, created: b.createdAt }));
  files['index.json'] = strToU8(JSON.stringify(index, null, 1));
  files['README.md'] = strToU8(`# ${BRAND.name} vault\n\nNotes and journal entries are Markdown files with front matter. \`index.json\` lists everything, with passages as stable Vulgate-anchored ids such as \`JHN.6.51\`. Re-import the JSON backup from Library → Export and backup to restore into the app.\n`);
  return zipSync(files);
}
