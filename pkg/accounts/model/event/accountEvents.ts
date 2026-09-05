import { type Option, Result } from '@mikuroxina/mini-fn';

import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
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
  }): Result.Result<Error, AccountRegisteredEvent> {
    return Result.map(
      (id: EventID): AccountRegisteredEvent => ({
        id,
        eventName: 'account.registered' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: { mail: args.mail },
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  activated(args: {
    target: AccountID;
    actor: Option.Option<AccountID>;
    occurredAt?: Date;
  }): Result.Result<Error, AccountActivatedEvent> {
    return Result.map(
      (id: EventID): AccountActivatedEvent => ({
        id,
        eventName: 'account.activated' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: {},
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  bioUpdated(args: {
    target: AccountID;
    actor: AccountID;
    bio: string;
    occurredAt?: Date;
  }): Result.Result<Error, AccountBioUpdatedEvent> {
    return Result.map(
      (id: EventID): AccountBioUpdatedEvent => ({
        id,
        eventName: 'account.bio.updated' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: { bio: args.bio },
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  nicknameUpdated(args: {
    target: AccountID;
    actor: AccountID;
    nickname: string;
    occurredAt?: Date;
  }): Result.Result<Error, AccountNicknameUpdatedEvent> {
    return Result.map(
      (id: EventID): AccountNicknameUpdatedEvent => ({
        id,
        eventName: 'account.nickname.updated' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: { nickname: args.nickname },
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  emailUpdated(args: {
    target: AccountID;
    actor: AccountID;
    mail: string;
    occurredAt?: Date;
  }): Result.Result<Error, AccountEmailUpdatedEvent> {
    return Result.map(
      (id: EventID): AccountEmailUpdatedEvent => ({
        id,
        eventName: 'account.email.updated' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: { mail: args.mail },
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  adminFrozen(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): Result.Result<Error, AccountAdminFrozenEvent> {
    return Result.map(
      (id: EventID): AccountAdminFrozenEvent => ({
        id,
        eventName: 'account.admin.frozen' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: {},
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  adminUnfrozen(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): Result.Result<Error, AccountAdminUnfrozenEvent> {
    return Result.map(
      (id: EventID): AccountAdminUnfrozenEvent => ({
        id,
        eventName: 'account.admin.unfrozen' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: {},
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  adminSilenced(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): Result.Result<Error, AccountAdminSilencedEvent> {
    return Result.map(
      (id: EventID): AccountAdminSilencedEvent => ({
        id,
        eventName: 'account.admin.silenced' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: {},
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  adminUnsilenced(args: {
    target: AccountID;
    actor: AccountID;
    occurredAt?: Date;
  }): Result.Result<Error, AccountAdminUnsilencedEvent> {
    return Result.map(
      (id: EventID): AccountAdminUnsilencedEvent => ({
        id,
        eventName: 'account.admin.unsilenced' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: {},
      }),
    )(eventIDGenerator.generate<'Event'>());
  },
};
