import { Ether, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.js';
import type { List, ListID } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class AppendListMemberService {
  constructor(private readonly listRepository: ListRepository) {}

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
    const listRes = await this.listRepository.fetchList(listID);
    if (Result.isErr(listRes)) {
      return Result.err(
        new ListNotFoundError('List not found', {
          cause: Result.unwrapErr(listRes),
        }),
      );
    }
    const list = Result.unwrap(listRes);

    const allowedRes = this.verifyActorPermission(actorID, list);
    if (Result.isErr(allowedRes)) {
      return allowedRes;
    }

    const addRes = list.addMember(accountID);
    if (Result.isErr(addRes)) {
      return addRes;
    }

    return await this.listRepository.appendListMember(list);
  }

  private verifyActorPermission(
    actor: AccountID,
    list: List,
  ): Result.Result<Error, void> {
    if (list.getOwnerId() !== actor) {
      return Result.err(
        new TimelineInsufficientPermissionError(
          "Account don't have permission to do this action",
          { cause: null },
        ),
      );
    }

    return Result.ok(undefined);
  }
}
export const appendListMemberSymbol =
  Ether.newEtherSymbol<AppendListMemberService>();
export const appendListMember = Ether.newEther(
  appendListMemberSymbol,
  ({ listRepository }) => new AppendListMemberService(listRepository),
  { listRepository: listRepoSymbol },
);
