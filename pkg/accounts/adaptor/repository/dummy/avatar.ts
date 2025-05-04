import { Ether, Result } from '@mikuroxina/mini-fn';
import { MediaNotFoundError } from '../../../../drive/model/errors.js';
import type { Medium, MediumID } from '../../../../drive/model/medium.js';
import type { AccountID } from '../../../model/account.js';
import { AccountNotFoundError } from '../../../model/errors.js';
import {
  type AccountAvatarRepository,
  accountAvatarRepoSymbol,
} from '../../../model/repository.js';

export class InMemoryAccountAvatarRepository
  implements AccountAvatarRepository
{
  private media: Map<MediumID, Medium>;
  private data: Map<AccountID, MediumID>;
  constructor(
    media: Medium[] = [],
    accountAvatar: { accountID: AccountID; mediumID: MediumID }[] = [],
  ) {
    this.media = new Map(media.map((m) => [m.getId(), m]));
    this.data = new Map(
      accountAvatar.map(({ accountID, mediumID }) => [accountID, mediumID]),
    );
  }

  reset(
    media: Medium[] = [],
    accountAvatar: { accountID: AccountID; mediumID: MediumID }[] = [],
  ) {
    this.media = new Map(media.map((m) => [m.getId(), m]));
    this.data = new Map(
      accountAvatar.map(({ accountID, mediumID }) => [accountID, mediumID]),
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

  async findByIDs(
    accountIDs: AccountID[],
  ): Promise<Result.Result<Error, Medium[]>> {
    const media = accountIDs.map((accountID) => this.data.get(accountID));
    if (media.some((mediumID) => !mediumID)) {
      return Result.err(
        new MediaNotFoundError('medium not found', { cause: null }),
      );
    }

    return Result.ok(
      media.map((mediumID) => this.media.get(mediumID as MediumID)) as Medium[],
    );
  }
}
export const inMemoryAccountAvatarRepo = (
  media: Medium[],
  accountAvatar: { accountID: AccountID; mediumID: MediumID }[],
) =>
  Ether.newEther(
    accountAvatarRepoSymbol,
    () => new InMemoryAccountAvatarRepository(media, accountAvatar),
  );
