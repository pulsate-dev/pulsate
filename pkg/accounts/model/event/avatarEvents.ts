import { Result } from '@mikuroxina/mini-fn';

import type { MediumID } from '../../../drive/model/medium.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
import type { SnowflakeIDGenerator } from '../../../internal/id/mod.ts';
import type { AccountID } from '../account.ts';

export type AccountAvatarUpdatedEvent = DomainEvent<
  AccountID,
  'account.avatar.updated',
  { mediumID: MediumID },
  AccountID
>;
export type AccountHeaderUpdatedEvent = DomainEvent<
  AccountID,
  'account.header.updated',
  { mediumID: MediumID },
  AccountID
>;

export type AvatarEvent = AccountAvatarUpdatedEvent | AccountHeaderUpdatedEvent;

export const avatarEventFactory = {
  avatarUpdated(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
      mediumID: MediumID;
    },
  ): Result.Result<Error, AccountAvatarUpdatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.avatar.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { mediumID: args.mediumID },
    }))(idGenerator.generate<'Event'>());
  },

  headerUpdated(
    idGenerator: SnowflakeIDGenerator,
    args: {
      target: AccountID;
      actor: AccountID;
      occurredAt: Date;
      mediumID: MediumID;
    },
  ): Result.Result<Error, AccountHeaderUpdatedEvent> {
    return Result.map((id: EventID) => ({
      id,
      eventName: 'account.header.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt,
      payload: { mediumID: args.mediumID },
    }))(idGenerator.generate<'Event'>());
  },
};
