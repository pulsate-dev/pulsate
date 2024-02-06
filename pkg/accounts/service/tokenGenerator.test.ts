import { Option } from '@mikuroxina/mini-fn';
import { describe, it, expect } from 'vitest';

import { TokenGenerator } from './tokenGenerator.js';

const generator = await TokenGenerator.new();

describe('TokenGenerator', () => {
  it('verify JWT Token', async () => {
    const token = await generator.generate(
      '',
      new Date(),
      new Date('2099/12/31 12:59:59'),
    );
    if (Option.isNone(token)) {
      return;
    }

    expect(await generator.verify(token[1])).toBe(true);
  });

  it('if token expired', async () => {
    const expired = await generator.generate(
      '',
      new Date('1970/01/01'),
      new Date('1971/01/01'),
    );
    if (Option.isNone(expired)) return;

    expect(await generator.verify(expired[1])).toBe(false);
  });
});
