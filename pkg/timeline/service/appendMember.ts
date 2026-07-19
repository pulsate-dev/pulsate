import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.js';
import type { List, ListID } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class AppendListMemberService {
  readonly #listRepository: ListRepository;
  constructor(listRepository: ListRepository) {
    this.#listRepository = listRepository;
  }

  /**
   * @description Append member to list.
   * NOTE: If account is already a member, returns error.
   * NOTE: If list member count exceeds limit(250, static), returns error.
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
                "Account don't have permission to do this action",
                { cause: null },
              ),
            ),
          ),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(Promise.resolve(list.addMember(accountID))),
      )
      .runWith(({ list }) =>
        monad.map(() => [])(this.#listRepository.appendListMember(list)),
      )
      .finish(() => undefined);
  }

  private isAllowed(actor: AccountID, list: List): boolean {
    return list.getOwnerId() === actor;
  }
}
export const appendListMemberSymbol =
  Ether.newEtherSymbol<AppendListMemberService>();
export const appendListMember = Ether.newEther(
  appendListMemberSymbol,
  ({ listRepository }) => new AppendListMemberService(listRepository),
  { listRepository: listRepoSymbol },
);
