import { type Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
import type { NoteID, NoteVisibility } from '../note.ts';

export type NoteCreatedEvent = DomainEvent<
  NoteID,
  'note.created',
  { authorID: AccountID; visibility: NoteVisibility }
>;
export type NoteDeletedEvent = DomainEvent<
  NoteID,
  'note.deleted',
  Record<string, never>
>;
export type NoteRenotedEvent = DomainEvent<
  NoteID,
  'note.renoted',
  { originalNoteID: NoteID }
>;
export type NoteUnrenotedEvent = DomainEvent<
  NoteID,
  'note.unrenoted',
  Record<string, never>
>;

export type NoteEvent =
  | NoteCreatedEvent
  | NoteDeletedEvent
  | NoteRenotedEvent
  | NoteUnrenotedEvent;

export const noteEventFactory = {
  created(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      authorID: AccountID;
      visibility: NoteVisibility;
    },
  ): Result.Result<Error, NoteCreatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { authorID: args.authorID, visibility: args.visibility },
    }))(idGenerator.generate<'Event'>());
  },
  deleted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
    },
  ): Result.Result<Error, NoteDeletedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },
  renoted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      originalNoteID: NoteID;
    },
  ): Result.Result<Error, NoteRenotedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.renoted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { originalNoteID: args.originalNoteID },
    }))(idGenerator.generate<'Event'>());
  },
  unrenoted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
    },
  ): Result.Result<Error, NoteUnrenotedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.unrenoted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },
};
