import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { MockClock } from '../../id/mod.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { Account, type AccountID } from '../model/account.js';
import { AuthenticateService } from './authenticate.js';
import { AuthenticationTokenService } from './authenticationTokenService.js';

describe('AuthenticateService', () => {
  it('Generate valid token', async () => {
    const encoder = new Argon2idPasswordEncoder();
    const passphraseHash = await encoder.encodePassword(
      'じゃすた・いぐざんぽぅ',
    );

    const accountRepository = new InMemoryAccountRepository();
    await accountRepository.create(
      Account.reconstruct({
        id: '1' as AccountID,
        name: '@test@example.com',
        mail: 'test@example.com',
        bio: '',
        frozen: 'normal',
        nickname: 'test',
        passphraseHash: passphraseHash,
        role: 'normal',
        silenced: 'normal',
        status: 'active',
        createdAt: new Date(),
        updatedAt: undefined,
        deletedAt: undefined,
      }),
    );

    const authenticationTokenService = await AuthenticationTokenService.new(
      new MockClock(new Date()),
    );

    const service = new AuthenticateService({
      accountRepository: accountRepository,
      authenticationTokenService: authenticationTokenService,
      passwordEncoder: encoder,
    });

    const result = Result.unwrap(
      await service.handle('@test@example.com', 'じゃすた・いぐざんぽぅ'),
    );
    expect(Result.isOk(await authenticationTokenService.verify(result))).toBe(
      true,
    );
  });
});
