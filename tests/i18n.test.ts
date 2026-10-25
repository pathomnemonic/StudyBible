import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';
import { la } from '../src/i18n/la';

describe('interface translations', () => {
  const keys = Object.keys(en);
  for (const [name, d] of [['Spanish', es], ['Latin', la]] as const) {
    it(`${name} has every English key`, () => {
      const missing = keys.filter((k) => !(k in (d as Record<string, string>)));
      expect(missing, `missing in ${name}: ${missing.slice(0, 12).join(', ')}`).toEqual([]);
    });
  }
});
