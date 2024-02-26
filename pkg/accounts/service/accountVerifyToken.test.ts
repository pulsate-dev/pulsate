import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { type Clock } from '../../id/mod.js';
import { type ID } from '../../id/type.js';
import {
  InMemoryAccountRepository,
  InMemoryAccountVerifyTokenRepository,
} from '../adaptor/repository/dummy.js';
import { Account, type AccountID } from '../model/account.js';
import { TokenVerifyService } from './accountVerifyToken.js';

const repository = new InMemoryAccountVerifyTokenRepository();
const accountRepository = new InMemoryAccountRepository();
await accountRepository.create(
  Account.reconstruct({
    id: '1' as ID<AccountID>,
    name: '@johndoe@example.com',
    nickname: '',
    mail: '',
    bio: '',
    frozen: 'normal',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    passphraseHash: undefined,
    createdAt: new Date(),
    updatedAt: undefined,
    deletedAt: undefined,
  }),
);
const mockClock = {
  now(): bigint {
    return 0n;
  },
};

const service = new TokenVerifyService(
  repository,
  accountRepository,
  mockClock,
);

describe('TokenVerifyService', () => {
  it('generate/verify account verify token', async () => {
    const token = await service.generate('@johndoe@example.com');
    if (Result.isErr(token)) {
      return;
    }

    const verify = await service.verify('@johndoe@example.com', token[1]);
    if (Result.isErr(verify)) {
      return;
    }

    expect(Result.isOk(token)).toBe(true);
    expect(Result.isOk(verify)).toBe(true);
  });

  class DateClock implements Clock {
    now(): bigint {
      return 0n;
    }
  }

  it('expired token', async () => {
    const dummyService = new TokenVerifyService(
      repository,
      accountRepository,
      new DateClock(),
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
    const verify = await service.verify('@johndoe@example.com', 'abcde');

    expect(Result.isOk(token)).toBe(true);
    expect(Result.isOk(verify)).toBe(false);
  });
});
