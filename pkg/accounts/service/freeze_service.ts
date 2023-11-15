import { Option, Result } from 'mini-fn';
import { AccountRepository } from '../model/repository.ts';

export class FreezeService {
  private readonly accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async setFreeze(accountName: string): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].setFreeze();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }

  async undoFreeze(
    accountName: string,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].setUnfreeze();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }
}
