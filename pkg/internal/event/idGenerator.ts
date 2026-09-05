import { Result } from '@mikuroxina/mini-fn';

import { SnowflakeIDGenerator } from '../id/mod.ts';
import type { EventID } from './type.ts';

class SystemClock {
  now(): bigint {
    return BigInt(Date.now());
  }
}

// NOTE: Domain events are generated as a side effect of a model operation,
// not injected through the DI container like other IDs, so this module
// keeps a single generator instance (mirrors poporonnet/que's approach).
const generator = new SnowflakeIDGenerator(0, new SystemClock());

/**
 * @description Generates an ID for a domain event.
 * @throws when the underlying Snowflake ID generation fails (clock going
 * backward, or more than 4096 events generated within the same
 * millisecond). This is treated as a near-impossible, unrecoverable
 * condition, so event factories let it throw rather than surfacing it
 * through every model method that generates an event.
 */
export const generateEventID = (): EventID =>
  Result.unwrap(generator.generate<'Event'>());
