import { hash, verify } from 'argon2';

export type EncodedPassword = string;
const ARGON2_ID = 2;

export interface PasswordEncoder {
  encodePassword(raw: string): Promise<EncodedPassword>;
  isMatchPassword(raw: string, encoded: EncodedPassword): Promise<boolean>;
}

export class Argon2idPasswordEncoder implements PasswordEncoder {
  async encodePassword(raw: string) {
    return await hash(raw, {
      type: argon2id,
    });
  }

  async isMatchPassword(
    raw: string,
    encoded: EncodedPassword,
  ): Promise<boolean> {
    try {
      return await verify(encoded, raw, { type: 2 });
    } catch {
      return false;
    }
  }
}
