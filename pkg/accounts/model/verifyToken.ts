import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from './account.js';

export class VerifyTokenEmptyError extends Error {
  override readonly name = 'VerifyTokenEmptyError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

export interface VerifyTokenArgs {
  accountID: AccountID;
  token: string;
  expire: Date;
}

export class VerifyToken {
  readonly #accountID: AccountID;
  readonly #token: string;
  readonly #expire: Date;

  private constructor(args: VerifyTokenArgs) {
    this.#accountID = args.accountID;
    this.#token = args.token;
    this.#expire = args.expire;
  }

  static new(
    args: VerifyTokenArgs,
  ): Result.Result<VerifyTokenEmptyError, VerifyToken> {
    if (args.token.length === 0) {
      return Result.err(new VerifyTokenEmptyError('token must not be empty'));
    }
    return Result.ok(new VerifyToken(args));
  }

  static reconstruct(args: VerifyTokenArgs): VerifyToken {
    return new VerifyToken(args);
  }

  getAccountID(): AccountID {
    return this.#accountID;
  }

  getToken(): string {
    return this.#token;
  }

  getExpire(): Date {
    return this.#expire;
  }

  isExpired(now: Date): boolean {
    return this.#expire < now;
  }

  matches(inputToken: string): boolean {
    return this.#token === inputToken;
  }
}
