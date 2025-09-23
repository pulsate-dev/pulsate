import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import { MockClock } from '../../id/mod.js';
import { notificationModule } from '../../intermodule/notification.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.js';
import { Account, type AccountID } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import { ResendVerifyTokenService } from './resendToken.js';
import { VerifyAccountTokenService } from './verifyToken.js';

const repository = new InMemoryAccountRepository();
await repository.create(
  Account.new({
    id: '1' as AccountID,
    name: '@john@example.com',
    mail: 'johndoe@example.com',
    nickname: 'John Doe',
    passphraseHash: 'hash',
    bio: '',
    role: 'normal',
    frozen: 'normal',
    silenced: 'normal',
    status: 'notActivated',
    createdAt: new Date(),
  }),
);
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
const accountRepository = new InMemoryAccountRepository();
await accountRepository.create(
  Account.reconstruct({
    id: '1' as AccountID,
    name: '@john@example.com',
    bio: '',
    frozen: 'normal',
    mail: '',
    nickname: '',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    passphraseHash: undefined,
    createdAt: new Date(),
    deletedAt: undefined,
    updatedAt: undefined,
  }),
);
const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));

const verifyAccountTokenService = new VerifyAccountTokenService(
  verifyRepository,
  accountRepository,
  mockClock,
);

describe('ResendVerifyTokenService', () => {
  afterEach(() => repository.reset());

  it('resend verify token', async () => {
    const service = new ResendVerifyTokenService(
      repository,
      verifyAccountTokenService,
      notificationModule,
    );
    const actual = await service.handle('@john@example.com');
    expect(Option.isNone(actual)).toBe(true);
  });

  it('when account not found', async () => {
    const service = new ResendVerifyTokenService(
      repository,
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
