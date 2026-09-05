import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { Account, type AccountID } from '../model/account.ts';
import { FetchService } from './fetch.ts';

const testAccounts = [
  Account.new(
    {
      id: '1' as AccountID,
      name: '@john@example.com',
      mail: 'johndoe@example.com',
      nickname: 'John Doe',
      passphraseHash: 'hash',
      bio: '',
      role: 'normal',
      createdAt: new Date('2023-09-10T12:00:00Z'),
    },
    Option.none(),
  ),
  Account.new(
    {
      id: '2' as AccountID,
      name: '@alice@example.com',
      mail: 'alice@example.com',
      nickname: 'Alice',
      bio: 'Hello, World!',
      role: 'normal',
      createdAt: new Date('2023-09-11T12:00:00Z'),
    },
    Option.none(),
  ),
  Account.new(
    {
      id: '3' as AccountID,
      name: '@bob@example.com',
      mail: 'bob@example.com',
      nickname: 'bob',
      bio: 'Hello, World!',
      role: 'normal',
      createdAt: new Date('2023-09-12T12:00:00Z'),
    },
    Option.none(),
  ),
];
const repository = new InMemoryAccountRepository(testAccounts);
const fetchService = new FetchService(repository);

describe('FetchService', () => {
  afterEach(() => repository.reset(testAccounts));

  it('fetch account info', async () => {
    const account = await fetchService.fetchAccount('@john@example.com');
    if (Result.isErr(account)) return;

    expect(account[1].getID()).toBe('1');
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
    const account = await fetchService.fetchAccountByID('1' as AccountID);
    if (Result.isErr(account)) {
      return;
    }
    // NOTE: events carry a non-deterministic ID, so drop them from both
    // sides before comparing.
    account[1].pullEvents();

    const expected = Account.new(
      {
        id: '1' as AccountID,
        name: '@john@example.com',
        mail: 'johndoe@example.com',
        nickname: 'John Doe',
        passphraseHash: 'hash',
        bio: '',
        role: 'normal',
        createdAt: new Date('2023-09-10T12:00:00.000Z'),
      },
      Option.none(),
    );
    expected.pullEvents();

    expect(account[1]).toStrictEqual(expected);
  });

  it("fetch account by ID doesn't exist", async () => {
    // `20` is not registered.
    const account = await fetchService.fetchAccountByID('20' as AccountID);

    expect(Result.isErr(account)).toBe(true);
  });

  it('should fetch many account by ID', async () => {
    const accounts = await fetchService.fetchManyAccountsByID([
      '2' as AccountID,
      '3' as AccountID,
    ]);

    expect(Result.isOk(accounts)).toBe(true);
    expect(Result.unwrap(accounts).length).toBe(2);
  });
});
