import { Result } from 'mini-fn';
import { Clock, SnowflakeIDGenerator } from '../../id/mod.ts';
import { ScryptPasswordEncoder } from '../../password/mod.ts';
import { DummySendNotificationService } from './send_notification_service.ts';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.ts';
import { RegisterAccountService } from './register_service.ts';
import { TokenVerifyService } from './token_verify_service.ts';
import { AccountRole } from '../model/account.ts';
import { assertEquals } from 'std/assert';
import { SilenceService } from './silence_service.ts';

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
  name: 'john_doe@example.com',
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
});
