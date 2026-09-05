import { Result } from '@mikuroxina/mini-fn';

import type { MediumID } from '../../../drive/model/medium.ts';
import { eventIDGenerator } from '../../../internal/event/idGenerator.ts';
import type { DomainEvent } from '../../../internal/event/type.ts';
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
  }): AccountAvatarUpdatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.avatar.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { mediumID: args.mediumID },
    };
  },

  headerUpdated(args: {
    target: AccountID;
    actor: AccountID;
    mediumID: MediumID;
    occurredAt?: Date;
  }): AccountHeaderUpdatedEvent {
    return {
      id: Result.unwrap(eventIDGenerator.generate<'Event'>()),
      eventName: 'account.header.updated' as const,
      target: args.target,
      actor: args.actor,
      occurredAt: args.occurredAt ?? new Date(),
      payload: { mediumID: args.mediumID },
    };
  },
};
