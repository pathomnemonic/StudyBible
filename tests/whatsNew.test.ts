import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FEATURES } from '../src/lib/features';
import { NEW_ITEMS } from '../src/lib/whatsNew';

const app = readFileSync(join(__dirname, '../src/App.tsx'), 'utf8');
const routes = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
const matches = (pattern: string, path: string) => new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$').test(path);

describe("What's new links are real", () => {
  for (const i of NEW_ITEMS) {
    const f = i.id ? FEATURES.find((x) => x.id === i.id) : undefined;
    const to = (f?.to ?? i.to ?? '').split('?')[0];
    it(`${i.id ?? i.to} has a feature and a route`, () => {
      if (i.id) expect(f, `feature ${i.id}`).toBeTruthy();
      expect(routes.some((r) => matches(r, to)), `route for ${to}`).toBe(true);
    });
  }
});
