import {Result} from '@mikuroxina/mini-fn';
import {type Clock, SnowflakeIDGenerator} from '../../id/mod.js';
import {Argon2idPasswordEncoder} from '../../password/mod.js';
import {DummySendNotificationService} from './sendNotification.js';
import {InMemoryAccountRepository, InMemoryAccountVerifyTokenRepository,} from '../adaptor/repository/dummy.js';
import {RegisterAccountService} from './register.js';
import {TokenVerifyService} from './tokenVerify.js';
import {type AccountName, type AccountRole} from '../model/account.js';

import {SilenceService} from './silence.js';
import {describe, expect} from "vitest";

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
  passwordEncoder: new Argon2idPasswordEncoder(),
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

describe('SilenceService', it => {
  it('set account silence', async () => {
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

    expect(res[1].getSilenced).toBe('silenced');
    expect(res[1].getSilenced).not.toBe('normal');
    repository.reset();
  });

  it('unset account silence', async () => {
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

    expect(res[1].getSilenced).toBe('normal');
    expect(res[1].getSilenced).not.toBe('silenced');
    repository.reset();
  });
});
