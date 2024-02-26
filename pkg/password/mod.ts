import { hash, verify, argon2id } from 'argon2';

export type EncodedPassword = string;

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
      return await verify(encoded, raw);
    } catch {
      return false;
    }
  }
}
