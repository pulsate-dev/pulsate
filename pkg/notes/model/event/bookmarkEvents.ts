import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
import type { NoteID } from '../note.ts';

export type BookmarkCreatedEvent = DomainEvent<
  NoteID,
  'note.bookmark.created',
  { accountID: AccountID },
  AccountID
>;
export type BookmarkDeletedEvent = DomainEvent<
  NoteID,
  'note.bookmark.deleted',
  { accountID: AccountID },
  AccountID
>;

export type BookmarkEvent = BookmarkCreatedEvent | BookmarkDeletedEvent;

export const bookmarkEventFactory = {
  created(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: AccountID;
      occurredAt: Date;
      accountID: AccountID;
    },
  ): Result.Result<Error, BookmarkCreatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.bookmark.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { accountID: args.accountID },
    }))(idGenerator.generate<'Event'>());
  },
  deleted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: AccountID;
      occurredAt: Date;
      accountID: AccountID;
    },
  ): Result.Result<Error, BookmarkDeletedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.bookmark.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { accountID: args.accountID },
    }))(idGenerator.generate<'Event'>());
  },
};
