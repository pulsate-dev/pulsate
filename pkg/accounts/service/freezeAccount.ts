import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountName } from '../model/account.js';
import { type AccountRepository } from '../model/repository.js';

export class FreezeAccountService {
  private readonly accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async setFreeze(
    accountName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].setFreeze();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async undoFreeze(
    accountName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].setUnfreeze();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }
}
