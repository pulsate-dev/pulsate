import { PasswordEncoder, ScryptPasswordEncoder } from './mod.ts';
import { assertEquals } from 'std/assert';

const encoder: PasswordEncoder = new ScryptPasswordEncoder();
const raw = 'じゃすた・いぐざんぽぅ';

Deno.test('verify password with bcrypt', async () => {
  const encoded = await encoder.EncodePasword(raw);
  console.log(encoded);
  const actual = await encoder.IsMatchPassword(raw, encoded);
  assertEquals(actual, true);
});

Deno.test('when verify failed, it returns false', () => {
  const res = encoder.IsMatchPassword(raw, '');
  assertEquals(res, false);
});
