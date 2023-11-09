import {verify, hash, genSalt} from "https://deno.land/x/scrypt@v4.2.1/mod.ts";

export type EncodedPassword = string;

export interface PasswordEncoder {
  EncodePasword(raw: string): EncodedPassword;
  IsMatchPassword(raw: string, encoded: EncodedPassword): boolean;
}

export class ScryptPasswordEncoder implements PasswordEncoder {
  EncodePasword(raw: string) {
    const salt = genSalt(10, "string")
    return hash(raw, {logN: 10,salt});
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
