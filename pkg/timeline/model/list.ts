import { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.ts';
import type { ID } from '../../internal/id/type.ts';
import {
  ListMemberAlreadyExistsError,
  ListTitleLengthInvalidError,
  ListTooManyMembersError,
} from './errors.ts';
import { type ListEvent, listEventFactory } from './event/listEvents.ts';

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

// ToDo: make this configurable
const MEMBER_LIMIT = 250;

export class List {
  readonly #id: ListID;
  #title: string;
  #publicity: 'PUBLIC' | 'PRIVATE';
  readonly #ownerId: AccountID;
  readonly #memberIds: Set<AccountID>;
  readonly #createdAt: Date;
  #events: ListEvent[] = [];

  private constructor(args: CreateListArgs) {
    this.#id = args.id;
    this.#title = args.title;
    this.#publicity = args.publicity;
    this.#ownerId = args.ownerId;
    this.#memberIds = new Set<AccountID>(args.memberIds);
    this.#createdAt = args.createdAt;
  }

  static new(
    args: CreateListArgs,
    actor: AccountID,
  ): Result.Result<
    ListTitleLengthInvalidError | ListTooManyMembersError,
    List
  > {
    const validationErr = List.#checkArgs(args);
    if (Result.isErr(validationErr)) return validationErr;

    const list = new List(args);
    list.#events.push(
      listEventFactory.created({
        target: args.id,
        actor,
        ownerID: args.ownerId,
        title: args.title,
      }),
    );
    return Result.ok(list);
  }

  static reconstruct(args: CreateListArgs): List {
    const validationErr = List.#checkArgs(args);
    if (Result.isErr(validationErr)) {
      throw Result.unwrapErr(validationErr);
    }
    return new List(args);
  }

  static #checkArgs(
    args: CreateListArgs,
  ): Result.Result<
    ListTitleLengthInvalidError | ListTooManyMembersError,
    void
  > {
    const parsed = v.safeParse(listTitleSchema, args.title);
    if (!parsed.success) {
      return Result.err(
        new ListTitleLengthInvalidError('list title length is invalid', {
          cause: args.title.length,
        }),
      );
    }
    if (args.memberIds.length > MEMBER_LIMIT) {
      return Result.err(
        new ListTooManyMembersError('too many members', { cause: null }),
      );
    }
    return Result.ok(undefined);
  }

  pullEvents(): ListEvent[] {
    return this.#events.splice(0);
  }

  getId(): ListID {
    return this.#id;
  }

  getTitle(): string {
    return this.#title;
  }

  setTitle(title: string): Result.Result<ListTitleLengthInvalidError, void> {
    const parsed = v.safeParse(listTitleSchema, title);
    if (parsed.success) {
      this.#title = title;
      return Result.ok(undefined);
    }
    return Result.err(
      new ListTitleLengthInvalidError('list title length is invalid', {
        cause: title.length,
      }),
    );
  }

  isPublic(): boolean {
    return this.#publicity === 'PUBLIC';
  }

  toPublic(): Result.Result<never, void> {
    this.#publicity = 'PUBLIC';
    return Result.ok(undefined);
  }

  toPrivate(): Result.Result<never, void> {
    this.#publicity = 'PRIVATE';
    return Result.ok(undefined);
  }

  getOwnerId(): AccountID {
    return this.#ownerId;
  }

  getMemberIds(): AccountID[] {
    return [...this.#memberIds];
  }

  getCreatedAt(): Date {
    return this.#createdAt;
  }

  addMember(
    memberId: AccountID,
    actor: AccountID,
  ): Result.Result<
    ListTooManyMembersError | ListMemberAlreadyExistsError,
    void
  > {
    if (this.#memberIds.has(memberId)) {
      return Result.err(
        new ListMemberAlreadyExistsError('member already exists', {
          cause: null,
        }),
      );
    }
    if (this.#memberIds.size >= MEMBER_LIMIT) {
      return Result.err(
        new ListTooManyMembersError('too many members', { cause: null }),
      );
    }

    this.#memberIds.add(memberId);
    this.#events.push(
      listEventFactory.memberAppended({
        target: this.#id,
        actor,
        memberID: memberId,
      }),
    );
    return Result.ok(undefined);
  }

  removeMember(
    memberId: AccountID,
    actor: AccountID,
  ): Result.Result<never, void> {
    this.#memberIds.delete(memberId);
    this.#events.push(
      listEventFactory.memberRemoved({
        target: this.#id,
        actor,
        memberID: memberId,
      }),
    );
    return Result.ok(undefined);
  }
}
