import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
import type { NoteID, NoteVisibility } from '../note.ts';

export type NoteCreatedEvent = DomainEvent<
  NoteID,
  'note.created',
  { authorID: AccountID; visibility: NoteVisibility },
  AccountID
>;
export type NoteDeletedEvent = DomainEvent<
  NoteID,
  'note.deleted',
  Record<string, never>,
  AccountID
>;
export type NoteRenotedEvent = DomainEvent<
  NoteID,
  'note.renoted',
  { originalNoteID: NoteID },
  AccountID
>;
export type NoteUnrenotedEvent = DomainEvent<
  NoteID,
  'note.unrenoted',
  Record<string, never>,
  AccountID
>;

export type NoteEvent =
  | NoteCreatedEvent
  | NoteDeletedEvent
  | NoteRenotedEvent
  | NoteUnrenotedEvent;

export const noteEventFactory = {
  created(args: {
    target: NoteID;
    actor: AccountID;
    authorID: AccountID;
    visibility: NoteVisibility;
    occurredAt?: Date;
  }): NoteCreatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'note.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { authorID: args.authorID, visibility: args.visibility },
    };
  },

  deleted(args: {
    target: NoteID;
    actor: AccountID;
    occurredAt?: Date;
  }): NoteDeletedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'note.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  renoted(args: {
    target: NoteID;
    actor: AccountID;
    originalNoteID: NoteID;
    occurredAt?: Date;
  }): NoteRenotedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'note.renoted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { originalNoteID: args.originalNoteID },
    };
  },

  unrenoted(args: {
    target: NoteID;
    actor: AccountID;
    occurredAt?: Date;
  }): NoteUnrenotedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'note.unrenoted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },
};
