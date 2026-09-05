import type { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { SnowflakeIDGenerator } from '../id/mod.ts';
import type { ID } from '../id/type.ts';

export type EventID = ID<'Event'>;

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

/**
 * A model's state-changing method takes this as its trailing argument to
 * generate the corresponding domain event. `Actor` is `AccountID` for
 * user-initiated operations, `Option.Option<AccountID>` when the operation
 * may originate from the system/batch processing (see DomainEvent).
 */
export interface EventMeta<Actor> {
  readonly idGenerator: SnowflakeIDGenerator;
  readonly actor: Actor;
  readonly occurredAt: Date;
}
