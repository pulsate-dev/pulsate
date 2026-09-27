import type { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { ID } from '../id/type.ts';

export type EventID = ID<'Event'>;

/** Represents a domain event emitted by an application feature. */
export interface DomainEvent<
  TargetID,
  EventName extends string,
  Payload,
  Actor = Option.Option<AccountID>,
> {
  readonly id: EventID;
  readonly eventName: EventName;
  readonly target: TargetID;
  readonly actor: Actor;
  readonly payload: Payload;
  readonly occurredAt: Date;
}

/** A domain event accepted by an event publisher. */
export type AnyDomainEvent = DomainEvent<unknown, string, unknown, unknown>;
