import { Option } from '@mikuroxina/mini-fn';
import { describe, it, expect } from 'vitest';
import { convertTo } from '~/time/mod.js';

import { AuthenticationTokenService } from './authenticationTokenService.js';

const service = await AuthenticationTokenService.new();

describe('AuthenticationTokenService', () => {
  it('verify JWT Token', async () => {
    const token = await service.generate(
      '',
      convertTo(new Date()),
      convertTo(new Date('2099-12-31T12:59:59Z')),
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
    );
    if (Option.isNone(expired)) return;

    expect(await service.verify(expired[1])).toBe(false);
  });
});
