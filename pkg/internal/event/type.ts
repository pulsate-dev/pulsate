import type { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { ID } from '../id/type.ts';

export type EventID = ID<'Event'>;

export interface DomainEvent<TargetID, EventName extends string, Payload> {
  readonly id: EventID;
  readonly eventName: EventName;
  readonly target: TargetID;
  readonly actor: Option.Option<AccountID>;
  readonly payload: Payload;
  readonly occurredAt: Date;
}
