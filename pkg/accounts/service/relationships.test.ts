import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import { generateDummyID } from '../../internal/id/dummy.ts';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.ts';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.ts';
import type { Account } from '../model/account.ts';
import { AccountNotFoundError } from '../model/errors.ts';
import {
  generateDummyAccount,
  generateDummyFollow,
} from '../testData/testData.ts';
import { FetchRelationshipService } from './relationships.ts';

const john = generateDummyAccount({ name: '@john@example.com' });
const jane = generateDummyAccount({ name: '@jane@example.com' });
const johnFollowsJane = generateDummyFollow({
  fromID: john.getID(),
  targetID: jane.getID(),
});
const janeFollowsJohn = generateDummyFollow({
  fromID: jane.getID(),
  targetID: john.getID(),
});

describe('FetchRelationshipService', () => {
  describe('checkRelationships', () => {
    describe('when target account exists', () => {
      it('should return mutual follow relationships', async () => {
        const accountRepo = new InMemoryAccountRepository([john, jane]);
        const followRepo = new InMemoryAccountFollowRepository([
          johnFollowsJane,
          janeFollowsJohn,
        ]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          jane.getID(),
          john.getID(),
        );

        expect(Result.isOk(result)).toBe(true);
        const relationships = Result.unwrap(result);
        expect(relationships).toEqual({
          id: jane.getID(),
          isFollowed: true,
          isFollowing: true,
          isFollowRequesting: false,
        });
      });

      it('should return one-way follow relationship', async () => {
        const accountRepo = new InMemoryAccountRepository([john, jane]);
        const followRepo = new InMemoryAccountFollowRepository([
          johnFollowsJane,
        ]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          jane.getID(),
          john.getID(),
        );

        expect(Result.isOk(result)).toBe(true);
        const relationships = Result.unwrap(result);
        expect(relationships).toEqual({
          id: jane.getID(),
          isFollowed: false,
          isFollowing: true,
          isFollowRequesting: false,
        });
      });

      it('should return no relationship when no follows exist', async () => {
        const accountRepo = new InMemoryAccountRepository([john, jane]);
        const followRepo = new InMemoryAccountFollowRepository([]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          jane.getID(),
          john.getID(),
        );

        expect(Result.isOk(result)).toBe(true);
        const relationships = Result.unwrap(result);
        expect(relationships).toEqual({
          id: jane.getID(),
          isFollowed: false,
          isFollowing: false,
          isFollowRequesting: false,
        });
      });
    });

    describe('when target account does not exist', () => {
      it('should return AccountNotFoundError', async () => {
        const accountRepo = new InMemoryAccountRepository([john]);
        const followRepo = new InMemoryAccountFollowRepository([]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          generateDummyID<Account>(),
          john.getID(),
        );

        expect(Result.isErr(result)).toBe(true);
        expect(Result.unwrapErr(result)).toBeInstanceOf(AccountNotFoundError);
      });
    });
  });
});
