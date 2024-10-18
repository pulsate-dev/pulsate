import { Ether, Result } from '@mikuroxina/mini-fn';
import {
  type Account,
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.js';
import type { ListID } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class FetchListMemberService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly accountModule: AccountModuleFacade,
  ) {}

  async handle(listID: ListID): Promise<Result.Result<Error, Account[]>> {
    const list = await this.listRepository.fetchListMembers(listID);
    if (Result.isErr(list)) {
      return list;
    }
    const unwrappedAccountID = Result.unwrap(list);

    return await this.accountModule.fetchAccounts(unwrappedAccountID);
  }
}

export const fetchListMemberSymbol =
  Ether.newEtherSymbol<FetchListMemberService>();
export const fetchListMember = Ether.newEther(
  fetchListMemberSymbol,
  ({ listRepository, accountModule }) =>
    new FetchListMemberService(listRepository, accountModule),
  {
    listRepository: listRepoSymbol,
    accountModule: accountModuleFacadeSymbol,
  },
);
