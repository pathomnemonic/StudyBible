import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { es } from '../src/i18n/es';
import { la } from '../src/i18n/la';
import { fr } from '../src/i18n/fr';
import { pt } from '../src/i18n/pt';
import { it as itl } from '../src/i18n/it';

describe('interface translations', () => {
  const keys = Object.keys(en);
  for (const [name, d] of [['Spanish', es], ['Latin', la], ['French', fr], ['Portuguese', pt], ['Italian', itl]] as const) {
    it(`${name} has every English key`, () => {
      const missing = keys.filter((k) => !(k in (d as Record<string, string>)));
      expect(missing, `missing in ${name}: ${missing.slice(0, 12).join(', ')}`).toEqual([]);
    });
  }
});
