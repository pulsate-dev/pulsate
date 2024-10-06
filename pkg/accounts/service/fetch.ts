import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';

export class FetchService {
  private accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async fetchAccount(name: string): Promise<Result.Result<Error, Account>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }

    try {
      const account = Option.unwrap(res);
      return Result.ok(account);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async fetchAccountByID(
    id: AccountID,
  ): Promise<Result.Result<Error, Account>> {
    const res = await this.accountRepository.findByID(id);
    return Option.okOr(
      new AccountNotFoundError('account not found', { cause: null }),
    )(res);
  }

  async fetchManyAccountsByID(
    id: AccountID[],
  ): Promise<Result.Result<Error, Account[]>> {
    return await this.accountRepository.findManyByID(id);
  }
}

export const fetchSymbol = Ether.newEtherSymbol<FetchService>();
export const fetch = Ether.newEther(
  fetchSymbol,
  ({ accountRepository }) => new FetchService(accountRepository),
  { accountRepository: accountRepoSymbol },
);
