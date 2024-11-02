import { z } from '@hono/zod-openapi';
import { Ether, Result } from '@mikuroxina/mini-fn';

import { OFFSET_FROM_UNIX_EPOCH } from '../time/mod.js';
import type { ID } from './type.js';

export interface Clock {
  /** @returns current time in milliseconds from Unix Epoch (1970 Jan 1st 00:00:00.000 UTC) */
  now(): bigint;
}
export const clockSymbol = Ether.newEtherSymbol<Clock>();

export class MockClock implements Clock {
  constructor(private readonly time: Date) {}
  now(): bigint {
    return BigInt(this.time.getTime());
  }
}
export const mockClock = (date: Date) =>
  Ether.newEther(clockSymbol, () => new MockClock(date));

export class SnowflakeIDGenerator {
  private readonly WORKER_ID_BIT_LENGTH = 10n;
  private readonly INCREMENTAL_BIT_LENGTH = 12n;
  private readonly MAX_WORKER_ID = (1n << this.WORKER_ID_BIT_LENGTH) - 1n;
  private readonly MAX_INCREMENTAL = (1n << this.INCREMENTAL_BIT_LENGTH) - 1n;

  private readonly workerID: bigint = 0n;
  private incremental = 0n;
  private lastTimeStamp: bigint;
  private clock: Clock;

  constructor(workerID: number, clock: Clock) {
    if (workerID < 0 || workerID > this.MAX_WORKER_ID) {
      throw new Error(
        `WorkerID must be greater than or equal to 0 and less than or equal to ${this.MAX_WORKER_ID}`,
      );
    }

    this.workerID = BigInt(workerID);
    this.lastTimeStamp = BigInt(Date.now());
    this.clock = clock;
  }

  /**
   * @returns SnowflakeID (string)
   */
  public generate<T>(): Result.Result<Error, ID<T>> {
    const now = this.clock.now();
    const timeFromEpoch = now - OFFSET_FROM_UNIX_EPOCH;
    if (timeFromEpoch < 0) {
      return Result.err(new Error('invalid date'));
    }

    if (this.lastTimeStamp === now) {
      if (this.incremental + 1n > this.MAX_INCREMENTAL) {
        return Result.err(new Error('increment overflow'));
      }
      this.incremental = (this.incremental + 1n) & this.MAX_INCREMENTAL;
    } else {
      this.incremental = 0n;
    }

    this.lastTimeStamp = now;

    const id =
      (timeFromEpoch <<
        (this.WORKER_ID_BIT_LENGTH + this.INCREMENTAL_BIT_LENGTH)) |
      (this.workerID << this.INCREMENTAL_BIT_LENGTH) |
      this.incremental;

    return Result.ok(id.toString() as ID<T>);
  }
}
export const snowflakeIDGeneratorSymbol =
  Ether.newEtherSymbol<SnowflakeIDGenerator>();
export const snowflakeIDGenerator = (workerID: number) =>
  Ether.newEther(
    snowflakeIDGeneratorSymbol,
    ({ clock }) => new SnowflakeIDGenerator(workerID, clock),
    { clock: clockSymbol },
  );

export const IDSchema = <T>() =>
  z
    .string()
    .regex(/^\d+$/)
    .refine((s) => {
      try {
        const n = BigInt(s);

        return (
          n >= 0n &&
          n <=
            0b1111111111111111111111111111111111111111111111111111111111111111n
        );
      } catch {
        return false;
      }
    })
    .transform((s) => s as ID<T>);

/**
 * Compare two IDs (sort in descending order)
 * @param a
 * @param b
 */
export const compareID = <T>(a: ID<T>, b: ID<T>): number =>
  Number(BigInt(b) - BigInt(a));
