import { Cat, Ether, Result } from '@mikuroxina/mini-fn';
import {
  InMemoryAccountRepository,
  newFollowRepo,
} from '../accounts/adaptor/repository/dummy.js';
import {
  PrismaAccountRepository,
  prismaFollowRepo,
} from '../accounts/adaptor/repository/prisma.js';
import type {
  Account,
  AccountID,
  AccountName,
} from '../accounts/model/account.js';
import type { AccountFollow } from '../accounts/model/follow.js';
import { accountRepoSymbol } from '../accounts/model/repository.js';
import type { FetchService } from '../accounts/service/fetch.js';
import { fetch } from '../accounts/service/fetch.js';
import type { FetchFollowService } from '../accounts/service/fetchFollow.js';
import { fetchFollow } from '../accounts/service/fetchFollow.js';
import { dummyAccounts, dummyfollows } from '../accounts/testData/testData.js';
import { isProduction } from '../adaptors/env.js';
import { prismaClient } from '../adaptors/prisma.js';

export type { Account } from '../accounts/model/account.js';

export interface PartialAccount {
  id: AccountID;
  name: AccountName;
  nickname: string;
  bio: string;
}

export class AccountModuleFacade {
  constructor(
    private readonly fetchService: FetchService,
    private readonly fetchFollowService: FetchFollowService,
  ) {}

  async fetchAccount(id: AccountID): Promise<Result.Result<Error, Account>> {
    return await this.fetchService.fetchAccountByID(id);
  }

  async fetchAccounts(
    id: AccountID[],
  ): Promise<Result.Result<Error, Account[]>> {
    return await this.fetchService.fetchManyAccountsByID(id);
  }

  async fetchFollowings(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>> {
    const followings = Result.map((v: AccountFollow[]) =>
      v.map((v) => v.getTargetID()),
    )(await this.fetchFollowService.fetchFollowingsByID(id));

    if (Result.isErr(followings)) {
      return followings;
    }

    const accounts = await this.fetchService.fetchManyAccountsByID(
      Result.unwrap(followings),
    );

    if (Result.isErr(accounts)) {
      return accounts;
    }

    return Result.ok(
      Result.unwrap(accounts).map((v): PartialAccount => {
        return {
          id: v.getID(),
          name: v.getName(),
          nickname: v.getNickname(),
          bio: v.getBio(),
        };
      }),
    );
  }

  async fetchFollowers(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>> {
    const res = await this.fetchFollowService.fetchFollowersByID(id);
    if (Result.isErr(res)) {
      return res;
    }

    const accounts = await Promise.all(
      Result.unwrap(res).map((v) =>
        this.fetchService.fetchAccountByID(v.getFromID()),
      ),
    );

    return Result.ok(
      accounts
        .filter((v) => Result.isOk(v))
        .map((v): PartialAccount => {
          const unwrapped = Result.unwrap(v);
          return {
            id: unwrapped.getID(),
            name: unwrapped.getName(),
            nickname: unwrapped.getNickname(),
            bio: unwrapped.getBio(),
          };
        }),
    );
  }
}

export const accountModuleFacadeSymbol =
  Ether.newEtherSymbol<AccountModuleFacade>();

const accountRepoObject = isProduction
  ? new PrismaAccountRepository(prismaClient)
  : new InMemoryAccountRepository([]);
const accountRepository = Ether.newEther(
  accountRepoSymbol,
  () => accountRepoObject,
);

const accountFollowRepository = isProduction
  ? prismaFollowRepo(prismaClient)
  : newFollowRepo();

export const accountModule = new AccountModuleFacade(
  Ether.runEther(Cat.cat(fetch).feed(Ether.compose(accountRepository)).value),
  Ether.runEther(
    Cat.cat(fetchFollow)
      .feed(Ether.compose(accountFollowRepository))
      .feed(Ether.compose(accountRepository)).value,
  ),
);

const inMemoryAccountRepository = Ether.newEther(
  accountRepoSymbol,
  () => new InMemoryAccountRepository(dummyAccounts),
);
const inMemoryFollowRepository = newFollowRepo(dummyfollows);
export const dummyAccountModuleFacade = new AccountModuleFacade(
  Ether.runEther(
    Cat.cat(fetch).feed(Ether.compose(inMemoryAccountRepository)).value,
  ),
  Ether.runEther(
    Cat.cat(fetchFollow)
      .feed(Ether.compose(inMemoryFollowRepository))
      .feed(Ether.compose(inMemoryAccountRepository)).value,
  ),
);

export const accountModuleEther = () =>
  Ether.newEther(accountModuleFacadeSymbol, () =>
    isProduction ? accountModule : dummyAccountModuleFacade,
  );
