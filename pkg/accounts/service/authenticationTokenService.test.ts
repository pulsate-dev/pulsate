import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { MockClock } from '../../id/mod.js';
import { convertTo } from '../../time/mod.js';
import { AuthenticationTokenService } from './authenticationTokenService.js';

const service = await AuthenticationTokenService.new(
  new MockClock(new Date('2022-01-01T00:00:00Z')),
);

describe('AuthenticationTokenService', () => {
  it('verify JWT Token', async () => {
    const token = await service.generate(
      '',
      convertTo(new Date()),
      convertTo(new Date('2099-12-31T12:59:59Z')),
      '',
    );
    if (Option.isNone(token)) {
      return;
    }

    expect(await service.verify(token[1])).toBe(true);
  });

  it('if token expired', async () => {
    const expired = await service.generate(
      '',
      convertTo(new Date('2022-01-01T00:00:00Z')),
      convertTo(new Date('2022-01-02T00:00:00Z')),
      '',
    );
    if (Option.isNone(expired)) return;

    expect(await service.verify(expired[1])).toBe(false);
  });
});
