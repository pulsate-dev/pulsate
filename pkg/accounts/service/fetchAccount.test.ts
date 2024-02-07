import { SnowflakeIDGenerator, type Clock } from '../../id/mod.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { RegisterAccountService } from './register.js';
import { DummySendNotificationService } from './sendNotification.js';
import { TokenVerifyService } from './tokenVerify.js';
import { FetchAccountService } from './fetchAccount.js';
import type { AccountRole } from '../model/account.js';
import { Result } from '@mikuroxina/mini-fn';

const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
class DummyClock implements Clock {
  Now(): bigint {
    return BigInt(new Date('2013/9/10 00:00:00 UTC').getTime());
  }
}
const registerService: RegisterAccountService = new RegisterAccountService({
  repository,
  idGenerator: new SnowflakeIDGenerator(1, new DummyClock()),
  passwordEncoder: new Argon2idPasswordEncoder,
  sendNotification: new DummySendNotificationService(),
  verifyTokenService: new TokenVerifyService(verifyRepository),
});
const fetchAccountService = new FetchAccountService(repository);

const exampleInput = {
  name: '@john_doe@example.com',
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

Deno.test('fetch account', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  if (Result.isErr(res)) return;

  const account = await fetchAccountService.fetchAccount(exampleInput.name);
  if (Result.isErr(account)) return;

  assertEquals(account[1].getName, exampleInput.name);
  assertEquals(account[1].getMail, exampleInput.mail);
  assertEquals(account[1].getNickname, exampleInput.nickname);
  assertEquals(account[1].getBio, exampleInput.bio);
  assertEquals(account[1].getRole, exampleInput.role);
  assertEquals(account[1].getStatus, 'notActivated');
  assertEquals(account[1].getFrozen, 'normal');
  assertEquals(account[1].getSilenced, 'normal');
  assertEquals(account[1].getCreatedAt, new Date('2013/9/10 00:00:00 UTC'));
  assertEquals(account[1].getUpdatedAt, undefined);
  assertEquals(account[1].getDeletedAt, undefined);
  repository.reset();
});

Deno.test('fetch account not found', async () => {
  // "exampleInput.name" is not registered.
  const account = await fetchAccountService.fetchAccount(exampleInput.name);

  assertEquals(Result.isErr(account), true);
  repository.reset();
});
