import { Option } from '@mikuroxina/mini-fn';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { ResendVerifyTokenService } from './resendToken.js';
import { assertEquals } from 'std/assert';
import { TokenVerifyService } from './tokenVerify.js';
import { DummySendNotificationService } from './sendNotification.js';
import { Account, type AccountID } from '../model/account.js';
import { type ID } from '../../id/type.js';

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

Deno.test('resend verify token', async () => {
  const service = new ResendVerifyTokenService(
    repository,
    tokenVerifyService,
    sendNotificationService,
  );
  const actual = await service.handle('@john@example.com');
  assertEquals(Option.isNone(actual), true);
});

Deno.test('when account not found', async () => {
  const service = new ResendVerifyTokenService(
    repository,
    tokenVerifyService,
    sendNotificationService,
  );
  const actual = await service.handle('@a@example.com');

  assertEquals(Option.isSome(actual), true);
  if (Option.isNone(actual)) return;
  assertEquals(actual[1], new Error('AccountNotFoundError'));
});
