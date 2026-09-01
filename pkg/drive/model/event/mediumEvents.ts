import { type Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
import type { MediumID } from '../medium.ts';

export type MediumCreatedEvent = DomainEvent<
  MediumID,
  'medium.created',
  { authorID: AccountID }
>;
export type MediumDeletedEvent = DomainEvent<
  MediumID,
  'medium.deleted',
  Record<string, never>
>;
export type MediumAdminFlaggedEvent = DomainEvent<
  MediumID,
  'medium.admin.flagged',
  Record<string, never>
>;
export type MediumAdminUnflaggedEvent = DomainEvent<
  MediumID,
  'medium.admin.unflagged',
  Record<string, never>
>;

export type MediumEvent =
  | MediumCreatedEvent
  | MediumDeletedEvent
  | MediumAdminFlaggedEvent
  | MediumAdminUnflaggedEvent;

export const mediumEventFactory = {
  created(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: MediumID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      authorID: AccountID;
    },
  ): Result.Result<Error, MediumCreatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'medium.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { authorID: args.authorID },
    }))(idGenerator.generate<'Event'>());
  },

  deleted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: MediumID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
    },
  ): Result.Result<Error, MediumDeletedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'medium.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },

  adminFlagged(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: MediumID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
    },
  ): Result.Result<Error, MediumAdminFlaggedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'medium.admin.flagged' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },

  adminUnflagged(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: MediumID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
    },
  ): Result.Result<Error, MediumAdminUnflaggedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'medium.admin.unflagged' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },
};
