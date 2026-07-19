import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.js';
import type { List, ListID } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class RemoveListMemberService {
  readonly #listRepository: ListRepository;
  constructor(listRepository: ListRepository) {
    this.#listRepository = listRepository;
  }

  /**
   * @description Remove member from list.
   * @param listID
   * @param accountID
   * @param actorID
   */
  async handle(
    listID: ListID,
    accountID: AccountID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'list',
        this.#listRepository
          .fetchList(listID)
          .then(
            Result.mapErr(
              (e) => new ListNotFoundError('List not found', { cause: e }),
            ),
          ),
      )
      .when(
        ({ list }) => !this.isAllowed(actorID, list),
        () =>
          Promise.resolve(
            Result.err(
              new TimelineInsufficientPermissionError(
                "Account don't have permission to remove member",
                { cause: null },
              ),
            ),
          ),
      )
      .runWith(() =>
        monad.map(() => [])(
          this.#listRepository.removeListMember(listID, accountID),
        ),
      )
      .finish(() => undefined);
  }

  private isAllowed(actor: AccountID, list: List): boolean {
    return list.getOwnerId() === actor;
  }
}
export const removeListMemberSymbol =
  Ether.newEtherSymbol<RemoveListMemberService>();
export const removeListMember = Ether.newEther(
  removeListMemberSymbol,
  ({ listRepository }) => new RemoveListMemberService(listRepository),
  {
    listRepository: listRepoSymbol,
  },
);
