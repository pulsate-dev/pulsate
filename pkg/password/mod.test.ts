import {Argon2idPasswordEncoder, type PasswordEncoder} from './mod.js';
import {describe, expect, it} from "vitest";

const encoder: PasswordEncoder = new Argon2idPasswordEncoder();
const raw = 'じゃすた・いぐざんぽぅ';

describe('ScryptPasswordEncoder', () => {
  it('verify password with bcrypt', async () => {
    const encoded = await encoder.EncodePassword(raw);
    const actual = await encoder.IsMatchPassword(raw, encoded);
    expect(actual).toBe(true);
  });

  it('when verify failed, it returns false', async () => {
    const res = await encoder.IsMatchPassword(raw, '');
    expect(res).toBe(false);
  });
});
