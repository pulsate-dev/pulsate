import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.js';
import {
  Account,
  type AccountFrozen,
  type AccountID,
  type AccountRole,
  type AccountSilenced,
  type AccountStatus,
} from '../model/account.js';
import { AccountNotFoundError } from '../model/errors.js';
import { AccountFollow } from '../model/follow.js';
import { FetchRelationshipService } from './relationships.js';

// Test factories
const createMockAccount = (id: string, name: string): Account => {
  return Account.reconstruct({
    id: id as AccountID,
    name: `@${name}@example.com`,
    nickname: name,
    mail: `${name}@example.com`,
    passphraseHash: 'hash',
    bio: 'bio',
    role: 'normal' as AccountRole,
    frozen: 'normal' as AccountFrozen,
    silenced: 'normal' as AccountSilenced,
    status: 'active' as AccountStatus,
    createdAt: new Date(`2024-01-0${id}T10:00:00Z`),
  });
};

const createMockFollow = (
  fromId: string,
  targetId: string,
  dayOffset = 0,
): AccountFollow => {
  return AccountFollow.new({
    fromID: fromId as AccountID,
    targetID: targetId as AccountID,
    createdAt: new Date(`2024-01-${10 + dayOffset}T12:00:00Z`),
  });
};

describe('FetchRelationshipService', () => {
  describe('checkRelationships', () => {
    describe('when target account exists', () => {
      it('should return mutual follow relationships', async () => {
        const account1 = createMockAccount('1', 'john');
        const account2 = createMockAccount('2', 'jane');
        const accountRepo = new InMemoryAccountRepository([account1, account2]);
        const followRepo = new InMemoryAccountFollowRepository([
          createMockFollow('1', '2', 0), // john follows jane
          createMockFollow('2', '1', 1), // jane follows john
        ]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          '2' as AccountID,
          '1' as AccountID,
        );

        expect(Result.isOk(result)).toBe(true);
        const relationships = Result.unwrap(result);
        expect(relationships).toEqual({
          id: '2',
          is_followed: true,
          is_following: true,
          is_follow_requesting: false,
        });
      });

      it('should return one-way follow relationship', async () => {
        const account1 = createMockAccount('1', 'john');
        const account2 = createMockAccount('2', 'jane');
        const accountRepo = new InMemoryAccountRepository([account1, account2]);
        const followRepo = new InMemoryAccountFollowRepository([
          createMockFollow('1', '2'), // john follows jane
        ]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          '2' as AccountID,
          '1' as AccountID,
        );

        expect(Result.isOk(result)).toBe(true);
        const relationships = Result.unwrap(result);
        expect(relationships).toEqual({
          id: '2',
          is_followed: false,
          is_following: true,
          is_follow_requesting: false,
        });
      });

      it('should return no relationship when no follows exist', async () => {
        const account1 = createMockAccount('1', 'john');
        const account2 = createMockAccount('2', 'jane');
        const accountRepo = new InMemoryAccountRepository([account1, account2]);
        const followRepo = new InMemoryAccountFollowRepository([]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          '2' as AccountID,
          '1' as AccountID,
        );

        expect(Result.isOk(result)).toBe(true);
        const relationships = Result.unwrap(result);
        expect(relationships).toEqual({
          id: '2',
          is_followed: false,
          is_following: false,
          is_follow_requesting: false,
        });
      });
    });

    describe('when target account does not exist', () => {
      it('should return AccountNotFoundError', async () => {
        const account1 = createMockAccount('1', 'john');
        const accountRepo = new InMemoryAccountRepository([account1]);
        const followRepo = new InMemoryAccountFollowRepository([]);
        const service = new FetchRelationshipService(followRepo, accountRepo);

        const result = await service.checkRelationships(
          '999' as AccountID,
          '1' as AccountID,
        );

        expect(Result.isErr(result)).toBe(true);
        expect(Result.unwrapErr(result)).toBeInstanceOf(AccountNotFoundError);
      });
    });
  });
});
