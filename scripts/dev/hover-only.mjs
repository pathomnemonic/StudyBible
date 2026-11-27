import postcss from 'postcss';
import { readFileSync, writeFileSync } from 'node:fs';
const f = process.argv[2];
const root = postcss.parse(readFileSync(f, 'utf8'));
const inHover = (n) => { for (let a = n.parent; a && a.type !== 'root'; a = a.parent) if (a.type === 'atrule' && /hover:\s*hover/.test(a.params)) return true; return false; };
const wrap = postcss.atRule({ name: 'media', params: '(hover: hover)' });
let moved = 0;
root.walkRules((r) => {
  if (inHover(r) || r.parent?.type === 'atrule' && r.parent.name === 'keyframes') return;
  const sels = r.selectors;
  const h = sels.filter((s) => /:hover/.test(s)), rest = sels.filter((s) => !/:hover/.test(s));
  if (!h.length) return;
  const inner = r.clone({ selectors: h });
  // rebuild every at-rule around the rule (@media, @supports, @layer, @container, ...), outermost first,
  // so the moved rule keeps all its conditions; the (hover: hover) condition joins the innermost wrapper
  // (merged into its params when that wrapper is itself a @media)
  const chain = [];
  for (let a = r.parent; a && a.type !== 'root'; a = a.parent) if (a.type === 'atrule') chain.unshift(a);
  if (!chain.length) wrap.append(inner);
  else {
    let node = inner;
    for (let i = chain.length - 1; i >= 0; i--) {
      const a = chain[i];
      if (i === chain.length - 1 && a.name !== 'media') { const m = postcss.atRule({ name: 'media', params: '(hover: hover)' }); m.append(node); node = m; }
      const w = postcss.atRule({ name: a.name, params: i === chain.length - 1 && a.name === 'media' ? `${a.params} and (hover: hover)` : a.params });
      w.append(node); node = w;
    }
    root.append(node);
  }
  moved++;
  if (rest.length) r.selectors = rest; else r.remove();
});
root.append(wrap);
writeFileSync(f, root.toString());
console.log('moved', moved);
