import { describe, expect, it } from 'vitest';
import { modernRefs } from '../src/lib/modernRefs';

describe('modernRefs', () => {
  it('turns Roman-numeral citations into modern ones', () => {
    expect(modernRefs('See Matt. xvi. 18 and chap. xiv.')).toBe('See Matt. 16:18 and chap. 14.');
    expect(modernRefs('Ps. cxviii. 105')).toBe('Ps. 118:105');
    expect(modernRefs('1 Cor. xv. 22')).toBe('1 Cor. 15:22');
    expect(modernRefs('Aug. lib. ii. cap. xiv. and hom. lxxxv.')).toBe('Aug. lib. 2. cap. 14. and hom. 85.');
  });
  it('leaves ordinary prose alone', () => {
    expect(modernRefs('This is civil. It is mixed.')).toBe('This is civil. It is mixed.');
  });
});
