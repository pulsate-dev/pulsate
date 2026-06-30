import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import { type Clock, clockSymbol } from '../../internal/id/mod.js';
import type { AccountName } from '../model/account.js';
import {
  AccountMailAddressVerificationTokenInvalidError,
  AccountNotFoundError,
} from '../model/errors.js';
import {
  type AccountRepository,
  type AccountVerifyTokenRepository,
  accountRepoSymbol,
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
  verifyTokenRepoSymbol,
} from '../model/repository.js';
import { VerifyToken } from '../model/verifyToken.js';

export class VerifyAccountTokenService {
  constructor(
    private readonly repository: AccountVerifyTokenRepository,
    private readonly inactiveAccountRepository: InactiveAccountRepository,
    private readonly accountRepository: AccountRepository,
    private readonly clock: Clock,
  ) {}

  async generate(
    accountName: AccountName,
  ): Promise<Result.Result<Error, string>> {
    const verifyToken = crypto.getRandomValues(new Uint8Array(32));

    // expireDate: After 7 days
    const expireDate = new Date(
      Number(this.clock.now()) + 7 * 24 * 60 * 60 * 1000,
    );

    const encodedToken = Buffer.from(verifyToken).toString('base64url');

    const account =
      await this.inactiveAccountRepository.findByName(accountName);
    if (Option.isNone(account)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }

    const tokenRes = VerifyToken.new({
      accountID: account[1].getID(),
      token: encodedToken,
      expire: expireDate,
    });
    if (Result.isErr(tokenRes)) {
      return Result.err(tokenRes[1]);
    }
    const token = Result.unwrap(tokenRes);

    const res = await this.repository.create(
      token.getAccountID(),
      token.getToken(),
      token.getExpire(),
    );
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    return Result.ok(token.getToken());
  }

  async verify(
    accountName: AccountName,
    token: string,
  ): Promise<Result.Result<Error, void>> {
    const inactiveAccountRes =
      await this.inactiveAccountRepository.findByName(accountName);
    if (Option.isNone(inactiveAccountRes)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const inactiveAccount = Option.unwrap(inactiveAccountRes);

    const tokenRes = await this.repository.findByID(inactiveAccount.getID());
    if (Option.isNone(tokenRes)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }
    const verifyToken = Option.unwrap(tokenRes);

    if (verifyToken.isExpired(new Date())) {
      return Result.err(
        new AccountMailAddressVerificationTokenInvalidError('Token expired', {
          cause: null,
        }),
      );
    }

    if (!verifyToken.matches(token)) {
      return Result.err(
        new AccountMailAddressVerificationTokenInvalidError('Token not match', {
          cause: null,
        }),
      );
    }

    const deleteTokenRes = await this.repository.delete(
      inactiveAccount.getID(),
    );
    if (Result.isErr(deleteTokenRes)) {
      return deleteTokenRes;
    }

    const activateRes = inactiveAccount.activate({
      createdAt: new Date(Number(this.clock.now())),
    });
    if (Result.isErr(activateRes)) {
      return Result.err(activateRes[1]);
    }
    const account = Result.unwrap(activateRes);

    const createRes = await this.accountRepository.create(account);
    if (Result.isErr(createRes)) {
      return createRes;
    }

    const deleteInactiveRes = await this.inactiveAccountRepository.delete(
      inactiveAccount.getID(),
    );
    if (Result.isErr(deleteInactiveRes)) {
      return deleteInactiveRes;
    }

    return Result.ok(undefined);
  }
}

export const verifyAccountTokenSymbol =
  Ether.newEtherSymbol<VerifyAccountTokenService>();
export const verifyAccountToken = Ether.newEther(
  verifyAccountTokenSymbol,
  ({
    verifyTokenRepository,
    inactiveAccountRepository,
    accountRepository,
    clock,
  }) =>
    new VerifyAccountTokenService(
      verifyTokenRepository,
      inactiveAccountRepository,
      accountRepository,
      clock,
    ),
  {
    verifyTokenRepository: verifyTokenRepoSymbol,
    inactiveAccountRepository: inactiveAccountRepoSymbol,
    accountRepository: accountRepoSymbol,
    clock: clockSymbol,
  },
);
