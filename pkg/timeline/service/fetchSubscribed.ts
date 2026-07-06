import { Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { ListID } from '../model/list.js';
import type { ListRepository } from '../model/repository.js';

export class FetchSubscribedListService {
  constructor(private readonly listRepository: ListRepository) {}

  /**
   * @description Fetch list by member(assignee) account ID
   * @param accountID
   * @returns ListID[] which specified account is assigned
   */
  async handle(accountID: AccountID): Promise<Result.Result<Error, ListID[]>> {
    return this.listRepository
      .fetchListsByMemberAccountID(accountID)
      .then(Result.map((lists) => lists.map((list) => list.getId())));
  }
}
