import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { MockClock, SnowflakeIDGenerator } from '../../id/mod.js';
import { Argon2idPasswordEncoder } from '../../password/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.js';
import type { AccountName, AccountRole } from '../model/account.js';
import { RegisterService } from './register.js';
import { DummySendNotificationService } from './sendNotification.js';
import { VerifyAccountTokenService } from './verifyToken.js';

const repository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));

const registerService: RegisterService = new RegisterService({
  repository,
  idGenerator: new SnowflakeIDGenerator(1, mockClock),
  passwordEncoder: new Argon2idPasswordEncoder(),
  sendNotification: new DummySendNotificationService(),
  verifyAccountTokenService: new VerifyAccountTokenService(
    verifyRepository,
    repository,
    mockClock,
  ),
  clock: new MockClock(new Date('2020-02-02')),
});

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphrase: 'password',
  bio: 'Hello, World!',
  role: 'normal' as AccountRole,
};

describe('RegisterService', () => {
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
