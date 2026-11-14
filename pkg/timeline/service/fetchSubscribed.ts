import { Promise, type Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import type { List, ListID } from '../model/list.ts';
import type { ListRepository } from '../model/repository.ts';

export class FetchSubscribedListService {
  readonly #listRepository: ListRepository;
  constructor(listRepository: ListRepository) {
    this.#listRepository = listRepository;
  }

  /**
   * @description Fetch list by member(assignee) account ID
   * @param accountID
   * @returns ListID[] which specified account is assigned
   */
  async handle(accountID: AccountID): Promise<Result.Result<Error, ListID[]>> {
    const monad = Promise.resultMonad<Error>();
    return monad.map((lists: List[]) => lists.map((list) => list.getId()))(
      this.#listRepository.fetchListsByMemberAccountID(accountID),
    );
  }
}
