import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderFeatureStatus } from '../scripts/docs-status';

describe('generated documents', () => {
  it('docs/FEATURE_STATUS.md matches src/featureStatus.ts (run npm run docs:status and commit the result)', () => {
    expect(readFileSync('docs/FEATURE_STATUS.md', 'utf8')).toBe(renderFeatureStatus());
  });
});
