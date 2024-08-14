import { Option, Result } from '@mikuroxina/mini-fn';
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
  // NOTE: actor account(moderator)
  Account.reconstruct({
    id: '3' as AccountID,
    name: '@bob@example.com',
    mail: 'bob@example.com',
    nickname: 'Bob',
    passphraseHash: 'hash',
    bio: '',
    role: 'moderator',
    frozen: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
  }),
  // NOTE: actor account(normal)
  Account.reconstruct({
    id: '4' as AccountID,
    name: '@carol@example.com',
    mail: 'carol@example.com',
    nickname: 'Carol',
    passphraseHash: 'hash',
    bio: '',
    role: 'normal',
    frozen: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
  }),
  // NOTE: target account(frozen)
  Account.reconstruct({
    id: '1' as AccountID,
    name: '@david@example.com',
    mail: 'david@example.com',
    nickname: 'david',
    passphraseHash: 'hash',
    bio: '',
    role: 'normal',
    frozen: 'frozen',
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

  describe('permission check', () => {
    beforeEach(() => repository.reset(testAccounts));

    it('cannot freeze self', async () => {
      const account = await repository.findByName('@alice@example.com');
      if (Option.isNone(account)) return;

      const result = await freezeService.setFreeze(
        '@alice@example.com',
        '@alice@example.com',
      );

      expect(Result.isErr(result)).toBe(true);
      expect(result[1]).toStrictEqual(new Error('not allowed'));
    });

    it('cannot freeze/unFreeze if actor is not admin or moderator', async () => {
      const account = await repository.findByName('@john@example.com');
      if (Option.isNone(account)) return;

      const result = await freezeService.setFreeze(
        '@john@example.com',
        '@carol@example.com',
      );

      expect(Result.isErr(result)).toBe(true);
      expect(result[1]).toStrictEqual(new Error('not allowed'));

      const unFreezeRes = await freezeService.undoFreeze(
        '@david@example.com',
        '@john@example.com',
      );
      expect(Result.isErr(unFreezeRes)).toBe(true);
      expect(unFreezeRes[1]).toStrictEqual(new Error('not allowed'));
    });

    it('moderator can freeze/unFreeze only normal account', async () => {
      const account = await repository.findByName('@john@example.com');
      if (Option.isNone(account)) return;

      const result = await freezeService.setFreeze(
        '@john@example.com',
        '@carol@example.com',
      );

      expect(Result.isErr(result)).toBe(true);
      expect(result[1]).toStrictEqual(new Error('not allowed'));

      const unFreezeRes = await freezeService.undoFreeze(
        '@david@example.com',
        '@carol@example.com',
      );

      expect(Result.isErr(unFreezeRes)).toBe(true);
      expect(unFreezeRes[1]).toStrictEqual(new Error('not allowed'));
    });
  });
});
