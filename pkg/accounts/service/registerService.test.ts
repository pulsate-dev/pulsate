import { assertEquals } from 'std/assert';
import { Clock, SnowflakeIDGenerator } from '../../id/mod.ts';
import { ScryptPasswordEncoder } from '../../password/mod.ts';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.ts';
import { RegisterAccountService } from './registerService.ts';
import { DummySendNotificationService } from './sendNotificationService.ts';
import { TokenVerifyService } from './tokenVerifyService.ts';
import { Result } from 'mini-fn';
import { AccountRole } from '../model/account.ts';

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
  name: 'john_doe@example.com',
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
