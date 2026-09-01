import type { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { ID } from '../id/type.ts';

// Reuse the existing Snowflake ID scheme (ID<T>). There is no dedicated
// aggregate class for events, so a tag string is used instead to avoid
// mixing this up with other IDs (e.g. ID<Account>).
export type EventID = ID<'Event'>;

/**
 * Common shape shared by every domain event.
 * @typeParam TargetID - the ID of the aggregate this event occurred on (e.g. AccountID)
 * @typeParam EventName - a dot-separated string literal, e.g. "account.registered"
 * @typeParam Payload - event-specific data
 */
export interface DomainEvent<TargetID, EventName extends string, Payload> {
  readonly id: EventID;
  readonly eventName: EventName;
  readonly target: TargetID;
  // Option.none() when the event originates from a system/batch process.
  readonly actor: Option.Option<AccountID>;
  readonly payload: Payload;
  readonly occurredAt: Date;
}
