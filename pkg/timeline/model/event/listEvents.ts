import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
import type { ListID } from '../list.ts';

export type ListCreatedEvent = DomainEvent<
  ListID,
  'list.created',
  { ownerID: AccountID; title: string },
  AccountID
>;
export type ListDeletedEvent = DomainEvent<
  ListID,
  'list.deleted',
  Record<string, never>,
  AccountID
>;
export type ListMemberAppendedEvent = DomainEvent<
  ListID,
  'list.member.appended',
  { memberID: AccountID },
  AccountID
>;
export type ListMemberRemovedEvent = DomainEvent<
  ListID,
  'list.member.removed',
  { memberID: AccountID },
  AccountID
>;

export type ListEvent =
  | ListCreatedEvent
  | ListDeletedEvent
  | ListMemberAppendedEvent
  | ListMemberRemovedEvent;

export const listEventFactory = {
  created(args: {
    target: ListID;
    actor: AccountID;
    ownerID: AccountID;
    title: string;
    occurredAt?: Date;
  }): ListCreatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'list.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { ownerID: args.ownerID, title: args.title },
    };
  },

  deleted(args: {
    target: ListID;
    actor: AccountID;
    occurredAt?: Date;
  }): ListDeletedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'list.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  memberAppended(args: {
    target: ListID;
    actor: AccountID;
    memberID: AccountID;
    occurredAt?: Date;
  }): ListMemberAppendedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'list.member.appended' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { memberID: args.memberID },
    };
  },

  memberRemoved(args: {
    target: ListID;
    actor: AccountID;
    memberID: AccountID;
    occurredAt?: Date;
  }): ListMemberRemovedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'list.member.removed' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { memberID: args.memberID },
    };
  },
};
