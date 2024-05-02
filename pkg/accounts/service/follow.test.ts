import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import {
  InMemoryAccountFollowRepository,
  InMemoryAccountRepository,
} from '~/accounts/adaptor/repository/dummy.js';
import { Account, type AccountID } from '~/accounts/model/account.js';
import type { ID } from '~/id/type.js';

import { FollowService } from './follow.js';

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
const repository = new InMemoryAccountFollowRepository();
const service = new FollowService(repository, accountRepository);

describe('FollowService', () => {
  it('should follow', async () => {
    const res = await service.handle(
      '@johndoe@example.com',
      '@testuser@example.com',
    );

    expect(Result.isErr(res)).toBe(false);
    expect(Result.unwrap(res).getFromID()).toBe('1' as ID<AccountID>);
    expect(Result.unwrap(res).getTargetID()).toBe('2' as ID<AccountID>);
    expect(Result.unwrap(res).getDeletedAt()).toStrictEqual(Option.none());
  });
});
