import type { Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { List, ListID } from '../model/list.js';
import type { ListRepository } from '../model/repository.js';

export class FetchSubscribedListService {
  constructor(private readonly listRepository: ListRepository) {}

  /**
   * @description Fetch list by member(assignee) account ID
   * @param accountID
   * @returns ListID[] which specified account is assigned
   */
  async handle(accountID: AccountID): Promise<Result.Result<Error, ListID[]>> {
    const monad = resultPromiseMonad<Error>();
    return monad.map((lists: List[]) => lists.map((list) => list.getId()))(
      this.listRepository.fetchListsByMemberAccountID(accountID),
    );
  }
}
