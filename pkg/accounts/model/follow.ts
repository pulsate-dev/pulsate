import { Option, Result } from '@mikuroxina/mini-fn';

import type { EventMeta } from '../../internal/event/type.ts';
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
    meta: EventMeta<AccountID>,
  ): Result.Result<Error, AccountFollow> {
    const requested = followEventFactory.requested(meta.idGenerator, {
      target: args.targetID,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      targetID: args.targetID,
    });
    if (Result.isErr(requested)) {
      return requested;
    }

    const accepted = followEventFactory.accepted(meta.idGenerator, {
      target: args.targetID,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      targetID: args.targetID,
    });
    if (Result.isErr(accepted)) {
      return accepted;
    }

    const follow = new AccountFollow({ ...args, deletedAt: Option.none() });
    follow.#events.push(Result.unwrap(requested), Result.unwrap(accepted));
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
    meta: EventMeta<AccountID>,
  ): Result.Result<AccountFollowDateInvalidError | Error, void> {
    if (this.#createdAt > deletedAt) {
      return Result.err(
        new AccountFollowDateInvalidError(
          'deletedAt must be later than createdAt',
        ),
      );
    }

    const event = followEventFactory.unfollowed(meta.idGenerator, {
      target: this.#targetID,
      actor: meta.actor,
      occurredAt: meta.occurredAt,
      targetID: this.#targetID,
    });
    if (Result.isErr(event)) {
      return event;
    }

    this.#deletedAt = Option.some(deletedAt);
    this.#events.push(Result.unwrap(event));
    return Result.ok(undefined);
  }
}
