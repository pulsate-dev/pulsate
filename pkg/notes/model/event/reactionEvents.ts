import { type Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
import type { NoteID } from '../note.ts';

export type ReactionCreatedEvent = DomainEvent<
  NoteID,
  'note.reaction.created',
  { accountID: AccountID; emoji: string }
>;
export type ReactionDeletedEvent = DomainEvent<
  NoteID,
  'note.reaction.deleted',
  { accountID: AccountID }
>;

export type ReactionEvent = ReactionCreatedEvent | ReactionDeletedEvent;

export const reactionEventFactory = {
  created(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      accountID: AccountID;
      emoji: string;
    },
  ): Result.Result<Error, ReactionCreatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.reaction.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { accountID: args.accountID, emoji: args.emoji },
    }))(idGenerator.generate<'Event'>());
  },
  deleted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: NoteID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      accountID: AccountID;
    },
  ): Result.Result<Error, ReactionDeletedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'note.reaction.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { accountID: args.accountID },
    }))(idGenerator.generate<'Event'>());
  },
};
