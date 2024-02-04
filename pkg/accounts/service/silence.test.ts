import { Result } from '@mikuroxina/mini-fn';
import { type Clock, SnowflakeIDGenerator } from '../../id/mod.js';
import { ScryptPasswordEncoder } from '../../password/mod.js';
import { DummySendNotificationService } from './sendNotification.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { RegisterAccountService } from './register.js';
import { TokenVerifyService } from './tokenVerify.js';
import { type AccountName, type AccountRole } from '../model/account.js';
import { assertEquals, assertNotEquals } from 'std/assert';
import { SilenceService } from './silence.js';

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
const silenceService = new SilenceService(repository);

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

Deno.test('set account silence', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  if (Result.isErr(res)) return;

  await silenceService.setSilence(exampleInput.name);

  assertEquals(res[1].getSilenced, 'silenced');
  assertNotEquals(res[1].getSilenced, 'normal');
  repository.reset();
});

Deno.test('unset account silence', async () => {
  const res = await registerService.handle(
    exampleInput.name,
    exampleInput.mail,
    exampleInput.nickname,
    exampleInput.passphrase,
    exampleInput.bio,
    exampleInput.role,
  );
  if (Result.isErr(res)) return;

  await silenceService.setSilence(exampleInput.name);
  await silenceService.undoSilence(exampleInput.name);

  assertEquals(res[1].getSilenced, 'normal');
  assertNotEquals(res[1].getSilenced, 'silenced');
  repository.reset();
});
