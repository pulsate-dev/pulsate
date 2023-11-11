import { assertEquals } from 'std/assert';
import { Clock, SnowflakeIDGenerator } from '../../id/mod.ts';
import { ScryptPasswordEncoder } from '../../password/mod.ts';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.ts';
import { AccountRepository } from '../model/repository.ts';
import { RegisterAccountService } from './register_service.ts';
import { DummySendNotificationService } from './send_notification_service.ts';
import { TokenVerifyService } from './token_verify_service.ts';
import { Result } from 'mini-fn';
import { AccountRole } from '../model/account.ts';

const repository: AccountRepository = new InMemoryAccountRepository();
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
  assertEquals(res[1].getPassphraseHash, exampleInput.passphrase);
  assertEquals(res[1].getBio, exampleInput.bio);
  assertEquals(res[1].getRole, exampleInput.role);
  assertEquals(res[1].getStatus, 'notActivated');
});
