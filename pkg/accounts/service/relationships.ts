import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import { isFollowedBy, isFollowing } from '../model/followDomainService.js';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.js';

export interface AccountRelationships {
  id: AccountID;
  isFollowed: boolean;
  isFollowing: boolean;
  isFollowRequesting: boolean;
}

export class FetchRelationshipService {
  constructor(
    private readonly accountFollowRepository: AccountFollowRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async checkRelationships(
    targetAccountID: AccountID,
    fromAccountID: AccountID,
  ): Promise<Result.Result<Error, AccountRelationships>> {
    // Check if target account exists
    const targetAccount =
      await this.accountRepository.findByID(targetAccountID);
    if (Option.isNone(targetAccount)) {
      return Result.err(
        new AccountNotFoundError('target account not found', { cause: null }),
      );
    }

    const followersResult =
      await this.accountFollowRepository.fetchAllFollowers(fromAccountID);
    if (Result.isErr(followersResult)) {
      return Result.err(Result.unwrapErr(followersResult));
    }
    const followers = Result.unwrap(followersResult);

    const followingResult =
      await this.accountFollowRepository.fetchAllFollowing(fromAccountID);
    if (Result.isErr(followingResult)) {
      return Result.err(Result.unwrapErr(followingResult));
    }
    const following = Result.unwrap(followingResult);

    return Result.ok({
      id: targetAccountID,
      isFollowed: isFollowedBy(followers, targetAccountID),
      isFollowing: isFollowing(following, targetAccountID),
      // ToDo: implement follow request feature
      isFollowRequesting: false,
    });
  }
}

export const fetchRelationshipSymbol =
  Ether.newEtherSymbol<FetchRelationshipService>();
export const fetchRelationship = Ether.newEther(
  fetchRelationshipSymbol,
  ({ accountRepository, followRepository }) =>
    new FetchRelationshipService(followRepository, accountRepository),
  { followRepository: followRepoSymbol, accountRepository: accountRepoSymbol },
);
