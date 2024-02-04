import { Result } from '@mikuroxina/mini-fn';
import type { ID } from './type.ts';

export interface Clock {
  Now(): bigint;
}

export class SnowflakeIDGenerator {
  /**
   * Pulsate Epoch 2022 January 1st 00:00:0.000UTC
   */
  private readonly EPOCH = 1640995200000n;
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
    const time = this.clock.Now();
    const timeFromEpoch = time - this.EPOCH;
    if (timeFromEpoch < 0) {
      return Result.err(new Error('invalid date'));
    }

    if (this.lastTimeStamp === time) {
      if ((this.incremental + 1n) > this.MAX_INCREMENTAL) {
        return Result.err(new Error('increment overflow'));
      }
      this.incremental = (this.incremental + 1n) & this.MAX_INCREMENTAL;
    } else {
      this.incremental = 0n;
    }

    this.lastTimeStamp = time;

    const id = timeFromEpoch <<
        (this.WORKER_ID_BIT_LENGTH + this.INCREMENTAL_BIT_LENGTH) |
      this.workerID << this.INCREMENTAL_BIT_LENGTH |
      this.incremental;

    return Result.ok(id.toString() as ID<T>);
  }
}
