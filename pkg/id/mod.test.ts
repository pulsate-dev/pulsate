import { assertEquals } from 'https://deno.land/std@0.204.0/assert/mod.ts';
import { assertNotEquals } from 'https://deno.land/std@0.204.0/assert/assert_not_equals.ts';
import { assertThrows } from 'https://deno.land/std@0.204.0/assert/assert_throws.ts';
import { SnowflakeIDGenerator } from './mod.ts';

const generator = new SnowflakeIDGenerator(1);

Deno.test('generate id', () => {
  const expected = '223593313075204096';
  const actual = generator.generate(
    BigInt(new Date('2023/9/10 00:00:00 UTC').getTime()),
  );

  assertEquals(actual, expected);
});

Deno.test('generate at the same time but do not output the same ID', () => {
  let oldID = '';
  for (let i = 0; i < 4096; i++) {
    const newID = generator.generate(
      BigInt(new Date('2023/9/10 00:00:00 UTC').getTime()),
    );
    assertNotEquals(newID, oldID);
    oldID = newID;
  }

  assertThrows(() => {
    generator.generate(
      BigInt(new Date('2023/9/10 00:00:00 UTC').getTime()),
    );
  });
});
