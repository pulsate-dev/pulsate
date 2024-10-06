import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import {
  type PasswordEncoder,
  passwordEncoderSymbol,
} from '../../password/mod.js';
import { addSecondsToDate, convertTo } from '../../time/mod.js';
import type { AccountName } from '../model/account.js';
import {
  AccountAuthenticationFailedError,
  AccountInternalError,
  AccountNotFoundError,
} from '../model/errors.js';
import {
  type AccountRepository,
  accountRepoSymbol,
} from '../model/repository.js';
import {
  type AuthenticationTokenService,
  authenticateTokenSymbol,
} from './authenticationTokenService.js';

export interface TokenPair {
  authorizationToken: string;
  refreshToken: string;
}

export class AuthenticateService {
  private readonly accountRepository: AccountRepository;
  private readonly authenticationTokenService: AuthenticationTokenService;
  private readonly passwordEncoder: PasswordEncoder;

  constructor(args: {
    accountRepository: AccountRepository;
    authenticationTokenService: AuthenticationTokenService;
    passwordEncoder: PasswordEncoder;
  }) {
    this.accountRepository = args.accountRepository;
    this.authenticationTokenService = args.authenticationTokenService;
    this.passwordEncoder = args.passwordEncoder;
  }

  async handle(
    name: AccountName,
    passphrase: string,
  ): Promise<Result.Result<Error, TokenPair>> {
    const account = await this.accountRepository.findByName(name);
    if (Option.isNone(account)) {
      return Result.err(
        new AccountNotFoundError('account not found', { cause: null }),
      );
    }

    const isMatch = await this.passwordEncoder.isMatchPassword(
      passphrase,
      Option.unwrap(account).getPassphraseHash() ?? '',
    );
    if (!isMatch) {
      return Result.err(
        new AccountAuthenticationFailedError('Password is incorrect', {
          cause: null,
        }),
      );
    }

    const authorizationToken = await this.authenticationTokenService.generate(
      Option.unwrap(account).getID(),
      convertTo(new Date()),
      convertTo(addSecondsToDate(new Date(), 900)),
      Option.unwrap(account).getName(),
    );

    if (Option.isNone(authorizationToken)) {
      return Result.err(
        new AccountInternalError('Failed to generate authorization token', {
          cause: null,
        }),
      );
    }

    const refreshToken = await this.authenticationTokenService.generate(
      Option.unwrap(account).getID(),
      convertTo(new Date()),
      convertTo(addSecondsToDate(new Date(), 2_592_000)),
      Option.unwrap(account).getName(),
    );

    if (Option.isNone(refreshToken)) {
      return Result.err(
        new AccountInternalError('Failed to generate refresh token', {
          cause: null,
        }),
      );
    }

    return Result.ok({
      authorizationToken: Option.unwrap(authorizationToken),
      refreshToken: Option.unwrap(refreshToken),
    });
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
