// import { genSalt, hash, verify } from 'scrypt';
import { argon2id, hash, verify } from 'argon2';

export type EncodedPassword = string;

export interface PasswordEncoder {
  EncodePassword(raw: string): Promise<EncodedPassword>;
  IsMatchPassword(raw: string, encoded: EncodedPassword): Promise<boolean>;
}

export class Argon2idPasswordEncoder implements PasswordEncoder {
  async EncodePassword(raw: string) {
    return await hash(raw, {
      type: argon2id
    });
  }

  async IsMatchPassword(
    raw: string,
    encoded: EncodedPassword
  ): Promise<boolean> {
    try {
      return await verify(encoded, raw, { type: argon2id });
    } catch {
      return false;
    }
  }
}
