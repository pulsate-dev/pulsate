import { Ether, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import {
  ListNotFoundError,
  TimelineInsufficientPermissionError,
} from '../model/errors.js';
import type { List, ListID } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class RemoveListMemberService {
  constructor(private readonly listRepository: ListRepository) {}

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
    const listRes = await this.listRepository.fetchList(listID);
    if (Result.isErr(listRes)) {
      return Result.err(
        new ListNotFoundError('List not found', {
          cause: Result.unwrapErr(listRes),
        }),
      );
    }
    const allowedRes = this.verifyActorPermission(
      actorID,
      Result.unwrap(listRes),
    );
    if (Result.isErr(allowedRes)) {
      return allowedRes;
    }

    return await this.listRepository.removeListMember(listID, accountID);
  }

  private verifyActorPermission(
    actor: AccountID,
    list: List,
  ): Result.Result<Error, void> {
    if (list.getOwnerId() !== actor) {
      return Result.err(
        new TimelineInsufficientPermissionError(
          "Account don't have permission to remove member",
          { cause: null },
        ),
      );
    }

    return Result.ok(undefined);
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
