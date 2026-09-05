import type { AccountID } from '../../../accounts/model/account.ts';
import { generateEventID } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
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
  created(args: {
    target: NoteID;
    actor: AccountID;
    accountID: AccountID;
  }): BookmarkCreatedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.bookmark.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { accountID: args.accountID },
    };
  },
  deleted(args: {
    target: NoteID;
    actor: AccountID;
    accountID: AccountID;
  }): BookmarkDeletedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.bookmark.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { accountID: args.accountID },
    };
  },
};
