import { Option, Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { MockClock } from '../../internal/id/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryInactiveAccountRepository } from '../adaptor/repository/dummy/inactiveAccount.ts';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.ts';
import type { AccountID } from '../model/account.ts';
import { InactiveAccount } from '../model/inactiveAccount.ts';
import { VerifyAccountTokenService } from './verifyToken.ts';

const testInactiveAccount = InactiveAccount.reconstruct({
  id: '1' as AccountID,
  name: '@johndoe@example.com',
  mail: 'johndoe@example.com',
  passphraseHash: 'hash',
  role: 'normal',
});

const repository = new InMemoryAccountVerifyTokenRepository();
const inactiveAccountRepository = new InMemoryInactiveAccountRepository();
const accountRepository = new InMemoryAccountRepository();

const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));
const eventPublisher: EventPublisher = { publishMany: vi.fn() };

const service = new VerifyAccountTokenService(
  repository,
  inactiveAccountRepository,
  accountRepository,
  mockClock,
  eventPublisher,
);

describe('VerifyAccountTokenService', () => {
  beforeEach(async () => {
    repository.reset();
    inactiveAccountRepository.reset();
    accountRepository.reset();
    vi.clearAllMocks();
    await inactiveAccountRepository.create(testInactiveAccount);
  });

  it('generate/verify account verify token', async () => {
    const token = await service.generate('@johndoe@example.com');
    expect(Option.isNone(await repository.findByID('1' as AccountID))).toBe(
      false,
    );
    const verify = await service.verify(
      '@johndoe@example.com',
      Result.unwrap(token),
    );

    expect(Result.isOk(token)).toBe(true);
    expect(Result.isOk(verify)).toBe(true);
    expect(Option.isNone(await repository.findByID('1' as AccountID))).toBe(
      true,
    );
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'account.activated' }),
    ]);
  });

  it('expired token', async () => {
    const generateClock = new MockClock(new Date('2023-09-10T00:00:00Z'));
    const verifyClock = new MockClock(new Date('2023-09-18T00:00:00Z'));
    const dummyService = new VerifyAccountTokenService(
      repository,
      inactiveAccountRepository,
      accountRepository,
      generateClock,
      eventPublisher,
    );
    const token = await dummyService.generate('@johndoe@example.com');

    const verifyService = new VerifyAccountTokenService(
      repository,
      inactiveAccountRepository,
      accountRepository,
      verifyClock,
      eventPublisher,
    );
    const verify = await verifyService.verify(
      '@johndoe@example.com',
      Result.unwrap(token),
    );

    expect(Result.isOk(token)).toBe(true);
    expect(Result.isOk(verify)).toBe(false);
  });

  it('invalid token', async () => {
    const token = await service.generate('@johndoe@example.com');
    const verify = await service.verify('@johndoe@example.com', '000000');

    expect(Result.isOk(token)).toBe(true);
    expect(Result.isOk(verify)).toBe(false);
  });
});
