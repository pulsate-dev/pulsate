import { z } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import { OFFSET_FROM_UNIX_EPOCH } from '../time/mod.js';
import type { ID } from './type.js';

export interface Clock {
  now(): bigint;
}

export class MockClock implements Clock {
  constructor(private readonly time: Date) {}
  now(): bigint {
    return BigInt(this.time.getTime());
  }
}

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

export const IDSchema = <T>() =>
  z
    .string()
    .regex(/^\d+$/)
    .refine((s) => {
      let n;
      try {
        n = BigInt(s);
      } catch {
        return false;
      }

      return (
        n >= 0b1111111111111111111111n &&
        n <= 0b1111111111111111111111111111111111111111111111111111111111111111n
      );
    })
    .transform((s) => s as ID<T>);
