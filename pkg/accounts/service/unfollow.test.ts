import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
} from '~/accounts/adaptor/repository/dummy.js';
import { Account, type AccountID } from '~/accounts/model/account.js';
import { AccountFollow } from '~/accounts/model/follow.js';
import type { ID } from '~/id/type.js';

import { UnfollowService } from './unfollow.js';

const accountRepository = new InMemoryAccountRepository();
await accountRepository.create(
  Account.reconstruct({
    id: '1' as ID<AccountID>,
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
    id: '2' as ID<AccountID>,
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
const repository = new InMemoryAccountFollowRepository([
  AccountFollow.new({
    fromID: '1' as ID<AccountID>,
    targetID: '2' as ID<AccountID>,
    createdAt: new Date(),
  }),
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
