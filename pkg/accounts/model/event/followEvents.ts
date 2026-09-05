import { Result } from '@mikuroxina/mini-fn';

import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
import type { AccountID } from '../account.ts';

export type AccountFollowRequestedEvent = DomainEvent<
  AccountID,
  'account.follow.requested',
  { targetID: AccountID },
  AccountID
>;
export type AccountFollowAcceptedEvent = DomainEvent<
  AccountID,
  'account.follow.accepted',
  { targetID: AccountID },
  AccountID
>;
export type AccountFollowRejectedEvent = DomainEvent<
  AccountID,
  'account.follow.rejected',
  { targetID: AccountID },
  AccountID
>;
export type AccountFollowUnfollowedEvent = DomainEvent<
  AccountID,
  'account.follow.unfollowed',
  { targetID: AccountID },
  AccountID
>;
export type AccountFollowBlockedEvent = DomainEvent<
  AccountID,
  'account.follow.blocked',
  { targetID: AccountID },
  AccountID
>;
export type AccountFollowUnblockedEvent = DomainEvent<
  AccountID,
  'account.follow.unblocked',
  { targetID: AccountID },
  AccountID
>;

export type FollowEvent =
  | AccountFollowRequestedEvent
  | AccountFollowAcceptedEvent
  | AccountFollowRejectedEvent
  | AccountFollowUnfollowedEvent
  | AccountFollowBlockedEvent
  | AccountFollowUnblockedEvent;

export const followEventFactory = {
  requested(args: {
    target: AccountID;
    actor: AccountID;
    targetID: AccountID;
  }): AccountFollowRequestedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.follow.requested' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { targetID: args.targetID },
    };
  },

  accepted(args: {
    target: AccountID;
    actor: AccountID;
    targetID: AccountID;
  }): AccountFollowAcceptedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.follow.accepted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { targetID: args.targetID },
    };
  },

  rejected(args: {
    target: AccountID;
    actor: AccountID;
    targetID: AccountID;
  }): AccountFollowRejectedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.follow.rejected' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { targetID: args.targetID },
    };
  },

  unfollowed(args: {
    target: AccountID;
    actor: AccountID;
    targetID: AccountID;
  }): AccountFollowUnfollowedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.follow.unfollowed' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { targetID: args.targetID },
    };
  },

  blocked(args: {
    target: AccountID;
    actor: AccountID;
    targetID: AccountID;
  }): AccountFollowBlockedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.follow.blocked' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { targetID: args.targetID },
    };
  },

  unblocked(args: {
    target: AccountID;
    actor: AccountID;
    targetID: AccountID;
  }): AccountFollowUnblockedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.follow.unblocked' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { targetID: args.targetID },
    };
  },
};
