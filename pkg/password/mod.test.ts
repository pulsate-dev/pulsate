import { describe, expect, it } from 'vitest';

import { Argon2idPasswordEncoder, type PasswordEncoder } from './mod.js';

const encoder: PasswordEncoder = new Argon2idPasswordEncoder();
const raw = 'じゃすた・いぐざんぽぅ';

describe('ScryptPasswordEncoder', () => {
  it('verify password with bcrypt', async () => {
    const encoded = await encoder.encodePassword(raw);
    const actual = await encoder.isMatchPassword(raw, encoded);
    expect(actual).toBe(true);
  });

  it('when verify failed, it returns false', async () => {
    const res = await encoder.isMatchPassword(raw, '');
    expect(res).toBe(false);
  });
});
