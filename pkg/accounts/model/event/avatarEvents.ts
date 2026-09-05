import { Result } from '@mikuroxina/mini-fn';

import type { MediumID } from '../../../drive/model/medium.ts';
import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent, EventID } from '../../../internal/event/type.ts';
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
  avatarUpdated(args: {
    target: AccountID;
    actor: AccountID;
    mediumID: MediumID;
    occurredAt?: Date;
  }): Result.Result<Error, AccountAvatarUpdatedEvent> {
    return Result.map(
      (id: EventID): AccountAvatarUpdatedEvent => ({
        id,
        eventName: 'account.avatar.updated' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: { mediumID: args.mediumID },
      }),
    )(eventIDGenerator.generate<'Event'>());
  },

  headerUpdated(args: {
    target: AccountID;
    actor: AccountID;
    mediumID: MediumID;
    occurredAt?: Date;
  }): Result.Result<Error, AccountHeaderUpdatedEvent> {
    return Result.map(
      (id: EventID): AccountHeaderUpdatedEvent => ({
        id,
        eventName: 'account.header.updated' as const,
        target: args.target,
        actor: args.actor,
        occurredAt: args.occurredAt ?? new Date(),
        payload: { mediumID: args.mediumID },
      }),
    )(eventIDGenerator.generate<'Event'>());
  },
};
