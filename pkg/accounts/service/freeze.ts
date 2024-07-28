import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountName } from '../model/account.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';

export class FreezeService {
  private readonly accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async setFreeze(
    accountName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    // ToDo: Check Account role(permission)
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
    // ToDo: Check Account role(permission)
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

export const freezeSymbol = Ether.newEtherSymbol<FreezeService>();
export const freeze = Ether.newEther(
  freezeSymbol,
  ({ accountRepository }) => new FreezeService(accountRepository),
  { accountRepository: accountRepoSymbol },
);
