import { type Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
import type { ListID } from '../list.ts';

export type ListCreatedEvent = DomainEvent<
  ListID,
  'list.created',
  { ownerID: AccountID; title: string }
>;
export type ListDeletedEvent = DomainEvent<
  ListID,
  'list.deleted',
  Record<string, never>
>;
export type ListMemberAppendedEvent = DomainEvent<
  ListID,
  'list.member.appended',
  { memberID: AccountID }
>;
export type ListMemberRemovedEvent = DomainEvent<
  ListID,
  'list.member.removed',
  { memberID: AccountID }
>;

export type ListEvent =
  | ListCreatedEvent
  | ListDeletedEvent
  | ListMemberAppendedEvent
  | ListMemberRemovedEvent;

export const listEventFactory = {
  created(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: ListID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      ownerID: AccountID;
      title: string;
    },
  ): Result.Result<Error, ListCreatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'list.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { ownerID: args.ownerID, title: args.title },
    }))(idGenerator.generate<'Event'>());
  },

  deleted(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: ListID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
    },
  ): Result.Result<Error, ListDeletedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'list.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },

  memberAppended(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: ListID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      memberID: AccountID;
    },
  ): Result.Result<Error, ListMemberAppendedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'list.member.appended' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { memberID: args.memberID },
    }))(idGenerator.generate<'Event'>());
  },

  memberRemoved(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: ListID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      memberID: AccountID;
    },
  ): Result.Result<Error, ListMemberRemovedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'list.member.removed' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { memberID: args.memberID },
    }))(idGenerator.generate<'Event'>());
  },
};
