import { type Option, Result } from '@mikuroxina/mini-fn';

import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
import type { AccountID } from '../account.ts';

export type AccountRegisteredEvent = DomainEvent<
  AccountID,
  'account.registered',
  { mail: string }
>;
export type AccountActivatedEvent = DomainEvent<
  AccountID,
  'account.activated',
  Record<string, never>
>;
export type AccountBioUpdatedEvent = DomainEvent<
  AccountID,
  'account.bio.updated',
  { bio: string },
  AccountID
>;
export type AccountNicknameUpdatedEvent = DomainEvent<
  AccountID,
  'account.nickname.updated',
  { nickname: string },
  AccountID
>;
export type AccountEmailUpdatedEvent = DomainEvent<
  AccountID,
  'account.email.updated',
  { mail: string },
  AccountID
>;
export type AccountAdminFrozenEvent = DomainEvent<
  AccountID,
  'account.admin.frozen',
  Record<string, never>,
  AccountID
>;
export type AccountAdminUnfrozenEvent = DomainEvent<
  AccountID,
  'account.admin.unfrozen',
  Record<string, never>,
  AccountID
>;
export type AccountAdminSilencedEvent = DomainEvent<
  AccountID,
  'account.admin.silenced',
  Record<string, never>,
  AccountID
>;
export type AccountAdminUnsilencedEvent = DomainEvent<
  AccountID,
  'account.admin.unsilenced',
  Record<string, never>,
  AccountID
>;

export type AccountEvent =
  | AccountRegisteredEvent
  | AccountActivatedEvent
  | AccountBioUpdatedEvent
  | AccountNicknameUpdatedEvent
  | AccountEmailUpdatedEvent
  | AccountAdminFrozenEvent
  | AccountAdminUnfrozenEvent
  | AccountAdminSilencedEvent
  | AccountAdminUnsilencedEvent;

export const accountEventFactory = {
  registered(args: {
    target: AccountID;
    actor: Option.Option<AccountID>;
    mail: string;
    occurredAt?: Date;
  }): AccountRegisteredEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.registered' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { mail: args.mail },
    };
  },

  activated(args: {
    target: AccountID;
    actor: Option.Option<AccountID>;
    occurredAt?: Date;
  }): AccountActivatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.activated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  bioUpdated(args: {
    target: AccountID;
    actor: AccountID;
    bio: string;
    occurredAt?: Date;
  }): AccountBioUpdatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.bio.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { bio: args.bio },
    };
  },

  nicknameUpdated(args: {
    target: AccountID;
    actor: AccountID;
    nickname: string;
    occurredAt?: Date;
  }): AccountNicknameUpdatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.nickname.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { nickname: args.nickname },
    };
  },

  emailUpdated(args: {
    target: AccountID;
    actor: AccountID;
    mail: string;
    occurredAt?: Date;
  }): AccountEmailUpdatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.email.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { mail: args.mail },
    };
  },

  adminFrozen(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): AccountAdminFrozenEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.admin.frozen' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  adminUnfrozen(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): AccountAdminUnfrozenEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.admin.unfrozen' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  adminSilenced(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): AccountAdminSilencedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.admin.silenced' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },

  adminUnsilenced(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): AccountAdminUnsilencedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.admin.unsilenced' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: {},
    };
  },
};
