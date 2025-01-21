import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { MockClock } from '../../id/mod.js';
import { AuthenticationTokenService } from './authenticationTokenService.js';

describe('AuthenticationTokenService', () => {
  it('verify JWT Token', async () => {
    const service = await AuthenticationTokenService.new(
      new MockClock(new Date()),
    );
    const token = await service.generate('', '');
    if (Option.isNone(token)) {
      return;
    }

    expect(await service.verify(token[1])).toBe(true);
  });

  it('if token expired', async () => {
    const service = await AuthenticationTokenService.new(
      new MockClock(new Date('2022-01-01T00:00:00Z')),
    );
    const expired = await service.generate('', '');
    if (Option.isNone(expired)) return;

    expect(await service.verify(expired[1])).toBe(false);
  });
});
