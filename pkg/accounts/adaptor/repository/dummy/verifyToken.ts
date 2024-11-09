import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../model/account.js';
import {
  type AccountVerifyTokenRepository,
  verifyTokenRepoSymbol,
} from '../../../model/repository.js';

export class InMemoryAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository
{
  private data: Map<string, { token: string; expire: Date }>;

  constructor() {
    this.data = new Map();
  }

  create(
    accountID: AccountID,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>> {
    this.data.set(accountID.toString(), { token, expire });
    return Promise.resolve(Result.ok(undefined));
  }

  findByID(
    id: AccountID,
  ): Promise<Option.Option<{ token: string; expire: Date }>> {
    const data = this.data.get(id);
    if (!data) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(data));
  }
}

export const verifyTokenRepo = Ether.newEther(
  verifyTokenRepoSymbol,
  () => new InMemoryAccountVerifyTokenRepository(),
);
