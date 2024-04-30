import { Option, Result } from '@mikuroxina/mini-fn';
import { type Account, type AccountID } from '~/accounts/model/account.js';
import type { AccountRepository } from '~/accounts/model/repository.js';
import type { ID } from '~/id/type.js';

export class FetchAccountService {
  private accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async fetchAccount(name: string): Promise<Result.Result<Error, Account>> {
    const res = await this.accountRepository.findByName(name);
    if (Option.isNone(res)) {
      return Result.err(new Error('AccountNotFoundError'));
    }

    try {
      const account = Option.unwrap(res);
      return Result.ok(account);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async fetchAccountByID(
    id: ID<AccountID>,
  ): Promise<Result.Result<Error, Account>> {
    const res = await this.accountRepository.findByID(id);
    return Option.okOr(new Error('AccountNotFoundError'))(res);
  }
}
