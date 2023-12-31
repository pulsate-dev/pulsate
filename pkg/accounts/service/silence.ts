import { Option, Result } from 'mini-fn';
import { AccountRepository } from '../model/repository.ts';

export class SilenceService {
  private readonly accountRepository: AccountRepository;

  constructor(accountRepository: AccountRepository) {
    this.accountRepository = accountRepository;
  }

  async setSilence(
    accountName: string,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].setSilence();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }

  async undoSilence(
    accountName: string,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }

    try {
      account[1].undoSilence();
      return Result.ok(true);
    } catch (e) {
      return Result.err(e);
    }
  }
}
