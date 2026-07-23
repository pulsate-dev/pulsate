import { Cat, Ether, Promise, type Result } from '@mikuroxina/mini-fn';
import {
  type Account,
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.ts';
import type { ListID } from '../model/list.ts';
import { type ListRepository, listRepoSymbol } from '../model/repository.ts';

export class FetchListMemberService {
  readonly #listRepository: ListRepository;
  readonly #accountModule: AccountModuleFacade;
  constructor(
    listRepository: ListRepository,
    accountModule: AccountModuleFacade,
  ) {
    this.#listRepository = listRepository;
    this.#accountModule = accountModule;
  }

  async handle(listID: ListID): Promise<Result.Result<Error, Account[]>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM('memberIDs', this.#listRepository.fetchListMembers(listID))
      .addMWith('accounts', ({ memberIDs }) =>
        this.#accountModule.fetchAccounts(memberIDs),
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
