import { useEffect } from 'react';

/** US spellings of the app's own words and their British forms. The app is written in US English; this only changes what is shown. */
const PAIRS: [string, string][] = [
  ['color', 'colour'], ['colors', 'colours'], ['colored', 'coloured'], ['favorite', 'favourite'], ['favorites', 'favourites'],
  ['program', 'programme'], ['programs', 'programmes'], ['license', 'licence'], ['licenses', 'licences'],
  ['honor', 'honour'], ['neighbor', 'neighbour'], ['neighbors', 'neighbours'], ['center', 'centre'], ['centered', 'centred'],
  ['catalog', 'catalogue'], ['judgment', 'judgement'], ['fulfill', 'fulfil'], ['summarized', 'summarised'], ['practice', 'practise'],
  ['memorize', 'memorise'], ['memorizing', 'memorising'], ['authorized', 'authorised'], ['organize', 'organise'], ['recognize', 'recognise'],
  ['unrecognized', 'unrecognised'], ['behavior', 'behaviour'], ['defense', 'defence'], ['gray', 'grey'], ['analyze', 'analyse'],
  ['customize', 'customise'], ['personalize', 'personalise'], ['apologize', 'apologise'], ['realize', 'realise'], ['labeled', 'labelled'],
  ['canceled', 'cancelled'], ['traveling', 'travelling'], ['theater', 'theatre'], ['meter', 'metre'], ['dialog', 'dialogue'],
];
const RE = new RegExp(`\\b(${PAIRS.map((p) => p[0]).sort((a, b) => b.length - a.length).join('|')})\\b`, 'gi');
const MAP = new Map(PAIRS);
const convert = (t: string) => t.replace(RE, (m) => {
  const to = MAP.get(m.toLowerCase());
  if (!to) return m;
  return m === m.toUpperCase() && m.length > 1 ? to.toUpperCase() : m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to;
});
const SKIP = 'script,style,textarea,input,.scripture,.work-text,.verse,[data-keep-spelling]';
const original = new WeakMap<Text, string>();

function walk(root: Node, on: boolean) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let nd = w.nextNode(); nd; nd = w.nextNode()) {
    const n = nd as Text;
    const el = n.parentElement;
    if (!el || el.closest(SKIP)) continue;
    if (on) {
      const next = convert(n.data);
      if (next !== n.data) { if (!original.has(n)) original.set(n, n.data); n.data = next; }
    } else if (original.has(n)) { n.data = original.get(n)!; original.delete(n); }
  }
}

/** Show British spellings when asked; US English otherwise. Quoted texts (Scripture, the library) are never changed. */
export function useSpelling(mode: 'us' | 'uk') {
  useEffect(() => {
    document.documentElement.lang = mode === 'uk' ? 'en-GB' : document.documentElement.lang;
    if (mode !== 'uk') { walk(document.body, false); return; }
    walk(document.body, true);
    let busy = false;
    const mo = new MutationObserver((recs) => {
      if (busy) return;
      busy = true;
      for (const r of recs) {
        if (r.type === 'characterData') walk(r.target.parentNode ?? document.body, true);
        r.addedNodes.forEach((n) => walk(n, true));
      }
      busy = false;
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { mo.disconnect(); walk(document.body, false); };
  }, [mode]);
}
