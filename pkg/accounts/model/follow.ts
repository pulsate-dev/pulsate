import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from './account.js';

export interface CreateAccountFollowArgs {
  fromID: AccountID;
  targetID: AccountID;
  createdAt: Date;
  deletedAt?: Date;
}

/*
 *
 * ID: 1  -follow-> ID: 2
 * => fromID: 1, targetID: 2
 *
 * */
export class AccountFollow {
  // 必要な情報: フォロー元のアカウントID, フォロー先のアカウントID, created, deleted
  private constructor(args: CreateAccountFollowArgs) {
    this.fromID = args.fromID;
    this.targetID = args.targetID;
    this.createdAt = args.createdAt;
    if (!args.deletedAt) {
      this.deletedAt = Option.none();
      return;
    }

    this.deletedAt = Option.some(args.deletedAt);
  }

  public static new(args: Omit<CreateAccountFollowArgs, 'deletedAt'>) {
    return new AccountFollow({ ...args, deletedAt: undefined });
  }

  public static reconstruct(
    args: CreateAccountFollowArgs,
  ): Result.Result<Error, AccountFollow> {
    if (args.deletedAt && args.createdAt > args.deletedAt) {
      return Result.err(new Error('deletedAt must be later than createdAt'));
    }
    return Result.ok(new AccountFollow(args));
  }

  private readonly fromID: AccountID;

  public getFromID(): AccountID {
    return this.fromID;
  }

  private readonly targetID: AccountID;

  public getTargetID(): AccountID {
    return this.targetID;
  }

  private readonly createdAt: Date;

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  private deletedAt: Option.Option<Date>;

  public getDeletedAt(): Option.Option<Date> {
    return this.deletedAt;
  }

  public setDeletedAt(deletedAt: Date): Result.Result<Error, void> {
    if (this.createdAt > deletedAt) {
      return Result.err(new Error('deletedAt must be later than createdAt'));
    }
    this.deletedAt = Option.some(deletedAt);
    return Result.ok(undefined);
  }
}
