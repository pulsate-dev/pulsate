import { EtagVerifyService } from './etag_verify_generate_service.ts';
import { assertEquals } from 'std/assert';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.ts';
import { Result } from 'mini-fn';
import { RegisterAccountService } from './register_service.ts';
import { Clock, SnowflakeIDGenerator } from '../../id/mod.ts';
import { ScryptPasswordEncoder } from '../../password/mod.ts';
import { DummySendNotificationService } from './send_notification_service.ts';
import { TokenVerifyService } from './token_verify_service.ts';
import { AccountRole } from '../model/account.ts';

class DummyClock implements Clock {
  Now(): bigint {
    return BigInt(new Date('2023/9/10 00:00:00 UTC').getTime());
  }
}
const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
const registerService = new RegisterAccountService({
  repository: repository,
  idGenerator: new SnowflakeIDGenerator(1, new DummyClock()),
  passwordEncoder: new ScryptPasswordEncoder(),
  sendNotification: new DummySendNotificationService(),
  verifyTokenService: new TokenVerifyService(verifyRepository),
});
const etagVerifyService: EtagVerifyService = new EtagVerifyService();

const exampleInput = {
  name: 'john_doe@example.com',
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

Deno.test('success to verify etag', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);

  const etag = await etagVerifyService.generate(account);
  const result = await etagVerifyService.Verify(account, etag);
  assertEquals(result, true);
  repository.reset();
});

Deno.test('failed to verify etag', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);

  const etag = await etagVerifyService.generate(account) + '_invalid';
  const result = await etagVerifyService.Verify(account, etag);
  assertEquals(result, false);
  repository.reset();
});

Deno.test('should return string which is 64 characters long', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  const account = Result.unwrap(res);

  const etag = await etagVerifyService.generate(account);
  assertEquals(etag.length, 64);
  repository.reset();
});
