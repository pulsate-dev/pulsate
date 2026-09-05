import type { AccountID } from '../../../accounts/model/account.ts';
import { generateEventID } from '../../../internal/event/idGenerator.ts';
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
  }): MediumCreatedEvent {
    return {
      id: generateEventID(),
      eventName: 'medium.created' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: { authorID: args.authorID },
    };
  },

  deleted(args: { target: MediumID; actor: AccountID }): MediumDeletedEvent {
    return {
      id: generateEventID(),
      eventName: 'medium.deleted' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: {},
    };
  },

  adminFlagged(args: {
    target: MediumID;
    actor: AccountID;
  }): MediumAdminFlaggedEvent {
    return {
      id: generateEventID(),
      eventName: 'medium.admin.flagged' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: {},
    };
  },

  adminUnflagged(args: {
    target: MediumID;
    actor: AccountID;
  }): MediumAdminUnflaggedEvent {
    return {
      id: generateEventID(),
      eventName: 'medium.admin.unflagged' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: new Date(),
      payload: {},
    };
  },
};
