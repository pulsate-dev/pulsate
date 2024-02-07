import { Option, Result } from '@mikuroxina/mini-fn';
import { type Account } from '../model/account.js';
import type { AccountRepository } from '../model/repository.js';

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
}
