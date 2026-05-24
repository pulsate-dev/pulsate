import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from './account.js';

export interface AccountFollowConstructorArgs {
  fromID: AccountID;
  targetID: AccountID;
  createdAt: Date;
  deletedAt: Option.Option<Date>;
}
type AccountFollowArgs = Omit<AccountFollowConstructorArgs, 'deletedAt'>;

export class AccountFollowDateInvalidError extends Error {
  override readonly name = 'AccountFollowDateInvalidError' as const;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.cause = options?.cause;
  }
}

/*
 *
 * ID: 1  -follow-> ID: 2
 * => fromID: 1, targetID: 2
 *
 * */
export class AccountFollow {
  readonly #fromID: AccountID;
  readonly #targetID: AccountID;
  readonly #createdAt: Date;
  #deletedAt: Option.Option<Date>;

  private constructor(args: AccountFollowConstructorArgs) {
    this.#fromID = args.fromID;
    this.#targetID = args.targetID;
    this.#createdAt = args.createdAt;
    this.#deletedAt = args.deletedAt;
  }

  public static new(
    args: AccountFollowArgs,
  ): Result.Result<never, AccountFollow> {
    return Result.ok(new AccountFollow({ ...args, deletedAt: Option.none() }));
  }

  public static reconstruct(args: AccountFollowConstructorArgs): AccountFollow {
    return new AccountFollow(args);
  }

  getFromID(): AccountID {
    return this.#fromID;
  }

  getTargetID(): AccountID {
    return this.#targetID;
  }

  getCreatedAt(): Date {
    return this.#createdAt;
  }

  getDeletedAt(): Option.Option<Date> {
    return this.#deletedAt;
  }

  setDeletedAt(
    deletedAt: Date,
  ): Result.Result<AccountFollowDateInvalidError, void> {
    if (this.#createdAt > deletedAt) {
      return Result.err(
        new AccountFollowDateInvalidError(
          'deletedAt must be later than createdAt',
        ),
      );
    }
    this.#deletedAt = Option.some(deletedAt);
    return Result.ok(undefined);
  }
}
