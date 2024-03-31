import { Option, Result } from '@mikuroxina/mini-fn';

import type { PasswordEncoder } from '../../password/mod.js';
import { addSecondsToDate, convertTo } from '../../time/mod.js';
import type { AccountName } from '../model/account.js';
import type { AccountRepository } from '../model/repository.js';
import type { TokenGenerator } from './tokenGenerator.js';

export interface TokenPair {
  authorizationToken: string;
  refreshToken: string;
}

export class AuthenticateAccountService {
  private readonly accountRepository: AccountRepository;
  private readonly tokenGenerator: TokenGenerator;
  private readonly passwordEncoder: PasswordEncoder;

  constructor(args: {
    accountRepository: AccountRepository;
    tokenGenerator: TokenGenerator;
    passwordEncoder: PasswordEncoder;
  }) {
    this.accountRepository = args.accountRepository;
    this.tokenGenerator = args.tokenGenerator;
    this.passwordEncoder = args.passwordEncoder;
  }

  async handle(
    name: AccountName,
    passphrase: string,
  ): Promise<Result.Result<Error, TokenPair>> {
    const account = await this.accountRepository.findByName(name);
    if (Option.isNone(account)) {
      return Result.err(new Error('Account not found'));
    }

    const isMatch = await this.passwordEncoder.isMatchPassword(
      passphrase,
      Option.unwrap(account).getPassphraseHash() ?? '',
    );
    if (!isMatch) {
      return Result.err(new Error('Password is incorrect'));
    }

    const authorizationToken = await this.tokenGenerator.generate(
      Option.unwrap(account).getName(),
      convertTo(new Date()),
      convertTo(addSecondsToDate(new Date(), 900)),
    );

    if (Option.isNone(authorizationToken)) {
      return Result.err(new Error('Failed to generate authorization token'));
    }

    const refreshToken = await this.tokenGenerator.generate(
      Option.unwrap(account).getName(),
      convertTo(new Date()),
      convertTo(addSecondsToDate(new Date(), 2_592_000)),
    );

    if (Option.isNone(refreshToken)) {
      return Result.err(new Error('Failed to generate refresh token'));
    }

    return Result.ok({
      authorizationToken: Option.unwrap(authorizationToken),
      refreshToken: Option.unwrap(refreshToken),
    });
  }
}
