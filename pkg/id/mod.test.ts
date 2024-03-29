import { Result } from '@mikuroxina/mini-fn';
import { describe, it, expect } from 'vitest';

import { IDSchema, type Clock, SnowflakeIDGenerator } from './mod.js';

class DummyClock implements Clock {
  now(): bigint {
    return BigInt(new Date('2023/9/10 00:00:00 UTC').getTime());
  }
}

const generator = new SnowflakeIDGenerator(1, new DummyClock());

describe('SnowflakeIDGenerator', () => {
  it('generate id', () => {
    const expected = '223593313075204096';
    const result = generator.generate();

    if (Result.isOk(result)) {
      expect(result[1]).toBe(expected);
    }
    expect(Result.isErr(result)).toBe(false);
  });

  it('generate at the same time but do not output the same ID', () => {
    let oldID = '';
    for (let i = 0; i < 4095; i++) {
      const newID = generator.generate();

      if (Result.isOk(newID)) {
        expect(newID[1]).not.toBe(oldID);
        oldID = newID[1];
      }
      expect(Result.isErr(newID)).toBe(false);
    }

    const res = generator.generate();
    expect(Result.isErr(res)).toBe(true);
  });
});

describe('IDSchema', () => {
  const check = (v: unknown) => IDSchema().safeParse(v).success;

  const SHORTEST = String(1 << 22);

  it('check it is id', () => {
    const generator = new SnowflakeIDGenerator(1, new DummyClock());

    for (let i = 0; i < 64; i++) {
      const id = Result.unwrap(generator.generate());
      expect(check(id)).toBe(true);
    }

    expect(check(SHORTEST)).toBe(true);
    expect(check(`${String((1n << 64n) - 1n)}`)).toBe(true);
  });

  it('check it is not id', () => {
    expect(check('')).toBe(false);
    expect(check('0')).toBe(false);
    expect(check('a')).toBe(false);
    expect(check(`${SHORTEST}a`)).toBe(false);
    expect(check(`a${SHORTEST}`)).toBe(false);
    expect(check(`${String((1n << 65n) - 1n)}`)).toBe(false);
  });
});
