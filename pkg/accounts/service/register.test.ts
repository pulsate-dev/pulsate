import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { type Clock, SnowflakeIDGenerator } from '../../id/mod.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { type AccountName, type AccountRole } from '../model/account.js';
import { TokenVerifyService } from './accountVerifyToken.js';
import { RegisterAccountService } from './register.js';
import { DummySendNotificationService } from './sendNotification.js';

const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();

class DummyClock implements Clock {
  now(): bigint {
    return BigInt(new Date('2023/9/10 00:00:00 UTC').getTime());
  }
}

const mockClock = {
  now(): bigint {
    return 0n;
  },
};

const registerService: RegisterAccountService = new RegisterAccountService({
  repository,
  idGenerator: new SnowflakeIDGenerator(1, new DummyClock()),
  passwordEncoder: new Argon2idPasswordEncoder(),
  sendNotification: new DummySendNotificationService(),
  verifyTokenService: new TokenVerifyService(
    verifyRepository,
    repository,
    mockClock,
  ),
});

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

describe('RegisterAccountService', () => {
  it('register account', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.nickname,
      exampleInput.passphrase,
      exampleInput.bio,
      exampleInput.role,
    );
    if (Result.isErr(res)) return;

    expect(res[1].getName()).toBe(exampleInput.name);
    expect(res[1].getMail()).toBe(exampleInput.mail);
    expect(res[1].getNickname()).toBe(exampleInput.nickname);
    expect(res[1].getBio()).toBe(exampleInput.bio);
    expect(res[1].getRole()).toBe(exampleInput.role);
    expect(res[1].getStatus()).toBe('notActivated');
    repository.reset();
  });
});
