import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
} from '~/accounts/adaptor/repository/dummy.js';
import { Account, type AccountID } from '~/accounts/model/account.js';
import { AccountFollow } from '~/accounts/model/follow.js';
import type { ID } from '~/id/type.js';

import { FetchAccountFollowService } from './fetchAccountFollow.js';

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

const createdAt = new Date();
const repository = new InMemoryAccountFollowRepository();

await repository.follow(
  AccountFollow.new({
    fromID: '1' as ID<AccountID>,
    targetID: '2' as ID<AccountID>,
    createdAt,
  }),
);

await repository.follow(
  AccountFollow.new({
    fromID: '2' as ID<AccountID>,
    targetID: '1' as ID<AccountID>,
    createdAt,
  }),
);

const service = new FetchAccountFollowService(repository, accountRepository);

describe('FetchAccountFollowService', () => {
  const USER = {
    id: '1' as ID<AccountID>,
    name: '@johndoe@example.com' as const,
  };

  it('fetch followings by id', async () => {
    const resFollows = await service.fetchFollowingsByID(USER.id);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '1' as ID<AccountID>,
        targetID: '2' as ID<AccountID>,
        createdAt,
      }),
    ]);
  });

  it('fetch followings by name', async () => {
    const resFollows = await service.fetchFollowingsByName(USER.name);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '1' as ID<AccountID>,
        targetID: '2' as ID<AccountID>,
        createdAt,
      }),
    ]);
  });

  it('fetch followers by id', async () => {
    const resFollows = await service.fetchFollowersByID(USER.id);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '2' as ID<AccountID>,
        targetID: '1' as ID<AccountID>,
        createdAt,
      }),
    ]);
  });

  it('fetch followers by name', async () => {
    const resFollows = await service.fetchFollowersByName(USER.name);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '2' as ID<AccountID>,
        targetID: '1' as ID<AccountID>,
        createdAt,
      }),
    ]);
  });
});
