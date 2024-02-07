import { Result } from '@mikuroxina/mini-fn';
import { describe, it, expect } from 'vitest';

import { type Clock, SnowflakeIDGenerator } from '../../id/mod.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { type AccountName, type AccountRole } from '../model/account.js';
import { FreezeService } from './freeze.js';
import { RegisterAccountService } from './register.js';
import { DummySendNotificationService } from './sendNotification.js';
import { TokenVerifyService } from './tokenVerify.js';

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
const freezeService = new FreezeService(repository);

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

describe('FreezeService', () => {
  it('set account freeze', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    if (Result.isErr(res)) return;

    await freezeService.setFreeze(exampleInput.name);

    expect(res[1].getFrozen).toBe('frozen');
    expect(res[1].getFrozen).not.toBe('normal');
    repository.reset();
  });

  it('unset account freeze', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    if (Result.isErr(res)) return;

    await freezeService.undoFreeze(exampleInput.name);

    expect(res[1].getFrozen).toBe('normal');
    expect(res[1].getFrozen).not.toBe('frozen');
    repository.reset();
  });
});
