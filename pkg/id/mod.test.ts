import { describe, it, expect} from "vitest";
import { type Clock, SnowflakeIDGenerator } from './mod.js';
import { Result } from '@mikuroxina/mini-fn';

class DummyClock implements Clock {
  Now(): bigint {
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
