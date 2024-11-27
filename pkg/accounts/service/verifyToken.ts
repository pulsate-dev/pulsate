import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import { type Clock, clockSymbol } from '../../id/mod.js';
import type { AccountName } from '../model/account.js';
import {
  AccountMailAddressVerificationTokenInvalidError,
  AccountNotFoundError,
} from '../model/errors.js';
import {
  type AccountRepository,
  type AccountVerifyTokenRepository,
  accountRepoSymbol,
  verifyTokenRepoSymbol,
} from '../model/repository.js';

export class VerifyAccountTokenService {
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
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
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
    const accountRes = await this.accountRepository.findByName(accountName);
    if (Option.isNone(accountRes)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const account = Option.unwrap(accountRes);

    const tokenRes = await this.repository.findByID(account.getID());
    if (Option.isNone(tokenRes)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const tokenData = Option.unwrap(tokenRes);

    if (tokenData.expire < new Date()) {
      return Result.err(
        new AccountMailAddressVerificationTokenInvalidError('Token expired', {
          cause: null,
        }),
      );
    }

    if (tokenData.token !== token) {
      return Result.err(
        new AccountMailAddressVerificationTokenInvalidError('Token not match', {
          cause: null,
        }),
      );
    }

    account.activate();
    const editRes = await this.accountRepository.edit(account);
    if (Result.isErr(editRes)) {
      return editRes;
    }

    // tokenを削除する
    const deleteTokenRes = await this.repository.delete(account.getID());
    if (Result.isErr(deleteTokenRes)) {
      return deleteTokenRes;
    }

    return Result.ok(undefined);
  }
}

export const verifyAccountTokenSymbol =
  Ether.newEtherSymbol<VerifyAccountTokenService>();
export const verifyAccountToken = Ether.newEther(
  verifyAccountTokenSymbol,
  ({ verifyTokenRepository, accountRepository, clock }) =>
    new VerifyAccountTokenService(
      verifyTokenRepository,
      accountRepository,
      clock,
    ),
  {
    verifyTokenRepository: verifyTokenRepoSymbol,
    accountRepository: accountRepoSymbol,
    clock: clockSymbol,
  },
);
