import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { MockClock } from '../../internal/id/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryInactiveAccountRepository } from '../adaptor/repository/dummy/inactiveAccount.js';
import { InMemoryAccountVerifyTokenRepository } from '../adaptor/repository/dummy/verifyToken.js';
import type { AccountID } from '../model/account.js';
import { InactiveAccount } from '../model/inactiveAccount.js';
import { VerifyAccountTokenService } from './verifyToken.js';

const repository = new InMemoryAccountVerifyTokenRepository();
const inactiveAccountRepository = new InMemoryInactiveAccountRepository();
const accountRepository = new InMemoryAccountRepository();

await inactiveAccountRepository.create(
  InactiveAccount.reconstruct({
    id: '1' as AccountID,
    name: '@johndoe@example.com',
    mail: 'johndoe@example.com',
    passphraseHash: 'hash',
    role: 'normal',
  }),
);

const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));

const service = new VerifyAccountTokenService(
  repository,
  inactiveAccountRepository,
  accountRepository,
  mockClock,
);

describe('VerifyAccountTokenService', () => {
  it('generate/verify account verify token', async () => {
    const token = await service.generate('@johndoe@example.com');
    if (Result.isErr(token)) {
      return;
    }
    expect(Option.isNone(await repository.findByID('1' as AccountID))).toBe(
      false,
    );
    const verify = await service.verify('@johndoe@example.com', token[1]);
    if (Result.isErr(verify)) {
      return;
    }

    expect(Result.isOk(token)).toBe(true);
    expect(Result.isOk(verify)).toBe(true);
    expect(Option.isNone(await repository.findByID('1' as AccountID))).toBe(
      true,
    );
  });

  it('expired token', async () => {
    const dummyService = new VerifyAccountTokenService(
      repository,
      inactiveAccountRepository,
      accountRepository,
      mockClock,
    );
    const token = await dummyService.generate('@johndoe@example.com');
    if (Result.isErr(token)) {
      return;
    }
    const verify = await dummyService.verify('@johndoe@example.com', token[1]);

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
