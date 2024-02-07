import { Option, Result } from '@mikuroxina/mini-fn';
import { AccountRepository } from '../model/repository.js';
import { Account } from '../model/account.js';

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
