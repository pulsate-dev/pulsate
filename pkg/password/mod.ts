import { hash, verify } from 'argon2';

export type EncodedPassword = string;
const argon2id = 2;

export interface PasswordEncoder {
  EncodePassword(raw: string): Promise<EncodedPassword>;
  IsMatchPassword(raw: string, encoded: EncodedPassword): Promise<boolean>;
}

export class Argon2idPasswordEncoder implements PasswordEncoder {
  async EncodePassword(raw: string) {
    return await hash(raw, {
      type: argon2id,
    });
  }

  async IsMatchPassword(
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
