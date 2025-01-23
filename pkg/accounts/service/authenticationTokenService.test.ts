import { Option, Result } from '@mikuroxina/mini-fn';
import * as jose from 'jose';
import { describe, expect, it } from 'vitest';

import { MockClock } from '../../id/mod.js';
import { AuthenticationTokenService } from './authenticationTokenService.js';

class Clock {
  now() {
    return BigInt(Date.now());
  }
}

describe('AuthenticationTokenService', () => {
  it('verify JWT Token', async () => {
    const service = await AuthenticationTokenService.new(
      new MockClock(new Date()),
    );
    const token = await service.generate('', '');
    if (Option.isNone(token)) {
      return;
    }

    expect(Result.isOk(await service.verify(token[1]))).toBe(true);
  });

  it('if token expired', async () => {
    const service = await AuthenticationTokenService.new(
      new MockClock(new Date('2022-01-01T00:00:00Z')),
    );
    const expired = await service.generate('', '');

    expect(Result.isOk(await service.verify(Option.unwrap(expired)))).toBe(
      false,
    );
  });

  it('renew: if token is valid, it should return a new token', async () => {
    // NOTE: mockClock returns only *static* time, this test using a normal clock
    const service = await AuthenticationTokenService.new(new Clock());
    const token = await service.generate('314', '628');

    const { refreshToken: oldRefreshToken, ...oldPayload } = jose.decodeJwt(
      Option.unwrap(token),
    );

    await (async (ms) => new Promise((resolve) => setTimeout(resolve, ms)))(
      1000,
    );

    const renewed = await service.renewAuthToken(Option.unwrap(token));
    try {
      const { refreshToken: newRefreshToken, ...newPayload } = jose.decodeJwt(
        Result.unwrap(renewed),
      );

      // renewed token must be valid token
      expect(Result.isOk(await service.verify(Result.unwrap(renewed)))).toBe(
        true,
      );

      expect(oldPayload).not.toStrictEqual(newPayload);
      expect(oldRefreshToken).toStrictEqual(newRefreshToken);
    } catch (e) {
      expect(e).toBe(null);
    }
  });

  it('renew: if authToken is expired, it should return error', async () => {
    const service = await AuthenticationTokenService.new(
      new MockClock(new Date('2022-01-01T00:00:00Z')),
    );
    const expired = await service.generate('314', '628');

    const result = await service.renewAuthToken(Option.unwrap(expired));
    expect(Result.isErr(result)).toBe(true);
  });
});
