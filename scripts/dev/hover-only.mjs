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
  // keep the same media condition when the rule sits inside one
  if (r.parent.type === 'atrule' && r.parent.name === 'media') {
    const m = postcss.atRule({ name: 'media', params: `${r.parent.params} and (hover: hover)` });
    m.append(inner); root.append(m);
  } else wrap.append(inner);
  moved++;
  if (rest.length) r.selectors = rest; else r.remove();
});
root.append(wrap);
writeFileSync(f, root.toString());
console.log('moved', moved);
