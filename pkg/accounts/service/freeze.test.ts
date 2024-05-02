import { Option } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import { InMemoryAccountRepository } from '~/accounts/adaptor/repository/dummy.js';
import { Account, type AccountID } from '~/accounts/model/account.js';
import type { ID } from '~/id/type.js';

import { FreezeService } from './freeze.js';

const repository = new InMemoryAccountRepository();
await repository.create(
  Account.new({
    id: '1' as ID<AccountID>,
    name: '@john@example.com',
    mail: 'johndoe@example.com',
    nickname: 'John Doe',
    passphraseHash: 'hash',
    bio: '',
    role: 'normal',
    frozen: 'normal',
    silenced: 'normal',
    status: 'notActivated',
    createdAt: new Date(),
  }),
);
const freezeService = new FreezeService(repository);

describe('FreezeService', () => {
  afterEach(() => repository.reset());

  it('set account freeze', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await freezeService.setFreeze('@john@example.com');

    expect(account[1].getFrozen()).toBe('frozen');
    expect(account[1].getFrozen()).not.toBe('normal');
  });

  it('unset account freeze', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await freezeService.undoFreeze('@john@example.com');

    expect(account[1].getFrozen()).toBe('normal');
    expect(account[1].getFrozen()).not.toBe('frozen');
  });
});
