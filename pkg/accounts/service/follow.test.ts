import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.ts';
import { Account, type AccountID } from '../model/account.ts';
import { FollowService } from './follow.ts';

const accountRepository = new InMemoryAccountRepository();
await accountRepository.create(
  Account.reconstruct({
    id: '1' as AccountID,
    name: '@johndoe@example.com',
    bio: '',
    mail: '',
    nickname: '',
    passphraseHash: undefined,
    frozen: 'normal',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
    updatedAt: undefined,
    deletedAt: undefined,
  }),
);
await accountRepository.create(
  Account.reconstruct({
    id: '2' as AccountID,
    name: '@testuser@example.com',
    bio: '',
    mail: '',
    nickname: '',
    passphraseHash: undefined,
    frozen: 'normal',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
    updatedAt: undefined,
    deletedAt: undefined,
  }),
);
const repository = new InMemoryAccountFollowRepository();
const mockClock = new MockClock(new Date('2023-09-10T00:00:00Z'));
const service = new FollowService(
  repository,
  accountRepository,
  mockClock,
  new SnowflakeIDGenerator(1, mockClock),
);

describe('FollowService', () => {
  it('should follow', async () => {
    const res = await service.handle(
      '@johndoe@example.com',
      '@testuser@example.com',
    );

    expect(Result.isErr(res)).toBe(false);
    expect(Result.unwrap(res).getFromID()).toBe('1' as AccountID);
    expect(Result.unwrap(res).getTargetID()).toBe('2' as AccountID);
    expect(Result.unwrap(res).getDeletedAt()).toStrictEqual(Option.none());
  });
});
