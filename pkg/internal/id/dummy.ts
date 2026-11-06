import { OFFSET_FROM_UNIX_EPOCH } from '../time/mod.ts';
import type { ID } from './type.ts';

const TIMESTAMP_SHIFT = 22n;
const MAX_SEQUENCE = 4096;

/**
 * Default creation date of dummy data.
 */
export const DUMMY_BASE_DATE = new Date('2023-09-10T00:00:00Z');

let sequence = 0;

/**
 * Generate a Snowflake ID for dummy data whose timestamp part is `createdAt`,
 * so that sorting dummy data by ID matches sorting by creation date.
 * IDs generated at the same `createdAt` are distinguished by a sequence number.
 */
export const generateDummyID = <T>(createdAt: Date): ID<T> => {
  const timeFromEpoch = BigInt(createdAt.getTime()) - OFFSET_FROM_UNIX_EPOCH;
  if (timeFromEpoch < 0n) {
    throw new Error('createdAt must be later than Pulsate Epoch');
  }

  const id = (timeFromEpoch << TIMESTAMP_SHIFT) | BigInt(sequence);
  sequence = (sequence + 1) % MAX_SEQUENCE;
  return id.toString() as ID<T>;
};
