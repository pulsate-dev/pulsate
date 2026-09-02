import { type Option, Result } from '@mikuroxina/mini-fn';

import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
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
  registered(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
      mail: string;
    },
  ): Result.Result<Error, AccountRegisteredEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.registered' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { mail: args.mail },
    }))(idGenerator.generate<'Event'>());
  },

  activated(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: Option.Option<AccountID>;
      occurredAt: Date;
    },
  ): Result.Result<Error, AccountActivatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.activated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },

  bioUpdated(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
      bio: string;
    },
  ): Result.Result<Error, AccountBioUpdatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.bio.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { bio: args.bio },
    }))(idGenerator.generate<'Event'>());
  },

  nicknameUpdated(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
      nickname: string;
    },
  ): Result.Result<Error, AccountNicknameUpdatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.nickname.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { nickname: args.nickname },
    }))(idGenerator.generate<'Event'>());
  },

  emailUpdated(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
      mail: string;
    },
  ): Result.Result<Error, AccountEmailUpdatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.email.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { mail: args.mail },
    }))(idGenerator.generate<'Event'>());
  },

  adminFrozen(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
    },
  ): Result.Result<Error, AccountAdminFrozenEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.admin.frozen' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },

  adminUnfrozen(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
    },
  ): Result.Result<Error, AccountAdminUnfrozenEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.admin.unfrozen' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },

  adminSilenced(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
    },
  ): Result.Result<Error, AccountAdminSilencedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.admin.silenced' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },

  adminUnsilenced(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
    },
  ): Result.Result<Error, AccountAdminUnsilencedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.admin.unsilenced' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: {},
    }))(idGenerator.generate<'Event'>());
  },
};
