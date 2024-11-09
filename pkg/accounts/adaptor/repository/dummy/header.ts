import { Result } from '@mikuroxina/mini-fn';
import { MediaNotFoundError } from '../../../../drive/model/errors.js';
import type { Medium, MediumID } from '../../../../drive/model/medium.js';
import type { AccountID } from '../../../model/account.js';
import { AccountNotFoundError } from '../../../model/errors.js';
import type { AccountHeaderRepository } from '../../../model/repository.js';

export class InMemoryAccountHeaderRepository
  implements AccountHeaderRepository
{
  private media: Map<MediumID, Medium>;
  private data: Map<AccountID, MediumID>;
  constructor(
    media: Medium[] = [],
    accountHeader: { accountID: AccountID; mediumID: MediumID }[] = [],
  ) {
    this.media = new Map(media.map((m) => [m.getId(), m]));
    this.data = new Map(
      accountHeader.map(({ accountID, mediumID }) => [accountID, mediumID]),
    );
  }

  reset(
    media: Medium[] = [],
    accountHeader: { accountID: AccountID; mediumID: MediumID }[] = [],
  ) {
    this.media = new Map(media.map((m) => [m.getId(), m]));
    this.data = new Map(
      accountHeader.map(({ accountID, mediumID }) => [accountID, mediumID]),
    );
  }

  async create(
    accountID: AccountID,
    mediumID: MediumID,
  ): Promise<Result.Result<Error, void>> {
    if (this.data.has(accountID)) {
      // ToDo: Define AccountHeaderAlreadyExistsError
      return Result.err(new Error('Account already exists'));
    }

    this.data.set(accountID, mediumID);

    return Result.ok(undefined);
  }

  async delete(accountID: AccountID): Promise<Result.Result<Error, void>> {
    if (!this.data.has(accountID)) {
      return Result.err(
        new AccountNotFoundError('Account not found', { cause: null }),
      );
    }
    this.data.delete(accountID);
    return Result.ok(undefined);
  }

  async findByID(accountID: AccountID): Promise<Result.Result<Error, Medium>> {
    const mediumID = this.data.get(accountID);
    if (!mediumID) {
      return Result.err(
        new MediaNotFoundError('medium not found', { cause: null }),
      );
    }

    return Result.ok(this.media.get(mediumID) as Medium);
  }
}
