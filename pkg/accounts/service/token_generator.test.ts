import { Option } from 'mini-fn';
import { TokenGenerator } from './token_generator.ts';
import { assertEquals, assertFalse } from 'std/assert';

const generator = await TokenGenerator.new();

Deno.test('verify JWT Token', async () => {
  const token = await generator.generate(
    '',
    new Date(),
    new Date('2099/12/31 12:59:59'),
  );
  if (Option.isNone(token)) {
    return;
  }

  assertEquals(await generator.verify(token[1]), true);
});

Deno.test('if token expired', async () => {
  const expired = await generator.generate(
    '',
    new Date('1970/01/01'),
    new Date('1971/01/01'),
  );
  if (Option.isNone(expired)) return;

  assertFalse(await generator.verify(expired[1]));
});
