import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
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
  readonly #headerRepository: AccountHeaderRepository;
  readonly #mediaModule: MediaModuleFacade;
  constructor(
    headerRepository: AccountHeaderRepository,
    mediaModule: MediaModuleFacade,
  ) {
    this.#headerRepository = headerRepository;
    this.#mediaModule = mediaModule;
  }

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
    const monad = Promise.resultMonad<Error>();

    // ToDo: Check media type
    return Cat.doT(monad)
      .addM('medium', this.#mediaModule.fetchMedia(mediumID))
      .when(
        ({ medium }) => medium.isNsfw(),
        () =>
          Promise.resolve(
            Result.err(
              new AccountInsufficientPermissionError(
                "NSFW media can't be used as header image",
                { cause: null },
              ),
            ),
          ),
      )
      .runWith(({ medium }) =>
        monad.map(() => [])(
          Promise.resolve(
            this.isAllowed('set', actorID, {
              targetAccount: accountID,
              medium,
            }),
          ),
        ),
      )
      .runWith(() =>
        monad.map(() => [])(this.#headerRepository.create(accountID, mediumID)),
      )
      .finish(() => undefined);
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
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .runWith(() =>
        monad.map(() => [])(
          Promise.resolve(
            this.isAllowed('unset', actorID, { targetAccount: accountID }),
          ),
        ),
      )
      .runWith(() =>
        monad.map(() => [])(this.#headerRepository.delete(accountID)),
      )
      .finish(() => undefined);
  }

  /**
   * @description Fetch account header image metadata.
   * @param accountID
   */
  async fetchByAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, Medium>> {
    return await this.#headerRepository.findByID(accountID);
  }

  async fetchByAccountIDs(
    accountIDs: readonly AccountID[],
  ): Promise<Result.Result<Error, Medium[]>> {
    return await this.#headerRepository.findByIDs(accountIDs);
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
