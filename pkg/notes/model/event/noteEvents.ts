import type { AccountID } from '../../../accounts/model/account.ts';
import { generateEventID } from '../../../internal/event/idGenerator.ts';
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
  }): NoteCreatedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { authorID: args.authorID, visibility: args.visibility },
    };
  },
  deleted(args: { target: NoteID; actor: AccountID }): NoteDeletedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: {},
    };
  },
  renoted(args: {
    target: NoteID;
    actor: AccountID;
    originalNoteID: NoteID;
  }): NoteRenotedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.renoted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { originalNoteID: args.originalNoteID },
    };
  },
  unrenoted(args: { target: NoteID; actor: AccountID }): NoteUnrenotedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.unrenoted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: {},
    };
  },
};
