import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { Account, AccountID } from '../../../model/account.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../../../model/repository.js';

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
