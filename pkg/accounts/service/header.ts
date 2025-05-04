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
   * - Media author must be actor.
   *
   * @param accountID
   * @param mediumID
   * @param actorID
   */
  async create(
    accountID: AccountID,
    mediumID: MediumID,
    actorID: AccountID,
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

    const isAllowedRes = this.isAllowed('set', actorID, {
      targetAccount: accountID,
      medium,
    });
    if (Result.isErr(isAllowedRes)) {
      return isAllowedRes;
    }

    const res = await this.headerRepository.create(accountID, mediumID);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  /**
   * @description Unset account header image.
   * @param accountID
   * @param actorID
   */
  async delete(
    accountID: AccountID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const isAllowedRes = this.isAllowed('unset', actorID, {
      targetAccount: accountID,
    });
    if (Result.isErr(isAllowedRes)) {
      return isAllowedRes;
    }

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

  async fetchByAccountIDs(
    accountIDs: AccountID[],
  ): Promise<Result.Result<Error, Medium[]>> {
    return await this.headerRepository.findByIDs(accountIDs);
  }

  private isAllowed(
    action: 'set' | 'unset',
    actor: AccountID,
    resources: { targetAccount: AccountID; medium?: Medium },
  ): Result.Result<Error, void> {
    switch (action) {
      case 'set':
        // NOTE: actor must be same as target.
        if (actor !== resources.targetAccount) {
          return Result.err(
            new AccountInsufficientPermissionError(
              'Actor must be same as target',
              { cause: null },
            ),
          );
        }
        // NOTE: media author must be actor.
        if (resources.medium?.getAuthorId() !== actor) {
          return Result.err(
            new AccountInsufficientPermissionError(
              'Media author must be actor',
              { cause: null },
            ),
          );
        }
        return Result.ok(undefined);
      case 'unset':
        // NOTE: actor must be same as target.
        if (actor !== resources.targetAccount) {
          return Result.err(
            new AccountInsufficientPermissionError(
              'Actor must be same as target',
              { cause: null },
            ),
          );
        }

        return Result.ok(undefined);
    }
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
