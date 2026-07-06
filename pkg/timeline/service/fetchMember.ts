import { Cat, Ether, type Result } from '@mikuroxina/mini-fn';
import {
  type Account,
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type { ListID } from '../model/list.js';
import { type ListRepository, listRepoSymbol } from '../model/repository.js';

export class FetchListMemberService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly accountModule: AccountModuleFacade,
  ) {}

  async handle(listID: ListID): Promise<Result.Result<Error, Account[]>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM('memberIDs', this.listRepository.fetchListMembers(listID))
      .addMWith('accounts', ({ memberIDs }) =>
        this.accountModule.fetchAccounts(memberIDs),
      )
      .finish(({ accounts }) => accounts);
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
