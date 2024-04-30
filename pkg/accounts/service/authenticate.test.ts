import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { InMemoryAccountRepository } from '~/accounts/adaptor/repository/dummy.js';
import { Account } from '~/accounts/model/account.js';
import type { ID } from '~/id/type.js';
import { Argon2idPasswordEncoder } from '~/password/mod.js';

import { AuthenticateService } from './authenticate.js';
import { AuthenticationTokenService } from './authenticationTokenService.js';

describe('AuthenticateService', () => {
  it('Generate valid token pair', async () => {
    const encoder = new Argon2idPasswordEncoder();
    const passphraseHash =
      await encoder.encodePassword('じゃすた・いぐざんぽぅ');

    const accountRepository = new InMemoryAccountRepository();
    await accountRepository.create(
      Account.reconstruct({
        id: '1' as ID<'Account'>,
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

    const authenticationTokenService = await AuthenticationTokenService.new();

    const service = new AuthenticateService({
      accountRepository: accountRepository,
      authenticationTokenService: authenticationTokenService,
      passwordEncoder: encoder,
    });

    const result = Result.unwrap(
      await service.handle('@test@example.com', 'じゃすた・いぐざんぽぅ'),
    );
    expect(
      await authenticationTokenService.verify(result.authorizationToken),
    ).toBe(true);
    expect(await authenticationTokenService.verify(result.refreshToken)).toBe(
      true,
    );
  });
});
