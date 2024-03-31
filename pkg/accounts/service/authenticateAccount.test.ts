import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { ID } from '../../id/type.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy.js';
import { Account } from '../model/account.js';
import { AuthenticateAccountService } from './authenticateAccount.js';
import { TokenGenerator } from './tokenGenerator.js';

describe('AuthenticationService', () => {
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

    const tokenGenerator = await TokenGenerator.new();

    const service = new AuthenticateAccountService({
      accountRepository: accountRepository,
      tokenGenerator: tokenGenerator,
      passwordEncoder: encoder,
    });

    const result = Result.unwrap(
      await service.handle('@test@example.com', 'じゃすた・いぐざんぽぅ'),
    );
    expect(await tokenGenerator.verify(result.authorizationToken)).toBe(true);
    expect(await tokenGenerator.verify(result.refreshToken)).toBe(true);
  });
});
