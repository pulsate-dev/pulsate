import { Option } from '@mikuroxina/mini-fn';

import type { ID } from '../../id/type.js';
import type { AccountID } from './account.js';

export interface CreateAccountFollowArgs {
  fromID: ID<AccountID>;
  targetID: ID<AccountID>;
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
    if (args.deletedAt > args.createdAt) {
      throw new Error('deletedAt must be later than createdAt');
    }

    this.deletedAt = Option.some(args.deletedAt);
  }

  public static new(args: Omit<CreateAccountFollowArgs, 'deletedAt'>) {
    return new AccountFollow({ ...args, deletedAt: undefined });
  }

  public static reconstruct(args: CreateAccountFollowArgs) {
    return new AccountFollow(args);
  }

  private readonly fromID: ID<AccountID>;

  getFromID(): ID<AccountID> {
    return this.fromID;
  }

  private readonly targetID: ID<AccountID>;

  get getTargetID(): ID<AccountID> {
    return this.targetID;
  }

  private readonly createdAt: Date;

  get getCreatedAt(): Date {
    return this.createdAt;
  }

  private deletedAt: Option.Option<Date>;

  get getDeletedAt(): Option.Option<Date> {
    return this.deletedAt;
  }

  public setDeletedAt(deletedAt: Date) {
    if (this.createdAt > deletedAt) {
      throw new Error('deletedAt must be later than createdAt');
    }
    this.deletedAt = Option.some(deletedAt);
  }
}
