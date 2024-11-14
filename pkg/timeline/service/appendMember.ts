import { Ether, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import {
  ListNotFoundError,
  ListTooManyMembersError,
  TimelineInsufficientPermissionError,
} from '../model/errors.js';
import type { List, ListID } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class AppendListMemberService {
  // ToDo: make this configurable
  private readonly LIST_MEMBER_LIMIT = 250;
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
    const allowedRes = this.verifyActorPermission(
      actorID,
      Result.unwrap(listRes),
    );
    if (Result.isErr(allowedRes)) {
      return allowedRes;
    }

    const membersRes = await this.listRepository.fetchListMembers(listID);
    if (Result.isErr(membersRes)) {
      return Result.err(
        new ListNotFoundError('List not found', {
          cause: Result.unwrapErr(membersRes),
        }),
      );
    }
    const members = Result.unwrap(membersRes);

    if (members.length >= this.LIST_MEMBER_LIMIT) {
      return Result.err(
        new ListTooManyMembersError('Too many members', {
          cause: null,
        }),
      );
    }

    return await this.listRepository.appendListMember(listID, accountID);
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
