import { Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import { notificationModule } from '../../intermodule/notification.js';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.js';
import { Argon2idPasswordEncoder } from '../../internal/password/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryInactiveAccountRepository } from '../adaptor/repository/dummy/inactiveAccount.js';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.js';
import type { AccountName, AccountRole } from '../model/account.js';
import { RegisterService } from './register.js';
import { VerifyAccountTokenService } from './verifyToken.js';

const inactiveAccountRepository = new InMemoryInactiveAccountRepository();
const accountRepository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));

const registerService: RegisterService = new RegisterService({
  repository: inactiveAccountRepository,
  idGenerator: new SnowflakeIDGenerator(1, mockClock),
  passwordEncoder: new Argon2idPasswordEncoder(),
  notificationModule: notificationModule,
  verifyAccountTokenService: new VerifyAccountTokenService(
    verifyRepository,
    inactiveAccountRepository,
    accountRepository,
    mockClock,
  ),
});

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  passphrase: 'password',
  role: 'normal' as AccountRole,
};

describe('RegisterService', () => {
  afterEach(() => inactiveAccountRepository.reset());

  it('register account', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.passphrase,
      exampleInput.role,
    );
    if (Result.isErr(res)) return;

    expect(res[1].getName()).toBe(exampleInput.name);
    expect(res[1].getMail()).toBe(exampleInput.mail);
    expect(res[1].getRole()).toBe(exampleInput.role);
    expect(res[1].isActivated()).toBe(false);
  });

  it('rejects passphrase shorter than requirements', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      'short',
      exampleInput.role,
    );

    expect(Result.isErr(res)).toBe(true);
  });
});
