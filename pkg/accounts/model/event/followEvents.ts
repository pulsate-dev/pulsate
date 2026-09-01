import { type Option, Result } from '@mikuroxina/mini-fn';

import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
import type { AccountID } from '../account.ts';

export type AccountFollowRequestedEvent = DomainEvent<
  AccountID,
  'account.follow.requested',
  { targetID: AccountID }
>;
export type AccountFollowAcceptedEvent = DomainEvent<
  AccountID,
  'account.follow.accepted',
  { targetID: AccountID }
>;
export type AccountFollowRejectedEvent = DomainEvent<
  AccountID,
  'account.follow.rejected',
  { targetID: AccountID }
>;
export type AccountFollowUnfollowedEvent = DomainEvent<
  AccountID,
  'account.follow.unfollowed',
  { targetID: AccountID }
>;
export type AccountFollowBlockedEvent = DomainEvent<
  AccountID,
  'account.follow.blocked',
  { targetID: AccountID }
>;
export type AccountFollowUnblockedEvent = DomainEvent<
  AccountID,
  'account.follow.unblocked',
  { targetID: AccountID }
>;

export type FollowEvent =
  | AccountFollowRequestedEvent
  | AccountFollowAcceptedEvent
  | AccountFollowRejectedEvent
  | AccountFollowUnfollowedEvent
  | AccountFollowBlockedEvent
  | AccountFollowUnblockedEvent;

export const followEventFactory = {
  requested(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      targetID: AccountID;
    },
  ): Result.Result<Error, AccountFollowRequestedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.follow.requested' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { targetID: args.targetID },
    }))(idGenerator.generate<'Event'>());
  },

  accepted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      targetID: AccountID;
    },
  ): Result.Result<Error, AccountFollowAcceptedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.follow.accepted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { targetID: args.targetID },
    }))(idGenerator.generate<'Event'>());
  },

  rejected(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      targetID: AccountID;
    },
  ): Result.Result<Error, AccountFollowRejectedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.follow.rejected' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { targetID: args.targetID },
    }))(idGenerator.generate<'Event'>());
  },

  unfollowed(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      targetID: AccountID;
    },
  ): Result.Result<Error, AccountFollowUnfollowedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.follow.unfollowed' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { targetID: args.targetID },
    }))(idGenerator.generate<'Event'>());
  },

  blocked(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      targetID: AccountID;
    },
  ): Result.Result<Error, AccountFollowBlockedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.follow.blocked' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { targetID: args.targetID },
    }))(idGenerator.generate<'Event'>());
  },

  unblocked(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      targetID: AccountID;
    },
  ): Result.Result<Error, AccountFollowUnblockedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.follow.unblocked' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { targetID: args.targetID },
    }))(idGenerator.generate<'Event'>());
  },
};
