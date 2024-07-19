import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountName } from '../model/account.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';

export class SilenceService {
  private readonly accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async setSilence(
    accountName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].setSilence();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async undoSilence(
    accountName: AccountName,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].undoSilence();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }
}

export const silenceSymbol = Ether.newEtherSymbol<SilenceService>();
export const silence = Ether.newEther(
  silenceSymbol,
  ({ accountRepository }) => new SilenceService(accountRepository),
  { accountRepository: accountRepoSymbol },
);
