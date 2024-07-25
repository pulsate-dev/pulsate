import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../model/account.js';
import type { AccountFollow } from '../../model/follow.js';
import type { InactiveAccount } from '../../model/inactiveAccount.js';
import {
  type AccountFollowRepository,
  type AccountRepository,
  type AccountVerifyTokenRepository,
  type InactiveAccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
  inactiveAccountRepoSymbol,
  verifyTokenRepoSymbol,
} from '../../model/repository.js';

export class InMemoryAccountRepository implements AccountRepository {
  private data: Set<Account>;

  constructor(accounts: Account[] = []) {
    this.data = new Set(accounts);
  }

  create(account: Account): Promise<Result.Result<Error, void>> {
    this.data.add(account);
    return Promise.resolve(Result.ok(undefined));
  }

  reset(data: Account[] = []): void {
    this.data.clear();
    data.map((v) => this.data.add(v));
  }

  findByID(id: AccountID): Promise<Option.Option<Account>> {
    const account = Array.from(this.data).find((a) => a.getID() === id);
    if (!account) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(account));
  }

  findByName(name: string): Promise<Option.Option<Account>> {
    const account = Array.from(this.data).find((a) => a.getName() === name);
    if (!account) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(Option.some(account));
  }

  findManyByID(
    id: readonly AccountID[],
  ): Promise<Result.Result<Error, Account[]>> {
    const set = new Set(id);
    const accounts = Array.from(this.data).filter((a) => set.has(a.getID()));
    return Promise.resolve(Result.ok(accounts));
  }

  findByMail(mail: string): Promise<Option.Option<Account>> {
    const account = Array.from(this.data).find((a) => a.getMail() === mail);
    if (!account) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(account));
  }

  async edit(account: Account): Promise<Result.Result<Error, void>> {
    const oldAccount = Array.from(this.data).find(
      (a) => a.getName() === account.getName(),
    );
    if (oldAccount) {
      this.data.delete(oldAccount);
    }
    this.data.add(account);

    return Result.ok(undefined);
  }
}
export const newAccountRepo = (accounts: Account[] = []) =>
  Ether.newEther(
    accountRepoSymbol,
    () => new InMemoryAccountRepository(accounts),
  );

export class InMemoryAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository
{
  private data: Map<string, { token: string; expire: Date }>;

  constructor() {
    this.data = new Map();
  }

  create(
    accountID: AccountID,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>> {
    this.data.set(accountID.toString(), { token, expire });
    return Promise.resolve(Result.ok(undefined));
  }

  findByID(
    id: AccountID,
  ): Promise<Option.Option<{ token: string; expire: Date }>> {
    const data = this.data.get(id);
    if (!data) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(data));
  }
}
export const verifyTokenRepo = Ether.newEther(
  verifyTokenRepoSymbol,
  () => new InMemoryAccountVerifyTokenRepository(),
);

export class InMemoryAccountFollowRepository
  implements AccountFollowRepository
{
  private readonly data: Set<AccountFollow>;

  constructor(data?: AccountFollow[]) {
    this.data = new Set(data);
  }

  async fetchAllFollowers(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getTargetID() === accountID);
    return Result.ok(res);
  }

  async fetchAllFollowing(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = [...this.data].filter((f) => f.getFromID() === accountID);
    return Result.ok(res);
  }

  async follow(follow: AccountFollow): Promise<Result.Result<Error, void>> {
    this.data.add(follow);
    return Result.ok(undefined);
  }

  async unfollow(
    accountID: AccountID,
    targetID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const follow = [...this.data].find(
      (f) => f.getFromID() === accountID && f.getTargetID() === targetID,
    );
    if (!follow) {
      return Result.err(new Error('Not found'));
    }

    this.data.delete(follow);
    return Result.ok(undefined);
  }

  async fetchOrderedFollowers(
    accountID: AccountID,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return Result.ok(
      [...this.data]
        .filter((f) => f.getTargetID() === accountID)
        .sort((a, b) => {
          return a.getCreatedAt().getTime() - b.getCreatedAt().getTime();
        })
        .slice(0, limit),
    );
  }

  async fetchOrderedFollowing(
    accountID: AccountID,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    return Result.ok(
      [...this.data]
        .filter((f) => f.getFromID() === accountID)
        .sort((a, b) => {
          return a.getCreatedAt().getTime() - b.getCreatedAt().getTime();
        })
        .slice(0, limit),
    );
  }
}
export const newFollowRepo = (data?: AccountFollow[]) =>
  Ether.newEther(
    followRepoSymbol,
    () => new InMemoryAccountFollowRepository(data),
  );

export class InMemoryInactiveAccountRepository
  implements InactiveAccountRepository
{
  private data: Set<InactiveAccount>;

  constructor() {
    this.data = new Set();
  }

  create(account: InactiveAccount): Promise<Result.Result<Error, void>> {
    this.data.add(account);
    return Promise.resolve(Result.ok(undefined));
  }

  reset(): void {
    this.data.clear();
  }

  findByName(name: string): Promise<Option.Option<InactiveAccount>> {
    const account = Array.from(this.data).find((a) => a.getName() === name);
    if (!account) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(Option.some(account));
  }

  findByMail(mail: string): Promise<Option.Option<InactiveAccount>> {
    const account = Array.from(this.data).find((a) => a.getMail() === mail);
    if (!account) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(account));
  }
}
export const inactiveAccountRepo = Ether.newEther(
  inactiveAccountRepoSymbol,
  () => new InMemoryInactiveAccountRepository(),
);
