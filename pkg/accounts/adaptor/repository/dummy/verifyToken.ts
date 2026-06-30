import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../model/account.js';
import {
  type AccountVerifyTokenRepository,
  verifyTokenRepoSymbol,
} from '../../../model/repository.js';
import { VerifyToken } from '../../../model/verifyToken.js';

export class InMemoryAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository
{
  private data: Map<string, { token: string; expire: Date }>;

  constructor() {
    this.data = new Map();
  }

  async create(
    accountID: AccountID,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>> {
    this.data.set(accountID.toString(), { token, expire });
    return Result.ok(undefined);
  }

  async findByID(id: AccountID): Promise<Option.Option<VerifyToken>> {
    const data = this.data.get(id);
    if (!data) {
      return Option.none();
    }

    return Option.some(
      VerifyToken.reconstruct({
        accountID: id,
        token: data.token,
        expire: data.expire,
      }),
    );
  }

  async delete(id: AccountID): Promise<Result.Result<Error, void>> {
    this.data.delete(id);
    return Result.ok(undefined);
  }
}

export const verifyTokenRepo = Ether.newEther(
  verifyTokenRepoSymbol,
  () => new InMemoryAccountVerifyTokenRepository(),
);
