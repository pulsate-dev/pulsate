import { assertEquals } from 'std/assert';
import { type Clock, SnowflakeIDGenerator } from '../../id/mod.js';
import { ScryptPasswordEncoder } from '../../password/mod.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { RegisterAccountService } from './register.js';
import { DummySendNotificationService } from './sendNotification.js';
import { TokenVerifyService } from './tokenVerify.js';
import { Result } from '@mikuroxina/mini-fn';
import { type AccountName,type AccountRole } from '../model/account.js';

const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
class DummyClock implements Clock {
  Now(): bigint {
    return BigInt(new Date('2023/9/10 00:00:00 UTC').getTime());
  }
}
const registerService: RegisterAccountService = new RegisterAccountService({
  repository,
  idGenerator: new SnowflakeIDGenerator(1, new DummyClock()),
  passwordEncoder: new ScryptPasswordEncoder(),
  sendNotification: new DummySendNotificationService(),
  verifyTokenService: new TokenVerifyService(verifyRepository),
});

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

Deno.test('register account', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  if (Result.isErr(res)) return;

  assertEquals(res[1].getName, exampleInput.name);
  assertEquals(res[1].getMail, exampleInput.mail);
  assertEquals(res[1].getNickname, exampleInput.nickname);
  assertEquals(res[1].getBio, exampleInput.bio);
  assertEquals(res[1].getRole, exampleInput.role);
  assertEquals(res[1].getStatus, 'notActivated');
  repository.reset();
});
