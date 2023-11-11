import {
  genSalt,
  hash,
  verify,
} from 'scrypt';

export type EncodedPassword = string;

export interface PasswordEncoder {
  EncodePasword(raw: string): EncodedPassword;
  IsMatchPassword(raw: string, encoded: EncodedPassword): boolean;
}

export class ScryptPasswordEncoder implements PasswordEncoder {
  EncodePasword(raw: string) {
    const salt = genSalt(10, 'string');
    return hash(raw, { logN: 10, salt });
  }

  IsMatchPassword(
    raw: string,
    encoded: EncodedPassword,
  ): boolean {
    try {
      return verify(raw, encoded);
    } catch {
      return false;
    }
  }
}
