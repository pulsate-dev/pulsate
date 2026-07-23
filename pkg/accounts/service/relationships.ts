import { Cat, Ether, Option, type Result } from '@mikuroxina/mini-fn';

import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import type { AccountID } from '../model/account.ts';
import { AccountNotFoundError } from '../model/errors.ts';
import { isFollowedBy, isFollowing } from '../model/followDomainService.ts';
import {
  type AccountFollowRepository,
  type AccountRepository,
  accountRepoSymbol,
  followRepoSymbol,
} from '../model/repository.ts';

export interface AccountRelationships {
  id: AccountID;
  isFollowed: boolean;
  isFollowing: boolean;
  isFollowRequesting: boolean;
}

export class FetchRelationshipService {
  readonly #accountFollowRepository: AccountFollowRepository;
  readonly #accountRepository: AccountRepository;
  constructor(
    accountFollowRepository: AccountFollowRepository,
    accountRepository: AccountRepository,
  ) {
    this.#accountFollowRepository = accountFollowRepository;
    this.#accountRepository = accountRepository;
  }

  async checkRelationships(
    targetAccountID: AccountID,
    fromAccountID: AccountID,
  ): Promise<Result.Result<Error, AccountRelationships>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'targetAccount',
        this.#accountRepository.findByID(targetAccountID).then(
          Option.okOr(
            new AccountNotFoundError('target account not found', {
              cause: null,
            }),
          ),
        ),
      )
      .addM(
        'followers',
        this.#accountFollowRepository.fetchAllFollowers(fromAccountID),
      )
      .addM(
        'following',
        this.#accountFollowRepository.fetchAllFollowing(fromAccountID),
      )
      .finish(({ followers, following }) => ({
        id: targetAccountID,
        isFollowed: isFollowedBy(followers, targetAccountID),
        isFollowing: isFollowing(following, targetAccountID),
        // ToDo: implement follow request feature
        isFollowRequesting: false,
      }));
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
