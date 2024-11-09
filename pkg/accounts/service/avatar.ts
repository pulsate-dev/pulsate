import { Result } from '@mikuroxina/mini-fn';
import type { Medium, MediumID } from '../../drive/model/medium.js';
import type { MediaModuleFacade } from '../../intermodule/media.js';
import type { AccountID } from '../model/account.js';
import { AccountInsufficientPermissionError } from '../model/errors.js';
import type { AccountAvatarRepository } from '../model/repository.js';

export class AccountAvatarService {
  constructor(
    private readonly avatarRepository: AccountAvatarRepository,
    private readonly mediaModule: MediaModuleFacade,
  ) {}

  /**
   * @description Set account avatar image.
   *
   * avatar specification:
   * - NSFW Media can't be used as avatar image.
   * - Media must be image type(ToDo).
   *
   * @param accountID
   * @param mediumID
   */
  async create(
    accountID: AccountID,
    mediumID: MediumID,
  ): Promise<Result.Result<Error, void>> {
    const mediumRes = await this.mediaModule.fetchMedia(mediumID);
    if (Result.isErr(mediumRes)) {
      return mediumRes;
    }
    const medium = Result.unwrap(mediumRes);
    if (medium.isNsfw()) {
      return Result.err(
        new AccountInsufficientPermissionError(
          "NSFW media can't be used as avatar image",
          { cause: null },
        ),
      );
    }
    // ToDo: Check media type

    const res = await this.avatarRepository.create(accountID, mediumID);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  /**
   * @description Unset account avatar image.
   * @param accountID
   */
  async delete(accountID: AccountID): Promise<Result.Result<Error, void>> {
    const res = await this.avatarRepository.delete(accountID);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  /**
   * @description Fetch account avatar image metadata.
   * @param accountID
   */
  async fetchByAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, Medium>> {
    return await this.avatarRepository.findByID(accountID);
  }
}
