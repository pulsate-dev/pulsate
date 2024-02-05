import { Option, Result } from '@mikuroxina/mini-fn';

import { type Clock } from '../../id/mod.js';
import { type ID } from '../../id/type.js';
import { type AccountID } from '../model/account.js';
import { type AccountVerifyTokenRepository } from '../model/repository.js';

class DateClock implements Clock {
  Now(): bigint {
    return BigInt(Date.now());
  }
}

export class TokenVerifyService {
  private readonly repository: AccountVerifyTokenRepository;
  private readonly clock: Clock;

  constructor(repository: AccountVerifyTokenRepository, clock?: Clock) {
    this.repository = repository;
    this.clock = clock ?? new DateClock();
  }

  /**
   * Generate a token for account mail address verification.
   * @param accountID
   * @returns if success: void, if failure: Error
   */
  async generate(
    accountID: ID<AccountID>
  ): Promise<Result.Result<Error, string>> {
    const verifyToken = crypto.getRandomValues(new Uint8Array(32));

    // expireDate: After 7 days
    const expireDate = new Date(
      Number(this.clock.Now()) + 7 * 24 * 60 * 60 * 1000
    );

    const encodedToken = Buffer.from(verifyToken).toString('base64');

    const res = await this.repository.create(
      accountID,
      encodedToken,
      expireDate
    );
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    return Result.ok(encodedToken);
  }

  /**
   * Verify a token for account mail address verification.
   * @param accountID
   * @param token
   * @returns if success: void, if failure: Error
   */
  async verify(
    accountID: ID<AccountID>,
    token: string
  ): Promise<Result.Result<Error, void>> {
    const res = await this.repository.findByID(accountID);
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
