import { EtagVerifyService } from './etagGenerateVerify.js';
import { assertEquals } from 'std/assert';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { Result } from '@mikuroxina/mini-fn';
import { RegisterAccountService } from './register.js';
import { type Clock, SnowflakeIDGenerator } from '../../id/mod.js';
import { ScryptPasswordEncoder } from '../../password/mod.js';
import { DummySendNotificationService } from './sendNotification.js';
import { TokenVerifyService } from './tokenVerify.js';
import { type AccountName,type AccountRole } from '../model/account.js';

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
  name: '@john_doe@example.com' as AccountName,
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
  const result = await etagVerifyService.verify(account, etag);
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

  const etag = (await etagVerifyService.generate(account)) + '_invalid';
  const result = await etagVerifyService.verify(account, etag);
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
