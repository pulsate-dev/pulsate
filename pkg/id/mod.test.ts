import {
  assertEquals,
  assertFalse,
  assertNotEquals,
} from 'https://deno.land/std@0.204.0/assert/mod.ts';
import { Clock, SnowflakeIDGenerator } from './mod.ts';
import { Result } from 'npm:@mikuroxina/mini-fn';

class DummyClock implements Clock {
  Now(): bigint {
    return BigInt(new Date('2023/9/10 00:00:00 UTC').getTime());
  }
}

const generator = new SnowflakeIDGenerator(1, new DummyClock());

Deno.test('generate id', () => {
  const expected = '223593313075204096';
  const result = generator.generate();

  if (Result.isOk(result)) {
    assertEquals(result[1], expected);
  }
  assertFalse(Result.isErr(result));
});

Deno.test('generate at the same time but do not output the same ID', () => {
  let oldID = '';
  for (let i = 0; i < 4095; i++) {
    const newID = generator.generate();

    if (Result.isOk(newID)) {
      assertNotEquals(newID[1], oldID);
      oldID = newID[1];
    }
    assertEquals(Result.isErr(newID), false);
  }

  const res = generator.generate();
  assertEquals(Result.isErr(res), true);
});
