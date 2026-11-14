import { Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import type { Account } from '../model/account.ts';
import { generateDummyAccount } from '../testData/testData.ts';
import { FetchService } from './fetch.ts';

const john = generateDummyAccount({
  name: '@john@example.com',
  mail: 'johndoe@example.com',
  nickname: 'John Doe',
  passphraseHash: 'hash',
  bio: '',
  status: 'notActivated',
});
const alice = generateDummyAccount({ name: '@alice@example.com' });
const bob = generateDummyAccount({ name: '@bob@example.com' });
const testAccounts = [john, alice, bob];
const repository = new InMemoryAccountRepository(testAccounts);
const fetchService = new FetchService(repository);

describe('FetchService', () => {
  afterEach(() => repository.reset(testAccounts));

  it('fetch account info', async () => {
    const account = await fetchService.fetchAccount('@john@example.com');
    if (Result.isErr(account)) return;

    expect(account[1].getID()).toBe(john.getID());
    expect(account[1].getName()).toBe('@john@example.com');
    expect(account[1].getMail()).toBe('johndoe@example.com');
    expect(account[1].getNickname()).toBe('John Doe');
    expect(account[1].getPassphraseHash()).toBe('hash');
    expect(account[1].getBio()).toBe('');
    expect(account[1].getRole()).toBe('normal');
    expect(account[1].isFrozen()).toBe(false);
    expect(account[1].isSilenced()).toBe(false);
    expect(account[1].isActivated()).toBe(false);
    expect(account[1].getCreatedAt()).toBeInstanceOf(Date);
  });

  it("fetch account info doesn't exist", async () => {
    // `@notJohn` is not registered.
    const account = await fetchService.fetchAccount('@notJohn@example.com');

    expect(Result.isErr(account)).toBe(true);
  });

  it('fetch account by ID', async () => {
    const account = await fetchService.fetchAccountByID(john.getID());
    if (Result.isErr(account)) {
      return;
    }

    expect(account[1]).toStrictEqual(john);
  });

  it("fetch account by ID doesn't exist", async () => {
    const account =
      await fetchService.fetchAccountByID(generateDummyID<Account>());

    expect(Result.isErr(account)).toBe(true);
  });

  it('should fetch many account by ID', async () => {
    const accounts = await fetchService.fetchManyAccountsByID([
      alice.getID(),
      bob.getID(),
    ]);

    expect(Result.isOk(accounts)).toBe(true);
    expect(Result.unwrap(accounts).length).toBe(2);
  });
});
