import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { type ID } from '../../id/type.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { Account, type AccountID } from '../model/account.js';
import { TokenVerifyService } from './accountVerifyToken.js';
import { ResendVerifyTokenService } from './resendToken.js';
import { DummySendNotificationService } from './sendNotification.js';

const repository = new InMemoryAccountRepository();
repository.create(
  Account.new({
    id: '1' as ID<AccountID>,
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
const tokenVerifyService = new TokenVerifyService(verifyRepository);
const sendNotificationService = new DummySendNotificationService();

describe('ResendVerifyTokenService', () => {
  it('resend verify token', async () => {
    const service = new ResendVerifyTokenService(
      repository,
      tokenVerifyService,
      sendNotificationService,
    );
    const actual = await service.handle('@john@example.com');
    expect(Option.isNone(actual)).toBe(true);
  });

  it('when account not found', async () => {
    const service = new ResendVerifyTokenService(
      repository,
      tokenVerifyService,
      sendNotificationService,
    );
    const actual = await service.handle('@a@example.com');

    expect(Option.isSome(actual)).toBe(true);
    if (Option.isNone(actual)) return;
    expect(actual[1]).toStrictEqual(new Error('AccountNotFoundError'));
  });
});
