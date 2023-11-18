import { encodeHex } from 'std/encoding/hex';
import { Account } from '../model/account.ts';

export class EtagVerifyService {
  /**
   * Verify Etag with Etag in given account. Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
   * @param account
   * @param etag
   * @returns if success: true, if failure: false
   */
  async Verify(account: Account, etag: string): Promise<boolean> {
    const generated = await this.generate(account);
    return generated === etag;
  }

  /**
   * Generate a 64-character Etag from the given account.
   * @param account
   * @returns Etag
   */
  async generate(account: Account): Promise<string> {
    const src = `${account.getNickname}:${account.getMail}`;
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(src),
    );
    return encodeHex(digest);
  }
}