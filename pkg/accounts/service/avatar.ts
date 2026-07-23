import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { Medium, MediumID } from '../../drive/model/medium.ts';
import {
  type MediaModuleFacade,
  mediaModuleFacadeSymbol,
} from '../../intermodule/media.ts';
import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import type { AccountID } from '../model/account.ts';
import { AccountInsufficientPermissionError } from '../model/errors.ts';
import {
  type AccountAvatarRepository,
  accountAvatarRepoSymbol,
} from '../model/repository.ts';

export class AccountAvatarService {
  readonly #avatarRepository: AccountAvatarRepository;
  readonly #mediaModule: MediaModuleFacade;
  constructor(
    avatarRepository: AccountAvatarRepository,
    mediaModule: MediaModuleFacade,
  ) {
    this.#avatarRepository = avatarRepository;
    this.#mediaModule = mediaModule;
  }

  /**
   * @description Set account avatar image.
   *
   * avatar specification:
   * - NSFW Media can't be used as avatar image.
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
    const monad = resultPromiseMonad<Error>();

    // ToDo: Check media type
    return Cat.doT(monad)
      .addM('medium', this.#mediaModule.fetchMedia(mediumID))
      .when(
        ({ medium }) => medium.isNsfw(),
        () =>
          Promise.resolve(
            Result.err(
              new AccountInsufficientPermissionError(
                "NSFW media can't be used as avatar image",
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
        monad.map(() => [])(this.#avatarRepository.create(accountID, mediumID)),
      )
      .finish(() => undefined);
  }

  /**
   * @description Unset account avatar image.
   * @param accountID
   * @param actorID
   */
  async delete(
    accountID: AccountID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .runWith(() =>
        monad.map(() => [])(
          Promise.resolve(
            this.isAllowed('unset', actorID, { targetAccount: accountID }),
          ),
        ),
      )
      .runWith(() =>
        monad.map(() => [])(this.#avatarRepository.delete(accountID)),
      )
      .finish(() => undefined);
  }

  /**
   * @description Fetch account avatar image metadata.
   * @param accountID
   */
  async fetchByAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, Medium>> {
    return await this.#avatarRepository.findByID(accountID);
  }

  /**
   * @description Fetch account avatar image metadata.
   * @param accountIDs
   */
  async fetchByAccountIDs(
    accountIDs: readonly AccountID[],
  ): Promise<Result.Result<Error, Medium[]>> {
    return await this.#avatarRepository.findByIDs(accountIDs);
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
export const accountAvatarSymbol = Ether.newEtherSymbol<AccountAvatarService>();
export const accountAvatar = Ether.newEther(
  accountAvatarSymbol,
  ({ avatarRepository, mediaModule }) =>
    new AccountAvatarService(avatarRepository, mediaModule),
  {
    avatarRepository: accountAvatarRepoSymbol,
    mediaModule: mediaModuleFacadeSymbol,
  },
);
