import { Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { notificationModule } from '../../intermodule/notification.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { Argon2idPasswordEncoder } from '../../internal/password/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryInactiveAccountRepository } from '../adaptor/repository/dummy/inactiveAccount.ts';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.ts';
import type { AccountName, AccountRole } from '../model/account.ts';
import { RegisterService } from './register.ts';
import { VerifyAccountTokenService } from './verifyToken.ts';

const inactiveAccountRepository = new InMemoryInactiveAccountRepository();
const accountRepository = new InMemoryAccountRepository();
const verifyRepository = new InMemoryAccountVerifyTokenRepository();
const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));
const eventPublisher: EventPublisher = {
  publishMany: vi.fn(async () => undefined),
};

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
    eventPublisher,
  ),
  eventPublisher,
});

const exampleInput = {
  name: '@john_doe@example.com' as AccountName,
  mail: 'johndoe@example.com',
  passphrase: 'password',
  role: 'normal' as AccountRole,
};

describe('RegisterService', () => {
  afterEach(() => {
    inactiveAccountRepository.reset();
    vi.clearAllMocks();
  });

  it('register account', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.passphrase,
      exampleInput.role,
    );
    const account = Result.unwrap(res);

    expect(account.getName()).toBe(exampleInput.name);
    expect(account.getMail()).toBe(exampleInput.mail);
    expect(account.getRole()).toBe(exampleInput.role);
    expect(account.isActivated()).toBe(false);
  });

  it('publishes account.registered event', async () => {
    const res = await registerService.handle(
      exampleInput.name,
      exampleInput.mail,
      exampleInput.passphrase,
      exampleInput.role,
    );
    if (Result.isErr(res)) return;

    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.registered' }),
    ]);
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
