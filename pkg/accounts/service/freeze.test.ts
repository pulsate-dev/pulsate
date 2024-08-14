import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { beforeEach } from 'node:test';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy.js';
import { Account, type AccountID } from '../model/account.js';
import { FreezeService } from './freeze.js';

const testAccounts = [
  // NOTE: target account
  Account.reconstruct({
    id: '1' as AccountID,
    name: '@john@example.com',
    mail: 'johndoe@example.com',
    nickname: 'John Doe',
    passphraseHash: 'hash',
    bio: '',
    role: 'normal',
    frozen: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
  }),
  // NOTE: actor account
  Account.reconstruct({
    id: '2' as AccountID,
    name: '@alice@example.com',
    mail: 'alice@example.com',
    nickname: 'Alice',
    passphraseHash: 'hash',
    bio: '',
    role: 'admin',
    frozen: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
  }),
];
const repository = new InMemoryAccountRepository();
const freezeService = new FreezeService(repository);

describe('FreezeService', () => {
  beforeEach(() => repository.reset(testAccounts));

  it('set account freeze', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await freezeService.setFreeze('@john@example.com', '@alice@example.com');

    expect(account[1].getFrozen()).toBe('frozen');
    expect(account[1].getFrozen()).not.toBe('normal');
  });

  it('unset account freeze', async () => {
    const account = await repository.findByName('@john@example.com');
    if (Option.isNone(account)) return;

    await freezeService.setFreeze('@john@example.com', '@alice@example.com');

    await freezeService.undoFreeze('@john@example.com', '@alice@example.com');

    expect(account[1].getFrozen()).toBe('normal');
    expect(account[1].getFrozen()).not.toBe('frozen');
  });
});
