import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DATA, RAW, Report, exists, readJson, today, writeJson, REGISTRY } from './lib/util';

/**
 * Original-language data: Greek NT (SBLGNT + MorphGNT) and Hebrew Bible (OSHB/WLC) word by word, plus Strong's dictionaries.
 * Output (all lazy-loaded by the app):
 *   original/grc/<BOOK>.json   chapters → verses → words [text, strongs, parse, lemmaIfNoStrongs?]
 *   original/hbo/<BOOK>.json   Hebrew numbering; words [text, mainStrongs, morph]
 *   original/lex-grc.json, lex-hbo.json   Strong's entries: [lemma, translit, gloss, kjvUsage, derivation]
 */
const GRC_FILES: Record<string, string> = { Mt: 'MAT', Mk: 'MRK', Lk: 'LUK', Jn: 'JHN', Ac: 'ACT', Ro: 'ROM', '1Co': '1CO', '2Co': '2CO', Ga: 'GAL', Eph: 'EPH', Php: 'PHP', Col: 'COL', '1Th': '1TH', '2Th': '2TH', '1Ti': '1TI', '2Ti': '2TI', Tit: 'TIT', Phm: 'PHM', Heb: 'HEB', Jas: 'JAS', '1Pe': '1PE', '2Pe': '2PE', '1Jn': '1JN', '2Jn': '2JN', '3Jn': '3JN', Jud: 'JUD', Re: 'REV' };
const HBO_FILES: Record<string, string> = { Gen: 'GEN', Exod: 'EXO', Lev: 'LEV', Num: 'NUM', Deut: 'DEU', Josh: 'JOS', Judg: 'JDG', Ruth: 'RUT', '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI', '1Chr': '1CH', '2Chr': '2CH', Ezra: 'EZR', Neh: 'NEH', Esth: 'EST', Job: 'JOB', Ps: 'PSA', Prov: 'PRO', Eccl: 'ECC', Song: 'SNG', Isa: 'ISA', Jer: 'JER', Lam: 'LAM', Ezek: 'EZK', Dan: 'DAN', Hos: 'HOS', Joel: 'JOL', Amos: 'AMO', Obad: 'OBA', Jonah: 'JON', Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zeph: 'ZEP', Hag: 'HAG', Zech: 'ZEC', Mal: 'MAL' };

const nfc = (s: string) => s.normalize('NFC').toLowerCase();
const dictFrom = (file: string) => {
  const t = readFileSync(file, 'utf8');
  const a = t.indexOf('{', t.indexOf('= '));
  const b = t.lastIndexOf('}');
  return JSON.parse(t.slice(a, b + 1)) as Record<string, any>;
};
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");

export function buildOriginal(report: Report) {
  const base = join(RAW, 'repos');
  if (!exists(join(base, 'strongs')) || !exists(join(base, 'sblgnt')) || !exists(join(base, 'morphhb'))) {
    report.warn('original: repositories not cloned (run npm run data:fetch); skipping original-language data');
    return;
  }
  const out = join(PUBLIC_DATA, 'original');
  const gDict = dictFrom(join(base, 'strongs/greek/strongs-greek-dictionary.js'));
  const hDict = dictFrom(join(base, 'strongs/hebrew/strongs-hebrew-dictionary.js'));
  const byLemma = new Map<string, string>();
  for (const [k, v] of Object.entries(gDict)) if (v.lemma && !byLemma.has(nfc(v.lemma))) byLemma.set(nfc(v.lemma), k.replace(/^G/, ''));
  const trim = (s: string | undefined) => (s ?? '').trim();
  writeJson(join(out, 'lex-grc.json'), Object.fromEntries(Object.entries(gDict).map(([k, v]) => [k.replace(/^G/, ''), [v.lemma, v.translit, trim(v.strongs_def), trim(v.kjv_def), trim(v.derivation)]])));
  writeJson(join(out, 'lex-hbo.json'), Object.fromEntries(Object.entries(hDict).map(([k, v]) => [k.replace(/^H/, ''), [v.lemma, v.xlit, trim(v.strongs_def), trim(v.kjv_def), trim(v.derivation)]])));

  // Greek
  let gWords = 0;
  let gMatched = 0;
  for (const f of readdirSync(join(base, 'sblgnt')).filter((x) => /^\d\d-.+-morphgnt\.txt$/.test(x))) {
    const code = /^\d\d-(.+)-morphgnt\.txt$/.exec(f)![1];
    const book = GRC_FILES[code];
    if (!book) continue;
    const chapters: string[][][][] = [];
    for (const line of readFileSync(join(base, 'sblgnt', f), 'utf8').split('\n')) {
      const p = line.split(' ');
      if (p.length < 7) continue;
      const ch = +p[0].slice(2, 4);
      const v = +p[0].slice(4, 6);
      const lemma = p[6];
      const sn = byLemma.get(nfc(lemma));
      gWords++;
      if (sn) gMatched++;
      const w = sn ? [p[3], sn, p[1] + p[2]] : [p[3], '', p[1] + p[2], lemma];
      ((chapters[ch - 1] ??= [])[v - 1] ??= []).push(w as any);
    }
    writeJson(join(out, 'grc', `${book}.json`), chapters.map((c) => (c ?? []).map((v) => v ?? [])));
  }

  // Hebrew
  let hWords = 0;
  for (const [file, book] of Object.entries(HBO_FILES)) {
    const path = join(base, 'morphhb/wlc', `${file}.xml`);
    if (!exists(path)) {
      report.warn(`original: missing ${path}`);
      continue;
    }
    const xml = readFileSync(path, 'utf8');
    const chapters: any[][][] = [];
    for (const m of xml.matchAll(/<verse osisID="[^.]+\.(\d+)\.(\d+)">([\s\S]*?)<\/verse>/g)) {
      const ch = +m[1];
      const v = +m[2];
      const words: any[] = [];
      for (const w of m[3].matchAll(/<w lemma="([^"]*)"(?: n="[^"]*")? morph="([^"]*)"[^>]*>([^<]*)<\/w>/g)) {
        const nums = [...w[1].matchAll(/(\d+)/g)].map((x) => x[1]);
        const main = nums[nums.length - 1] ?? '';
        words.push([decode(w[3]).replace(/\//g, ''), main, w[2].replace(/^H/, '')]);
        hWords++;
      }
      ((chapters[ch - 1] ??= [])[v - 1] ??= []).push(...words);
    }
    writeJson(join(out, 'hbo', `${book}.json`), chapters.map((c) => (c ?? []).map((v) => v ?? [])));
  }
  const repos = readJson(join(REGISTRY, 'original-sources.json')).repos;
  writeJson(join(out, 'sources.json'), { generated: today(), repos: repos.map((r: any) => ({ id: r.id, url: r.url, use: r.use, rights: r.rights, attribution: r.attribution })) }, true);
  report.stats['original'] = { greekWords: gWords, greekLemmaMatchedToStrongs: gMatched, hebrewWords: hWords };
}
