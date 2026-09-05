import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import { notificationModule } from '../../intermodule/notification.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryInactiveAccountRepository } from '../adaptor/repository/dummy/inactiveAccount.ts';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.ts';
import type { AccountID } from '../model/account.ts';
import { AccountNotFoundError } from '../model/errors.ts';
import { InactiveAccount } from '../model/inactiveAccount.ts';
import { ResendVerifyTokenService } from './resendToken.ts';
import { VerifyAccountTokenService } from './verifyToken.ts';

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
  new SnowflakeIDGenerator(1, mockClock),
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
