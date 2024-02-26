import { Option, Result } from '@mikuroxina/mini-fn';

import { type Clock } from '../../id/mod.js';
import { type AccountName } from '../model/account.js';
import {
  type AccountRepository,
  type AccountVerifyTokenRepository,
} from '../model/repository.js';

export class TokenVerifyService {
  constructor(
    private readonly repository: AccountVerifyTokenRepository,
    private readonly accountRepository: AccountRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Generate a token for account mail address verification.
   * @param accountName
   * @returns if success: void, if failure: Error
   */
  async generate(
    accountName: AccountName,
  ): Promise<Result.Result<Error, string>> {
    const verifyToken = crypto.getRandomValues(new Uint8Array(32));

    // expireDate: After 7 days
    const expireDate = new Date(
      Number(this.clock.now()) + 7 * 24 * 60 * 60 * 1000,
    );

    const encodedToken = Buffer.from(verifyToken).toString('base64');

    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('Account not found'));
    }

    const res = await this.repository.create(
      account[1].getID(),
      encodedToken,
      expireDate,
    );
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    return Result.ok(encodedToken);
  }

  /**
   * Verify a token for account mail address verification.
   * @param accountName
   * @param token
   * @returns if success: void, if failure: Error
   */
  async verify(
    accountName: AccountName,
    token: string,
  ): Promise<Result.Result<Error, void>> {
    const account = await this.accountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(new Error('Account not found'));
    }

    const res = await this.repository.findByID(account[1].getID());
    if (Option.isNone(res)) {
      // ToDo(laminne): Consider whether to create an error type (e.g. AccountNotFoundError)
      return Result.err(new Error('Account not found'));
    }

    if (res[1].expire < new Date()) {
      return Result.err(new Error('Token expired'));
    }

    if (res[1].token !== token) {
      return Result.err(new Error('Token not match'));
    }

    return Result.ok(undefined);
  }
}
