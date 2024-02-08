import { Option } from '@mikuroxina/mini-fn';
import { describe, it, expect } from 'vitest';

import { calculateDiffFromEpoch } from '../../time/mod.js';
import { TokenGenerator } from './tokenGenerator.js';

const generator = await TokenGenerator.new();

describe('TokenGenerator', () => {
  it('verify JWT Token', async () => {
    const token = await generator.generate(
      '',
      calculateDiffFromEpoch(new Date()),
      calculateDiffFromEpoch(new Date('2099-12-31T12:59:59Z')),
    );
    if (Option.isNone(token)) {
      return;
    }

    expect(await generator.verify(token[1])).toBe(true);
  });

  it('if token expired', async () => {
    const expired = await generator.generate(
      '',
      calculateDiffFromEpoch(new Date('2022-01-01T00:00:00Z')),
      calculateDiffFromEpoch(new Date('2022-01-02T00:00:00Z')),
    );
    if (Option.isNone(expired)) return;

    expect(await generator.verify(expired[1])).toBe(false);
  });
});
