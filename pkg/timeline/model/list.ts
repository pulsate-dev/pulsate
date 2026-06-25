import { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../internal/id/type.js';
import {
  ListMemberAlreadyExistsError,
  ListTitleLengthInvalidError,
  ListTooManyMembersError,
} from './errors.js';

export type ListID = ID<List>;
export type CreateListArgs = Readonly<{
  id: ListID;
  title: string;
  publicity: 'PUBLIC' | 'PRIVATE';
  ownerId: AccountID;
  memberIds: readonly AccountID[];
  createdAt: Date;
}>;

export const listTitleSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(100),
);

export class List {
  // ToDo: make this configurable
  readonly #MEMBER_LIMIT = 250;

  private readonly id: ListID;
  private title: string;
  private publicity: 'PUBLIC' | 'PRIVATE';
  private readonly ownerId: AccountID;
  private readonly memberIds: Set<AccountID>;
  private readonly createdAt: Date;

  private constructor(args: CreateListArgs) {
    this.id = args.id;
    this.title = args.title;
    this.publicity = args.publicity;
    this.ownerId = args.ownerId;
    this.memberIds = new Set<AccountID>(args.memberIds);
    this.createdAt = args.createdAt;
  }

  static new(
    args: CreateListArgs,
  ): Result.Result<ListTitleLengthInvalidError, List> {
    const parsed = v.safeParse(listTitleSchema, args.title);
    if (!parsed.success) {
      return Result.err(
        new ListTitleLengthInvalidError('list title length is invalid', {
          cause: args.title.length,
        }),
      );
    }
    return Result.ok(new List(args));
  }

  static reconstruct(args: CreateListArgs): List {
    return new List(args);
  }

  getId(): ListID {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  setTitle(title: string): Result.Result<ListTitleLengthInvalidError, void> {
    const parsed = v.safeParse(listTitleSchema, title);
    if (parsed.success) {
      this.title = title;
      return Result.ok(undefined);
    }
    return Result.err(
      new ListTitleLengthInvalidError('list title length is invalid', {
        cause: title.length,
      }),
    );
  }

  isPublic(): boolean {
    return this.publicity === 'PUBLIC';
  }

  toPublic(): Result.Result<never, void> {
    this.publicity = 'PUBLIC';
    return Result.ok(undefined);
  }

  toPrivate(): Result.Result<never, void> {
    this.publicity = 'PRIVATE';
    return Result.ok(undefined);
  }

  getOwnerId(): AccountID {
    return this.ownerId;
  }

  getMemberIds(): AccountID[] {
    return [...this.memberIds];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  addMember(
    memberId: AccountID,
  ): Result.Result<
    ListTooManyMembersError | ListMemberAlreadyExistsError,
    void
  > {
    if (this.memberIds.has(memberId)) {
      return Result.err(
        new ListMemberAlreadyExistsError('member already exists', {
          cause: null,
        }),
      );
    }
    if (this.memberIds.size >= this.#MEMBER_LIMIT) {
      return Result.err(
        new ListTooManyMembersError('too many members', { cause: null }),
      );
    }
    this.memberIds.add(memberId);
    return Result.ok(undefined);
  }

  removeMember(memberId: AccountID): void {
    this.memberIds.delete(memberId);
  }
}
