import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from './account.ts';
import { type FollowEvent, followEventFactory } from './event/followEvents.ts';

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
  #events: FollowEvent[] = [];

  private constructor(args: AccountFollowConstructorArgs) {
    this.#fromID = args.fromID;
    this.#targetID = args.targetID;
    this.#createdAt = args.createdAt;
    this.#deletedAt = args.deletedAt;
  }

  pullEvents(): FollowEvent[] {
    return this.#events.splice(0);
  }

  public static new(
    args: AccountFollowArgs,
  ): Result.Result<never, AccountFollow> {
    const follow = new AccountFollow({ ...args, deletedAt: Option.none() });
    // NOTE: Pulsate does not yet have a locked-account/approval-request flow,
    // so a follow relationship is established immediately. Both the request
    // and its (automatic) acceptance are recorded as domain events.
    follow.#events.push(
      Result.unwrap(
        followEventFactory.requested({
          target: args.targetID,
          actor: args.fromID,
          targetID: args.targetID,
        }),
      ),
      Result.unwrap(
        followEventFactory.accepted({
          target: args.targetID,
          actor: args.targetID,
          targetID: args.targetID,
        }),
      ),
    );
    return Result.ok(follow);
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
    this.#events.push(
      Result.unwrap(
        followEventFactory.unfollowed({
          target: this.#targetID,
          actor: this.#fromID,
          targetID: this.#targetID,
        }),
      ),
    );
    return Result.ok(undefined);
  }
}
