import { Ether, Result } from '@mikuroxina/mini-fn';
import type { Medium, MediumID } from '../../drive/model/medium.js';
import {
  type MediaModuleFacade,
  mediaModuleFacadeSymbol,
} from '../../intermodule/media.js';
import type { AccountID } from '../model/account.js';
import { AccountInsufficientPermissionError } from '../model/errors.js';
import {
  type AccountHeaderRepository,
  accountHeaderRepoSymbol,
} from '../model/repository.js';

export class AccountHeaderService {
  constructor(
    private readonly headerRepository: AccountHeaderRepository,
    private readonly mediaModule: MediaModuleFacade,
  ) {}

  /**
   * @description Set account header image.
   *
   * header specification:
   * - NSFW Media can't be used as header image.
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
          "NSFW media can't be used as header image",
          { cause: null },
        ),
      );
    }
    // ToDo: Check media type

    const res = await this.headerRepository.create(accountID, mediumID);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  /**
   * @description Unset account header image.
   * @param accountID
   */
  async delete(accountID: AccountID): Promise<Result.Result<Error, void>> {
    const res = await this.headerRepository.delete(accountID);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  /**
   * @description Fetch account header image metadata.
   * @param accountID
   */
  async fetchByAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, Medium>> {
    return await this.headerRepository.findByID(accountID);
  }
}
export const accountHeaderSymbol = Ether.newEtherSymbol<AccountHeaderService>();
export const accountHeader = Ether.newEther(
  accountHeaderSymbol,
  ({ mediaModule, headerRepository }) =>
    new AccountHeaderService(headerRepository, mediaModule),
  {
    mediaModule: mediaModuleFacadeSymbol,
    headerRepository: accountHeaderRepoSymbol,
  },
);
