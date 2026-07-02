import type { AccountID } from './account.js';

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

  static reconstruct(args: VerifyTokenArgs): VerifyToken {
    return new VerifyToken(args);
  }

  static new(accountID: AccountID, expire: Date): VerifyToken {
    const randomBytes = crypto.getRandomValues(new Uint8Array(6));
    const token = Array.from(randomBytes, (byte) =>
      (byte % 10).toString(),
    ).join('');

    return new VerifyToken({ accountID, token, expire });
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
