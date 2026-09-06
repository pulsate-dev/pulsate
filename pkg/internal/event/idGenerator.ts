import { SnowflakeIDGenerator } from '../id/mod.ts';

class SystemClock {
  now(): bigint {
    return BigInt(Date.now());
  }
}

export const eventIDGenerator = new SnowflakeIDGenerator(0, new SystemClock());
