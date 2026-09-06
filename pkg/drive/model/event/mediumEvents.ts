import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
import type { MediumID } from '../medium.ts';

export type MediumCreatedEvent = DomainEvent<
  MediumID,
  'medium.created',
  { authorID: AccountID },
  AccountID
>;
export type MediumDeletedEvent = DomainEvent<
  MediumID,
  'medium.deleted',
  Record<string, never>,
  AccountID
>;
export type MediumAdminFlaggedEvent = DomainEvent<
  MediumID,
  'medium.admin.flagged',
  Record<string, never>,
  AccountID
>;
export type MediumAdminUnflaggedEvent = DomainEvent<
  MediumID,
  'medium.admin.unflagged',
  Record<string, never>,
  AccountID
>;

export type MediumEvent =
  | MediumCreatedEvent
  | MediumDeletedEvent
  | MediumAdminFlaggedEvent
  | MediumAdminUnflaggedEvent;

export const mediumEventFactory = {
  created(args: {
    target: MediumID;
    actor: AccountID;
    authorID: AccountID;
    occurredAt?: Date;
  }): MediumCreatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'medium.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { authorID: args.authorID },
    };
  },

  deleted(args: {
    target: MediumID;
    actor: AccountID;
    occurredAt?: Date;
  }): MediumDeletedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'medium.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  adminFlagged(args: {
    target: MediumID;
    actor: AccountID;
    occurredAt?: Date;
  }): MediumAdminFlaggedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'medium.admin.flagged' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  adminUnflagged(args: {
    target: MediumID;
    actor: AccountID;
    occurredAt?: Date;
  }): MediumAdminUnflaggedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'medium.admin.unflagged' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },
};
