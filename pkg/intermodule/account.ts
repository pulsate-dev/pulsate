import { Result } from '@mikuroxina/mini-fn';
import type {
  Account,
  AccountID,
  AccountName,
} from '../accounts/model/account.js';
import type { FetchService } from '../accounts/service/fetch.js';
import type { FetchFollowService } from '../accounts/service/fetchFollow.js';

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

  async fetchFollowings(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>> {
    const res = await this.fetchFollowService.fetchFollowingsByID(id);
    if (Result.isErr(res)) {
      return res;
    }

    const accounts = await Promise.all(
      Result.unwrap(res).map((v) =>
        this.fetchService.fetchAccountByID(v.getTargetID()),
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
