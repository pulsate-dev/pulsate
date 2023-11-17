import { encodeHex } from 'std/encoding/hex';
import { Account } from '../model/account.ts';

export class EtagVerifyService {
  async compare(account: Account, etag: string): Promise<boolean> {
    const generated = await this.generate(account);
    return generated === etag;
  }

  async generate(account: Account): Promise<string> {
    const src = `${account.getNickname}:${account.getMail}`;
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(src),
    );
    return encodeHex(digest);
  }
}
