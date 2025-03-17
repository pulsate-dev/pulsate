import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { MockClock } from '../../id/mod.js';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.js';
import { Account, type AccountID } from '../model/account.js';
import { FollowService } from './follow.js';

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
const service = new FollowService(
  repository,
  accountRepository,
  new MockClock(new Date('2020-02-02')),
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
