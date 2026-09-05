import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.ts';
import { Account, type AccountID } from '../model/account.ts';
import { AccountFollow } from '../model/follow.ts';
import { UnfollowService } from './unfollow.ts';

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
const idGenerator = new SnowflakeIDGenerator(
  1,
  new MockClock(new Date('2023-09-10T00:00:00.000Z')),
);
const repository = new InMemoryAccountFollowRepository([
  Result.unwrap(
    AccountFollow.new(
      {
        fromID: '1' as AccountID,
        targetID: '2' as AccountID,
        createdAt: new Date(),
      },
      {
        idGenerator,
        actor: '1' as AccountID,
        occurredAt: new Date(),
      },
    ),
  ),
]);
const service = new UnfollowService(repository, accountRepository);

describe('UnfollowService', () => {
  it('should unfollow', async () => {
    const res = await service.handle(
      '@johndoe@example.com',
      '@testuser@example.com',
    );

    expect(Option.isSome(res)).toBe(false);
  });
});
