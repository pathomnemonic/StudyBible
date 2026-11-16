// Mass-reading citations, as the published lists print them, must open the right verses in the anchor (Vulgate) numbering.
// The Lectionary cites the NABRE (Hebrew numbering). Before the fourth-cycle fix (docs/CYCLE4_LOG.md, section 5) they were read
// as English (KJV) numbers, and about one citation form in ten was refused outright, leaving the reading with no link.
import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('../src/db/db', () => ({ db: {} }));
vi.mock('../src/data/loader', () => ({ getJson: async () => null }));
vi.mock('../src/liturgy/litcal', () => ({ litDay: async () => [] }));
vi.mock('../src/lib/i18n', () => ({ tNow: (k: string) => k }));
import { loadVersification } from '../src/lib/versification';
import { parseRefs, refId, HEBREW_CHAPTERS } from '../src/lib/refs';
import { cleanCitation, toItem } from '../src/liturgy/readings';

beforeAll(() => loadVersification(JSON.parse(readFileSync('public/data/versification.json', 'utf8'))));
const ids = (text: string) => toItem('first_reading', text).refs.map(refId);

describe('Lectionary (Hebrew) numbering to the Vulgate anchor', () => {
  it.each([
    ['Isaiah 9:1-6', ['ISA.9.2-7'], 'Christmas, Mass during the Night: "The people who walked in darkness" to "the zeal of the Lord of hosts"'],
    ['Isaiah 8:23—9:3', ['ISA.9.1-4'], 'Third Sunday in Ordinary Time, Year A'],
    ['Malachi 3:19-20a', ['MAL.4.1-2'], '33rd Sunday, Year C (the Vulgate has no Malachi 3:19)'],
    ['Malachi 3:1-4, 23-24', ['MAL.3.1-4', 'MAL.4.5-6'], '23 December'],
    ['Joel 3:1-5', ['JOL.2.28-32'], 'Pentecost Vigil'],
    ['Joel 4:12-21', ['JOL.3.12-21'], 'a chapter the Vulgate does not have under that number'],
    ['Zechariah 2:14-17', ['ZEC.2.10-13'], ''],
    ['Numbers 17:16-26', ['NUM.17.1-11'], ''],
    ['Deuteronomy 13:1-5', ['DEU.12.32-13.4'], ''],
    ['1 Kings 5:9-14', ['1KI.4.29-34'], ''],
    ['Exodus 22:20-26', ['EXO.22.21-27'], '30th Sunday, Year A'],
    ['Genesis 32:23-33', ['GEN.32.22-32'], 'Jacob wrestles'],
    ['Job 40:25-32', ['JOB.40.20-27'], ''],
  ])('%s', (text, want) => {
    const item = toItem('first_reading', text);
    expect(item.refs.map(refId)).toEqual(want);
    expect(item.approximate).toBe(false);
  });
  it('New Testament and unshifted chapters are untouched', () => {
    expect(ids('John 1:1-18')).toEqual(['JHN.1.1-18']);
    expect(ids('Wisdom 18:6-9')).toEqual(['WIS.18.6-9']);
    expect(ids('Isaiah 52:7-10')).toEqual(['ISA.52.7-10']);
  });
});

describe('citation forms the published lists use', () => {
  it('cleanCitation', () => {
    expect(cleanCitation('Cf. Mark 9:7')).toBe('Mark 9:7');
    expect(cleanCitation('Psalm 1:1-2, 3, 4 and 6')).toBe('Psalm 1:1-2, 3, 4, 6');
    expect(cleanCitation('Psalm 138:1-2ab, 2cde-3, 7c-8')).toBe('Psalm 138:1-2, 2-3, 7-8');
    expect(cleanCitation('Psalm 71:8-9, 14-15AB, 16-17, 22')).toBe('Psalm 71:8-9, 14-15, 16-17, 22');
    expect(cleanCitation('Luke 2:22-40 or 2:22-32')).toBe('Luke 2:22-40');
    expect(cleanCitation('Psalm 128:1-2, 3, 4-5.')).toBe('Psalm 128:1-2, 3, 4-5');
    expect(cleanCitation('Isaiah 61:1 (cited in Luke 4:18)')).toBe('Isaiah 61:1');
    expect(cleanCitation('Psalm 1:1-2, 3, 4 & 6')).toBe('Psalm 1:1-2, 3, 4, 6');
  });
  it('a range that runs into the next chapter after a list ("…, 30–19:3", "…, 22—18:1")', () => {
    expect(ids('2 Samuel 18:9-10, 14b, 24-25a, 30–19:3').at(-1)).toMatch(/^2SA\.18\.30-19\.\d+$/);
    expect(ids('Acts 17:15, 22—18:1')).toEqual(['ACT.17.15', 'ACT.17.22-18.1']);
    // typed by a reader, the same form is still a chapter range when nothing came before it
    const p = parseRefs('Genesis 1-2:3'); expect(p.ok && refId(p.refs[0].ref)).toBe('GEN.1-2.3');
  });
  it('a responsorial psalm opens the one Vulgate psalm its verses are in', () => {
    expect(ids('Psalm 116:12-13, 15-16bc, 17-18')).toEqual(['PSA.115']);
    expect(ids('Psalm 116:1-2, 3-4, 5-6, 8-9')).toEqual(['PSA.114']);
    expect(ids('Psalm 147:12-13, 14-15, 19-20')).toEqual(['PSA.147']);
    expect(ids('Psalm 147:1-2, 3-4, 5-6')).toEqual(['PSA.146']);
    expect(ids('Psalm 23:1-3a, 3b-4, 5, 6')).toEqual(['PSA.22']);
    expect(ids('Psalm 51:3-4, 5-6ab, 12-13, 14 and 17')).toEqual(['PSA.50']);
    expect(toItem('responsorial_psalm', 'Psalm 23:1-6').approximate).toBe(true);
  });
  it('the lettered Greek additions to Esther open the matching Vulgate section, marked approximate', () => {
    const item = toItem('first_reading', 'Esther C:12, 14-16, 23-25');
    expect(item.refs.map(refId)).toEqual(['EST.14.1-19']);
    expect(item.approximate).toBe(true);
  });
  it('a misspelt book in the published list is read as the one book it can be; a made-up one is not', () => {
    expect(ids('Phippians 3:8-9')).toEqual(['PHP.3.8-9']);
    expect(ids('2 Ttimothy 1:10')).toEqual(['2TI.1.10']);
    expect(ids('Sirarch 5:1-8')).toEqual(['SIR.5.1-8']);
    expect(ids('Zzz 5:1-8')).toEqual([]);
  });
  it('Joel 4 is accepted only where the caller says the numbering is Hebrew', () => {
    expect(parseRefs('Joel 4:1').ok).toBe(false);
    expect(parseRefs('Joel 4:1', { chapters: HEBREW_CHAPTERS }).ok).toBe(true);
    expect(parseRefs('Joel 5:1', { chapters: HEBREW_CHAPTERS }).ok).toBe(false);
  });
});

describe('every reading in the shipped lists (2026 to 2028)', () => {
  it('has a link, apart from the known unreadable entries, and every link is a real place in the anchor', () => {
    const counts = JSON.parse(readFileSync('public/data/editions.json', 'utf8')).editions?.find?.((e: any) => e.id === 'vulgate')?.verseCounts as Record<string, number[]> | undefined;
    let total = 0; const none: string[] = []; const bad: string[] = [];
    for (const f of readdirSync('public/data/lectionary')) {
      const L = JSON.parse(readFileSync(`public/data/lectionary/${f}`, 'utf8'));
      for (const [date, day] of Object.entries<any>(L.days ?? {})) for (const [slot, text] of Object.entries<string>(day.r ?? {})) {
        total++;
        const item = toItem(slot as any, text);
        if (!item.refs.length) none.push(`${date} ${slot}: ${text}`);
        if (counts) for (const r of item.refs) {
          const cs = counts[r.book];
          if (!cs || r.c1 > cs.length || r.c2 > cs.length || (r.v1 !== undefined && r.v1 > cs[r.c1 - 1]) || (r.v2 !== undefined && r.v2 > cs[r.c2 - 1])) if (!item.approximate) bad.push(`${date} ${text} -> ${refId(r)}`);
        }
      }
    }
    expect(total).toBeGreaterThan(2000);
    // what is left: the list's own gaps (a stray `">` where the page had no citation) and two entries too garbled to read safely
    const real = none.filter((x) => !/: ">$/.test(x));
    expect(real.map((x) => x.replace(/^\S+ \S+: /, '')).sort()).toEqual(['Jonah 1:1–2:1-2, 11', 'Psalm 23: 1-3a, 3b4, 5, 6']);
    expect(bad).toEqual([]);
  });
});
