import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { generateDummyID, generateDummyIDs } from './dummy.ts';
import { compareID, IDSchema, MockClock, SnowflakeIDGenerator } from './mod.ts';

describe('generateDummyID', () => {
  it('has the same bit layout as SnowflakeIDGenerator with worker ID 0', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const generator = new SnowflakeIDGenerator(0, new MockClock(date));
    const snowflake = Result.unwrap(generator.generate<string>());

    const dummy = BigInt(generateDummyID<string>(date));

    expect(dummy >> 22n).toBe(BigInt(snowflake) >> 22n);
  });

  it('is a valid ID', () => {
    const id = generateDummyID<string>(new Date('2024-01-01T00:00:00Z'));

    expect(IDSchema<string>().safeParse(id).success).toBe(true);
  });

  it('does not return the same ID for the same date', () => {
    const date = new Date('2024-01-01T00:00:00Z');

    expect(generateDummyID(date)).not.toBe(generateDummyID(date));
  });

  it('orders IDs by date regardless of generation order', () => {
    const later = generateDummyID<string>(new Date('2024-01-02T00:00:00Z'));
    const earlier = generateDummyID<string>(new Date('2024-01-01T00:00:00Z'));

    expect([earlier, later].sort(compareID)).toStrictEqual([later, earlier]);
  });

  it('rejects dates before Pulsate Epoch', () => {
    expect(() => generateDummyID(new Date('2021-12-31T23:59:59Z'))).toThrow();
  });
});

describe('generateDummyIDs', () => {
  it('returns the given number of IDs', () => {
    expect(generateDummyIDs(3)).toHaveLength(3);
  });

  it('returns distinct IDs', () => {
    const ids = generateDummyIDs(10);

    expect(new Set(ids).size).toBe(10);
  });

  it('uses createdAt for the timestamp of every ID', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const expected = BigInt(generateDummyID(date)) >> 22n;

    for (const id of generateDummyIDs(3, date)) {
      expect(BigInt(id) >> 22n).toBe(expected);
    }
  });
});
