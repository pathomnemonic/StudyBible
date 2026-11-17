import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { LONG_TAIL_PORTED } from '../src/data/deepWatersLongTailPorted';
import { deepTokens } from '../src/lib/deepWatersTokens';
import { matchDeepAnswer } from '../src/lib/deepWaters';

const P = (id: string) => DEEP_WATERS.find((p) => p.id === `ported-${id}`)!;
const status = (id: string, g: string) => matchDeepAnswer(P(id), g).status;
const ACCEPT: Record<string, string[]> = {
  'english-martyrs': ['thomas more', 'john fisher', 'edmund campion', 'margaret clitherow', 'robert southwell'],
  'augustine-works': ['confessions', 'city of god', 'on the trinity', 'enchiridion', 'soliloquies'],
  'aquinas-works': ['summa theologiae', 'summa contra gentiles', 'catena aurea', 'on being and essence', 'pange lingua'],
  'fathers-works': ['against heresies', 'on the incarnation', 'life of antony', 'didache', 'dialogue with trypho'],
  'patron-professions': ['joseph', 'luke', 'cecilia', 'francis of assisi', 'isidore the farmer'],
  'ancient-sees': ['rome', 'jerusalem', 'antioch', 'alexandria', 'constantinople', 'carthage', 'ephesus'],
  'late-medieval-theologians': ['anselm of canterbury', 'bernard of clairvaux', 'peter abelard', 'hildegard of bingen'],
  'martyrdom-texts': ['martyrdom of polycarp', 'passion of perpetua and felicity', 'acts of the scillitan martyrs'],
  'francis-canonizations': ['john paul ii', 'teresa of calcutta', 'oscar romero', 'carlo acutis', 'john henry newman', 'padre pio'],
};
const REJECT: Record<string, string[]> = {
  'english-martyrs': ['francis of assisi'],
  'augustine-works': ['summa theologiae'],
  'aquinas-works': ['confessions'],
  'ancient-sees': ['london', 'paris'],
  'francis-canonizations': ['alvaro del portillo', 'francis of assisi', 'john xxiii'],
};

describe('the part of ChatGPT\'s long-tail batch that was kept', () => {
  it('are open, 60 answers or more, six tiers, with a basis naming the source', () => {
    expect(LONG_TAIL_PORTED.length).toBe(9);
    for (const p of LONG_TAIL_PORTED) {
      expect(DEEP_WATERS, p.id).toContain(p);
      expect(p.closed, p.id).toBeUndefined();
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(60);
      expect(new Set(p.answers.map((a) => a.tier)).size, p.id).toBeGreaterThanOrEqual(5);
      expect(p.basis ?? '', p.id).toMatch(/https?:\/\//);
      expect(`${p.prompt} ${p.context}`, p.id).not.toMatch(/\b(above|below)\b/i);
      expect(Object.keys(p).sort(), p.id).not.toContain('commonGuesses');
    }
  });
  it('have no two answers the matcher reads as the same name', () => {
    for (const p of LONG_TAIL_PORTED) {
      const seen = new Map<string, string>();
      for (const a of p.answers) {
        const k = deepTokens(a.answer).join(' ');
        expect(seen.has(k), `${p.id}: "${a.answer}" duplicates "${seen.get(k)}"`).toBe(false);
        seen.set(k, a.answer);
      }
    }
  });
  it('accept what a player would type and reject what is out of scope', () => {
    for (const [id, gs] of Object.entries(ACCEPT)) for (const g of gs) expect(['match', 'ambiguous'], `${id}: ${g}`).toContain(status(id, g));
    for (const [id, gs] of Object.entries(REJECT)) for (const g of gs) expect(status(id, g), `${id}: ${g}`).not.toBe('match');
  });
});
