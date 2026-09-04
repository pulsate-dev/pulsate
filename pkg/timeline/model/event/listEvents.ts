import type { AccountID } from '../../../accounts/model/account.ts';
import { generateEventID } from '../../../internal/event/idGenerator.ts';
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
  }): ListCreatedEvent {
    return {
      id: generateEventID(),
      eventName: 'list.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { ownerID: args.ownerID, title: args.title },
    };
  },

  deleted(args: { target: ListID; actor: AccountID }): ListDeletedEvent {
    return {
      id: generateEventID(),
      eventName: 'list.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: {},
    };
  },

  memberAppended(args: {
    target: ListID;
    actor: AccountID;
    memberID: AccountID;
  }): ListMemberAppendedEvent {
    return {
      id: generateEventID(),
      eventName: 'list.member.appended' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { memberID: args.memberID },
    };
  },

  memberRemoved(args: {
    target: ListID;
    actor: AccountID;
    memberID: AccountID;
  }): ListMemberRemovedEvent {
    return {
      id: generateEventID(),
      eventName: 'list.member.removed' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { memberID: args.memberID },
    };
  },
};
