import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { type Clock, clockSymbol } from '../../internal/id/mod.ts';
import type { AccountName } from '../model/account.ts';
import {
  AccountMailAddressVerificationTokenInvalidError,
  AccountNotFoundError,
} from '../model/errors.ts';
import {
  type AccountRepository,
  type AccountVerifyTokenRepository,
  accountRepoSymbol,
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
  verifyTokenRepoSymbol,
} from '../model/repository.ts';
import { VerifyToken } from '../model/verifyToken.ts';

export class VerifyAccountTokenService {
  readonly #repository: AccountVerifyTokenRepository;
  readonly #inactiveAccountRepository: InactiveAccountRepository;
  readonly #accountRepository: AccountRepository;
  readonly #clock: Clock;
  constructor(
    repository: AccountVerifyTokenRepository,
    inactiveAccountRepository: InactiveAccountRepository,
    accountRepository: AccountRepository,
    clock: Clock,
  ) {
    this.#repository = repository;
    this.#inactiveAccountRepository = inactiveAccountRepository;
    this.#accountRepository = accountRepository;
    this.#clock = clock;
  }

  async generate(
    accountName: AccountName,
  ): Promise<Result.Result<Error, string>> {
    const monad = Promise.resultMonad<Error>();
    // expireDate: After 7 days
    const expireDate = new Date(
      Number(this.#clock.now()) + 7 * 24 * 60 * 60 * 1000,
    );

    return Cat.doT(monad)
      .addM(
        'account',
        this.#inactiveAccountRepository
          .findByName(accountName)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .addWith('token', ({ account }) =>
        VerifyToken.new(account.getID(), expireDate),
      )
      .runWith(({ token }) =>
        monad.map(() => [])(
          this.#repository.create(
            token.getAccountID(),
            token.getToken(),
            token.getExpire(),
          ),
        ),
      )
      .finish(({ token }) => token.getToken());
  }

  async verify(
    accountName: AccountName,
    token: string,
  ): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'inactiveAccount',
        this.#inactiveAccountRepository
          .findByName(accountName)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .addMWith('verifyToken', ({ inactiveAccount }) =>
        this.#repository
          .findByID(inactiveAccount.getID())
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .when(
        ({ verifyToken }) => verifyToken.isExpired(new Date()),
        () =>
          Promise.resolve(
            Result.err(
              new AccountMailAddressVerificationTokenInvalidError(
                'Token expired',
                { cause: null },
              ),
            ),
          ),
      )
      .when(
        ({ verifyToken }) => !verifyToken.matches(token),
        () =>
          Promise.resolve(
            Result.err(
              new AccountMailAddressVerificationTokenInvalidError(
                'Token not match',
                { cause: null },
              ),
            ),
          ),
      )
      .runWith(({ inactiveAccount }) =>
        monad.map(() => [])(this.#repository.delete(inactiveAccount.getID())),
      )
      .addMWith('account', ({ inactiveAccount }) =>
        Promise.resolve(
          inactiveAccount.activate({
            createdAt: new Date(Number(this.#clock.now())),
          }),
        ),
      )
      .runWith(({ account }) =>
        monad.map(() => [])(this.#accountRepository.create(account)),
      )
      .runWith(({ inactiveAccount }) =>
        monad.map(() => [])(
          this.#inactiveAccountRepository.delete(inactiveAccount.getID()),
        ),
      )
      .finish(() => undefined);
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
