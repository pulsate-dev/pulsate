import type { AccountID } from '../../../accounts/model/account.ts';
import { generateEventID } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
import type { NoteID } from '../note.ts';

export type ReactionCreatedEvent = DomainEvent<
  NoteID,
  'note.reaction.created',
  { accountID: AccountID; emoji: string },
  AccountID
>;
export type ReactionDeletedEvent = DomainEvent<
  NoteID,
  'note.reaction.deleted',
  { accountID: AccountID },
  AccountID
>;

export type ReactionEvent = ReactionCreatedEvent | ReactionDeletedEvent;

export const reactionEventFactory = {
  created(args: {
    target: NoteID;
    actor: AccountID;
    accountID: AccountID;
    emoji: string;
  }): ReactionCreatedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.reaction.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { accountID: args.accountID, emoji: args.emoji },
    };
  },
  deleted(args: {
    target: NoteID;
    actor: AccountID;
    accountID: AccountID;
  }): ReactionDeletedEvent {
    return {
      id: generateEventID(),
      eventName: 'note.reaction.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { accountID: args.accountID },
    };
  },
};
