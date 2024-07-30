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
    const lists =
      await this.listRepository.fetchListsByMemberAccountID(accountID);
    if (Result.isErr(lists)) {
      return lists;
    }
    const unwrapped = Result.unwrap(lists);
    return Result.ok(unwrapped.map((list) => list.getId()));
  }
}
