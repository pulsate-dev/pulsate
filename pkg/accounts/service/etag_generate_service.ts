import { Option, Result } from 'mini-fn';
import { encodeHex } from 'std/encoding/hex';
import { AccountRepository } from '../model/repository.ts';
import { Account } from '../model/account.ts';

export class EtagService {
  private repository: AccountRepository;

  constructor(repository: AccountRepository) {
    this.repository = repository;
  }

  async compare(
    name: string,
    etag: string,
  ): Promise<Result.Result<Error, boolean>> {
    const account = await this.repository.findByName(name);
    if (Option.isNone(account)) {
      return Result.err(new Error('account not found'));
    }
    const generatedEtag = await this.generate(account[1]);
    return Result.ok(etag === generatedEtag);
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
