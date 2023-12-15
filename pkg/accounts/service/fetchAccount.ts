import { Option, Result } from 'mini-fn';
import { AccountRepository } from '../model/repository.ts';
import { Account } from '../model/account.ts';

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
    const account = Option.unwrap(res);

    try {
      return Result.ok(account);
    } catch (e) {
      return Result.err(e);
    }
  }
}
