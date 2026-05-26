import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import { notificationModule } from '../../intermodule/notification.js';
import { MockClock } from '../../internal/id/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryInactiveAccountRepository } from '../adaptor/repository/dummy/inactiveAccount.js';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.js';
import type { AccountID } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import { InactiveAccount } from '../model/inactiveAccount.js';
import { ResendVerifyTokenService } from './resendToken.js';
import { VerifyAccountTokenService } from './verifyToken.js';

const inactiveAccountRepository = new InMemoryInactiveAccountRepository();
await inactiveAccountRepository.create(
  InactiveAccount.reconstruct({
    id: '1' as AccountID,
    name: '@john@example.com',
    mail: 'johndoe@example.com',
    passphraseHash: 'hash',
    role: 'normal',
  }),
);

const verifyRepository = new InMemoryAccountVerifyTokenRepository();
const accountRepository = new InMemoryAccountRepository();
const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));

const verifyAccountTokenService = new VerifyAccountTokenService(
  verifyRepository,
  inactiveAccountRepository,
  accountRepository,
  mockClock,
);

describe('ResendVerifyTokenService', () => {
  afterEach(() => inactiveAccountRepository.reset());

  it('resend verify token', async () => {
    await inactiveAccountRepository.create(
      InactiveAccount.reconstruct({
        id: '1' as AccountID,
        name: '@john@example.com',
        mail: 'johndoe@example.com',
        passphraseHash: 'hash',
        role: 'normal',
      }),
    );
    const service = new ResendVerifyTokenService(
      inactiveAccountRepository,
      verifyAccountTokenService,
      notificationModule,
    );
    const actual = await service.handle('@john@example.com');
    expect(Option.isNone(actual)).toBe(true);
  });

  it('when account not found', async () => {
    const service = new ResendVerifyTokenService(
      inactiveAccountRepository,
      verifyAccountTokenService,
      notificationModule,
    );
    const actual = await service.handle('@a@example.com');

    expect(Option.isSome(actual)).toBe(true);
    if (Option.isNone(actual)) return;
    expect(actual[1]).toStrictEqual(
      new AccountNotFoundError('account not found', { cause: null }),
    );
  });
});
