import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../internal/password/mod.ts';
import {
  AccountAuthenticationFailedError,
  AccountInternalError,
  AccountNotFoundError,
} from '../model/errors.ts';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.ts';
import {
  type AuthenticationToken,
  type AuthenticationTokenService,
  authenticateTokenSymbol,
} from './authenticationTokenService.ts';

export class AuthenticateService {
  readonly #accountRepository: AccountRepository;
  readonly #authenticationTokenService: AuthenticationTokenService;
  readonly #passwordEncoder: PasswordEncoder;

  constructor(args: {
    accountRepository: AccountRepository;
    authenticationTokenService: AuthenticationTokenService;
    passwordEncoder: PasswordEncoder;
  }) {
    this.#accountRepository = args.accountRepository;
    this.#authenticationTokenService = args.authenticationTokenService;
    this.#passwordEncoder = args.passwordEncoder;
  }

  async handle(
    email: string,
    passphrase: string,
  ): Promise<Result.Result<Error, AuthenticationToken>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'account',
        this.#accountRepository
          .findByMail(email)
          .then(
            Option.okOr(
              new AccountNotFoundError('account not found', { cause: null }),
            ),
          ),
      )
      .addMWith('isMatch', ({ account }) =>
        this.#passwordEncoder
          .isMatchPassword(passphrase, account.getPassphraseHash() ?? '')
          .then(Result.ok),
      )
      .when(
        ({ isMatch }) => !isMatch,
        () =>
          Promise.resolve(
            Result.err(
              new AccountAuthenticationFailedError('Password is incorrect', {
                cause: null,
              }),
            ),
          ),
      )
      .addMWith('token', ({ account }) =>
        this.#authenticationTokenService
          .generate(account.getID(), account.getName())
          .then(
            Option.okOr(
              new AccountInternalError(
                'Failed to generate authorization token',
                { cause: null },
              ),
            ),
          ),
      )
      .finish(({ token }) => token);
  }
}

export const authenticateSymbol = Ether.newEtherSymbol<AuthenticateService>();
export const authenticate = Ether.newEther(
  authenticateSymbol,
  (deps) => new AuthenticateService(deps),
  {
    accountRepository: accountRepoSymbol,
    authenticationTokenService: authenticateTokenSymbol,
    passwordEncoder: passwordEncoderSymbol,
  },
);
