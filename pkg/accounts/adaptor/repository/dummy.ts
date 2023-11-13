import { ID } from '../../../id/type.ts';
import { Account, AccountID } from '../../model/account.ts';
import {
  AccountRepository,
  AccountVerifyTokenRepository,
} from '../../model/repository.ts';
import { Option, Result } from 'mini-fn';

export class InMemoryAccountRepository implements AccountRepository {
  private data: Set<Account>;
  constructor() {
    this.data = new Set();
  }
  create(account: Account): Promise<Result.Result<Error, void>> {
    this.data.add(account);
    return Promise.resolve(Result.ok(undefined));
  }

  findByName(name: string): Promise<Option.Option<Account>> {
    const account = Array.from(this.data).find((a) => a.getName === name);
    if (!account) {
      return Promise.resolve(
        Option.none(),
      );
    }
    return Promise.resolve(Option.some(account));
  }

  findByMail(mail: string): Promise<Option.Option<Account>> {
    const account = Array.from(this.data).find((a) => a.getMail === mail);
    if (!account) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(account));
  }
}

export class InMemoryAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository {
  private data: Map<string, { token: string; expire: Date }>;
  constructor() {
    this.data = new Map();
  }

  create(
    accountID: ID<AccountID>,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>> {
    this.data.set(accountID.toString(), { token, expire });
    return Promise.resolve(Result.ok(undefined));
  }

  findByID(
    id: ID<string>,
  ): Promise<Option.Option<{ token: string; expire: Date }>> {
    const data = this.data.get(id);
    if (!data) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(data));
  }
}
