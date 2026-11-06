import { describe, expect, it } from 'vitest';

import { addDuration, addSecondsToDate } from './mod.ts';

describe('addDuration', () => {
  const base = new Date('2024-01-01T00:00:00Z');

  it('adds each unit', () => {
    expect(addDuration(base, { days: 1 })).toStrictEqual(
      new Date('2024-01-02T00:00:00Z'),
    );
    expect(addDuration(base, { hours: 1 })).toStrictEqual(
      new Date('2024-01-01T01:00:00Z'),
    );
    expect(addDuration(base, { minutes: 1 })).toStrictEqual(
      new Date('2024-01-01T00:01:00Z'),
    );
    expect(addDuration(base, { seconds: 1 })).toStrictEqual(
      new Date('2024-01-01T00:00:01Z'),
    );
    expect(addDuration(base, { milliseconds: 1 })).toStrictEqual(
      new Date('2024-01-01T00:00:00.001Z'),
    );
  });

  it('combines units', () => {
    expect(
      addDuration(base, { days: 1, hours: 2, minutes: 3, seconds: 4 }),
    ).toStrictEqual(new Date('2024-01-02T02:03:04Z'));
  });

  it('shifts backward with negative values', () => {
    expect(addDuration(base, { days: -1 })).toStrictEqual(
      new Date('2023-12-31T00:00:00Z'),
    );
  });

  it('does not mutate the given date', () => {
    addDuration(base, { days: 1 });

    expect(base).toStrictEqual(new Date('2024-01-01T00:00:00Z'));
  });
});

describe('addSecondsToDate', () => {
  it('adds seconds', () => {
    expect(
      addSecondsToDate(new Date('2024-01-01T00:00:00Z'), 90),
    ).toStrictEqual(new Date('2024-01-01T00:01:30Z'));
  });
});
