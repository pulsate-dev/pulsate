import { Result } from '@mikuroxina/mini-fn';
import type { Account, AccountID } from '../../accounts/model/account.js';
import type { FetchService } from '../../accounts/service/fetch.js';
import type { FetchFollowService } from '../../accounts/service/fetchFollow.js';
import type {
  AccountModuleInterface,
  PartialAccount,
} from '../interfaces/account.js';

export class AccountModule implements AccountModuleInterface {
  constructor(
    private readonly fetchService: FetchService,
    private readonly fetchFollowService: FetchFollowService,
  ) {}

  async fetchAccount(id: AccountID): Promise<Result.Result<Error, Account>> {
    const res = await this.fetchService.fetchAccountByID(id);
    if (Result.isErr(res)) {
      return res;
    }

    return res;
  }

  async fetchFollowings(
    id: AccountID,
  ): Promise<Result.Result<Error, PartialAccount[]>> {
    const res = await this.fetchFollowService.fetchFollowingsByID(id);
    if (Result.isErr(res)) {
      return res;
    }

    const accounts = await Promise.all(
      res[1].map((v) => this.fetchService.fetchAccountByID(v.getTargetID())),
    );

    return Result.ok(
      accounts
        .filter((v) => Result.isOk(v))
        .map((v): PartialAccount => {
          return {
            id: v[1].getID(),
            name: v[1].getName(),
            nickname: v[1].getNickname(),
            bio: v[1].getBio(),
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
      res[1].map((v) => this.fetchService.fetchAccountByID(v.getFromID())),
    );

    return Result.ok(
      accounts
        .filter((v) => Result.isOk(v))
        .map((v): PartialAccount => {
          return {
            id: v[1].getID(),
            name: v[1].getName(),
            nickname: v[1].getNickname(),
            bio: v[1].getBio(),
          };
        }),
    );
  }
}
