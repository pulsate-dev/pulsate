import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';
import { InMemoryAccountRepository } from '../accounts/adaptor/repository/dummy/account.ts';
import { inMemoryAccountAvatarRepo } from '../accounts/adaptor/repository/dummy/avatar.ts';
import { newFollowRepo } from '../accounts/adaptor/repository/dummy/follow.ts';
import { inMemoryAccountHeaderRepo } from '../accounts/adaptor/repository/dummy/header.ts';
import { prismaAccountAvatarRepo } from '../accounts/adaptor/repository/prisma/avatar.ts';
import { prismaAccountHeaderRepo } from '../accounts/adaptor/repository/prisma/header.ts';
import {
  PrismaAccountRepository,
  prismaFollowRepo,
} from '../accounts/adaptor/repository/prisma/prisma.ts';
import type {
  Account,
  AccountID,
  AccountName,
} from '../accounts/model/account.ts';
import type { AccountFollow } from '../accounts/model/follow.ts';
import { accountRepoSymbol } from '../accounts/model/repository.ts';
import {
  type AccountAvatarService,
  accountAvatar,
} from '../accounts/service/avatar.ts';
import type { FetchService } from '../accounts/service/fetch.ts';
import { fetch } from '../accounts/service/fetch.ts';
import type { FetchFollowService } from '../accounts/service/fetchFollow.ts';
import { fetchFollow } from '../accounts/service/fetchFollow.ts';
import {
  type AccountHeaderService,
  accountHeader,
} from '../accounts/service/header.ts';
import { dummyAccounts, dummyfollows } from '../accounts/testData/testData.ts';
import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import type { Medium } from '../drive/model/medium.ts';
import { mediaModuleFacadeEther } from './media.ts';

export type { Account } from '../accounts/model/account.ts';

export interface PartialAccount {
  id: AccountID;
  name: AccountName;
  nickname: string;
  bio: string;
}

export class AccountModuleFacade {
  readonly #fetchService: FetchService;
  readonly #fetchFollowService: FetchFollowService;
  readonly #avatarService: AccountAvatarService;
  readonly #headerService: AccountHeaderService;
  constructor(
    fetchService: FetchService,
    fetchFollowService: FetchFollowService,
    avatarService: AccountAvatarService,
    headerService: AccountHeaderService,
  ) {
    this.#fetchService = fetchService;
    this.#fetchFollowService = fetchFollowService;
    this.#avatarService = avatarService;
    this.#headerService = headerService;
  }

  async fetchAccount(id: AccountID): Promise<Result.Result<Error, Account>> {
    return await this.#fetchService.fetchAccountByID(id);
  }

  async fetchAccounts(
    id: AccountID[],
  ): Promise<Result.Result<Error, Account[]>> {
    return await this.#fetchService.fetchManyAccountsByID(id);
  }

  async fetchFollowings(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>> {
    const followings = Result.map((v: AccountFollow[]) =>
      v.map((v) => v.getTargetID()),
    )(await this.#fetchFollowService.fetchFollowingsByID(id));

    if (Result.isErr(followings)) {
      return followings;
    }

    const accounts = await this.#fetchService.fetchManyAccountsByID(
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
    const res = await this.#fetchFollowService.fetchFollowersByID(id);
    if (Result.isErr(res)) {
      return res;
    }

    const accounts = await Promise.all(
      Result.unwrap(res).map((v) =>
        this.#fetchService.fetchAccountByID(v.getFromID()),
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

  async fetchAccountAvatar(
    id: AccountID,
  ): Promise<Result.Result<Error, string>> {
    const res = await this.#avatarService.fetchByAccountID(id);
    const avatar = Cat.cat(res)
      .feed(Result.optionOk)
      .feed(Option.andThen((avatarImage: Medium) => avatarImage.getUrl()))
      .feed(Option.unwrapOr('')).value;
    return Result.ok(avatar);
  }

  async fetchAccountHeader(
    id: AccountID,
  ): Promise<Result.Result<Error, string>> {
    const res = await this.#headerService.fetchByAccountID(id);
    const header = Cat.cat(res)
      .feed(Result.optionOk)
      .feed(Option.andThen((headerImage: Medium) => headerImage.getUrl()))
      .feed(Option.unwrapOr('')).value;
    return Result.ok(header);
  }

  async fetchAccountAvatarHeaders(
    ids: readonly AccountID[],
  ): Promise<
    Result.Result<
      Error,
      Map<AccountID, { avatarURL: string; headerURL: string }>
    >
  > {
    const avatarRes = await this.#avatarService.fetchByAccountIDs(ids);
    if (Result.isErr(avatarRes)) {
      return avatarRes;
    }
    const avatar = Result.unwrap(avatarRes);

    const headerRes = await this.#headerService.fetchByAccountIDs(ids);
    if (Result.isErr(headerRes)) {
      return headerRes;
    }
    const header = Result.unwrap(headerRes);
    const res = new Map<AccountID, { avatarURL: string; headerURL: string }>();

    for (const v of avatar) {
      res.set(v.getAuthorId(), {
        avatarURL: Option.unwrapOr('')(v.getUrl()),
        headerURL: '',
      });
    }
    for (const v of header) {
      const headerURL = Option.unwrapOr('')(v.getUrl());
      const avatarURL = res.get(v.getAuthorId())?.avatarURL;
      if (avatarURL) {
        res.set(v.getAuthorId(), {
          avatarURL,
          headerURL,
        });
        continue;
      }
      res.set(v.getAuthorId(), { avatarURL: '', headerURL });
    }

    return Result.ok(res);
  }

  async fetchFollowCount(
    id: AccountID,
  ): Promise<Result.Result<Error, { followers: number; following: number }>> {
    return await this.#fetchFollowService.fetchFollowCount(id);
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

const accountHeaderRepository = isProduction
  ? prismaAccountHeaderRepo(prismaClient)
  : inMemoryAccountHeaderRepo([], []);
const accountAvatarRepository = isProduction
  ? prismaAccountAvatarRepo(prismaClient)
  : inMemoryAccountAvatarRepo([], []);

export const accountModule = new AccountModuleFacade(
  Ether.runEther(Cat.cat(fetch).feed(Ether.compose(accountRepository)).value),
  Ether.runEther(
    Cat.cat(fetchFollow)
      .feed(Ether.compose(accountFollowRepository))
      .feed(Ether.compose(accountRepository)).value,
  ),
  Ether.runEther(
    Cat.cat(accountAvatar)
      .feed(Ether.compose(accountAvatarRepository))
      .feed(Ether.compose(mediaModuleFacadeEther)).value,
  ),
  Ether.runEther(
    Cat.cat(accountHeader)
      .feed(Ether.compose(accountHeaderRepository))
      .feed(Ether.compose(mediaModuleFacadeEther)).value,
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
  Ether.runEther(
    Cat.cat(accountAvatar)
      .feed(Ether.compose(accountAvatarRepository))
      .feed(Ether.compose(mediaModuleFacadeEther)).value,
  ),
  Ether.runEther(
    Cat.cat(accountHeader)
      .feed(Ether.compose(accountHeaderRepository))
      .feed(Ether.compose(mediaModuleFacadeEther)).value,
  ),
);

export const accountModuleEther = Ether.newEther(
  accountModuleFacadeSymbol,
  () => (isProduction ? accountModule : dummyAccountModuleFacade),
);
