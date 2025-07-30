import { Option, Result } from '@mikuroxina/mini-fn';
import { beforeAll, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '../adaptor/repository/dummy/account.js';
import { InMemoryAccountFollowRepository } from '../adaptor/repository/dummy/follow.js';
import { Account, type AccountID, type AccountName } from '../model/account.js';
import { AccountFollow } from '../model/follow.js';
import type {
  FetchFollowerFilter,
  FetchFollowingFilter,
} from '../model/repository.js';
import { FetchFollowService } from './fetchFollow.js';

const accountRepository = new InMemoryAccountRepository();

await accountRepository.create(
  Account.reconstruct({
    id: '1' as AccountID,
    name: '@johndoe@example.com',
    bio: '',
    mail: '',
    nickname: '',
    passphraseHash: undefined,
    frozen: 'normal',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
    updatedAt: undefined,
    deletedAt: undefined,
  }),
);

await accountRepository.create(
  Account.reconstruct({
    id: '2' as AccountID,
    name: '@testuser@example.com',
    bio: '',
    mail: '',
    nickname: '',
    passphraseHash: undefined,
    frozen: 'normal',
    role: 'normal',
    silenced: 'normal',
    status: 'active',
    createdAt: new Date(),
    updatedAt: undefined,
    deletedAt: undefined,
  }),
);

const createdAt = new Date();
const repository = new InMemoryAccountFollowRepository();

await repository.follow(
  AccountFollow.new({
    fromID: '1' as AccountID,
    targetID: '2' as AccountID,
    createdAt,
  }),
);

await repository.follow(
  AccountFollow.new({
    fromID: '2' as AccountID,
    targetID: '1' as AccountID,
    createdAt,
  }),
);

const service = new FetchFollowService(repository, accountRepository);

describe('FetchFollowService', () => {
  const USER = {
    id: '1' as AccountID,
    name: '@johndoe@example.com' as const,
  };

  it('fetch followings by id', async () => {
    const resFollows = await service.fetchFollowingsByID(USER.id);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '1' as AccountID,
        targetID: '2' as AccountID,
        createdAt,
      }),
    ]);
  });

  it('fetch followings by name', async () => {
    const resFollows = await service.fetchFollowingsByName(USER.name);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '1' as AccountID,
        targetID: '2' as AccountID,
        createdAt,
      }),
    ]);
  });

  it('fetch followers by id', async () => {
    const resFollows = await service.fetchFollowersByID(USER.id);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '2' as AccountID,
        targetID: '1' as AccountID,
        createdAt,
      }),
    ]);
  });

  it('fetch followers by name', async () => {
    const resFollows = await service.fetchFollowersByName(USER.name);
    if (Result.isErr(resFollows)) {
      return;
    }

    expect(resFollows[1]).toStrictEqual([
      AccountFollow.new({
        fromID: '2' as AccountID,
        targetID: '1' as AccountID,
        createdAt,
      }),
    ]);
  });

  it('follow count', async () => {
    const countRes = await service.fetchFollowCount('1' as AccountID);

    expect(Result.unwrap(countRes)).toStrictEqual({
      followers: 1,
      following: 1,
    });
  });
});

describe('FetchFollowService with filters', () => {
  const filterTestAccountRepo = new InMemoryAccountRepository();
  const filterTestFollowRepo = new InMemoryAccountFollowRepository();
  const filterTestService = new FetchFollowService(
    filterTestFollowRepo,
    filterTestAccountRepo,
  );

  const ACTOR_A = '10' as AccountID;
  const ACTOR_A_NAME = '@actor@example.com' as AccountName;
  const USER_B = '20' as AccountID;
  const USER_B_NAME = '@userb@example.com' as AccountName;
  const USER_C = '30' as AccountID;
  const USER_C_NAME = '@userc@example.com' as AccountName;
  const USER_D = '40' as AccountID;
  const USER_D_NAME = '@userd@example.com' as AccountName;
  const USER_E = '50' as AccountID;
  const USER_E_NAME = '@usere@example.com' as AccountName;

  const dummyAccounts = [
    { id: ACTOR_A, name: ACTOR_A_NAME },
    { id: USER_B, name: USER_B_NAME },
    { id: USER_C, name: USER_C_NAME },
    { id: USER_D, name: USER_D_NAME },
    { id: USER_E, name: USER_E_NAME },
  ];

  const setupTestData = async () => {
    const baseAccount = {
      bio: '',
      mail: '',
      nickname: '',
      passphraseHash: undefined,
      frozen: 'normal' as const,
      role: 'normal' as const,
      silenced: 'normal' as const,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: undefined,
      deletedAt: undefined,
    };

    const createData = async (id: AccountID, name: AccountName) => {
      return filterTestAccountRepo.create(
        Account.reconstruct({
          id,
          name,
          ...baseAccount,
        }),
      );
    };

    for (const account of dummyAccounts) {
      await createData(account.id, account.name);
    }

    const followRelationships: { from: AccountID; target: AccountID }[] = [
      { from: USER_B, target: ACTOR_A }, // B follows A
      { from: ACTOR_A, target: USER_C }, // A follows C
      { from: ACTOR_A, target: USER_D }, // A follows D
      { from: USER_D, target: ACTOR_A }, // D follows A (mutual follow)
      // E does not follow anyone
    ];

    const followCreatedAt = new Date();
    for (const { from, target } of followRelationships) {
      await filterTestFollowRepo.follow(
        AccountFollow.new({
          fromID: from,
          targetID: target,
          createdAt: followCreatedAt,
        }),
      );
    }
  };

  beforeAll(async () => {
    await setupTestData();
  });

  describe('fetchFollowingsByID with filters', () => {
    it('should return all followings when no filter', async () => {
      const result = await filterTestService.fetchFollowingsByID(ACTOR_A);

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(2);
      expect(followings.map((f) => f.getTargetID())).toStrictEqual([
        USER_C,
        USER_D,
      ]);
    });

    it('should filter only followers when onlyFollower is true', async () => {
      const filter: FetchFollowingFilter = {
        actorID: ACTOR_A,
        onlyFollower: true,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowingsByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(1);
      expect(followings[0]?.getTargetID()).toBe(USER_D);
    });

    it('should not filter when onlyFollower is false', async () => {
      const filter: FetchFollowingFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowingsByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(2);
      expect(followings.map((f) => f.getTargetID())).toStrictEqual([
        USER_C,
        USER_D,
      ]);
    });

    it('should filter only following when onlyFollowing is true', async () => {
      const filter: FetchFollowingFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: true,
      };

      const result = await filterTestService.fetchFollowingsByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(2);
      expect(followings.map((f) => f.getTargetID())).toStrictEqual([
        USER_C,
        USER_D,
      ]);
    });

    it('should not filter when onlyFollowing is false', async () => {
      const filter: FetchFollowingFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowingsByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(2);
      expect(followings.map((f) => f.getTargetID())).toEqual([USER_C, USER_D]);
    });

    it('should return mutual follows when both filters are true', async () => {
      const filter: FetchFollowingFilter = {
        actorID: ACTOR_A,
        onlyFollower: true,
        onlyFollowing: true,
      };

      const result = await filterTestService.fetchFollowingsByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(1);
      expect(followings[0]?.getTargetID()).toStrictEqual(USER_D);
    });

    it('should return all followings when both filters are false', async () => {
      const filter: FetchFollowingFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowingsByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(2);
      expect(followings.map((f) => f.getTargetID())).toStrictEqual([
        USER_C,
        USER_D,
      ]);
    });
  });

  describe('fetchFollowersByID with filters', () => {
    it('should return all followers when no filter', async () => {
      const result = await filterTestService.fetchFollowersByID(ACTOR_A);

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(2);
      expect(followers.map((f) => f.getFromID())).toStrictEqual([
        USER_B,
        USER_D,
      ]);
    });

    it('should filter only followers when onlyFollower is true', async () => {
      const filter: FetchFollowerFilter = {
        actorID: ACTOR_A,
        onlyFollower: true,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowersByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(2);
      expect(followers.map((f) => f.getFromID())).toStrictEqual([
        USER_B,
        USER_D,
      ]);
    });

    it('should not filter when onlyFollower is false', async () => {
      const filter: FetchFollowerFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowersByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(2);
      expect(followers.map((f) => f.getFromID())).toStrictEqual([
        USER_B,
        USER_D,
      ]);
    });

    it('should filter only following when onlyFollowing is true', async () => {
      const filter: FetchFollowerFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: true,
      };

      const result = await filterTestService.fetchFollowersByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(1);
      expect(followers[0]?.getFromID()).toStrictEqual(USER_D);
    });

    it('should not filter when onlyFollowing is false', async () => {
      const filter: FetchFollowerFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowersByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(2);
      expect(followers.map((f) => f.getFromID())).toStrictEqual([
        USER_B,
        USER_D,
      ]);
    });

    it('should return mutual follows when both filters are true', async () => {
      const filter: FetchFollowerFilter = {
        actorID: ACTOR_A,
        onlyFollower: true,
        onlyFollowing: true,
      };

      const result = await filterTestService.fetchFollowersByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(1);
      expect(followers[0]?.getFromID()).toStrictEqual(USER_D);
    });

    it('should return all followers when both filters are false', async () => {
      const filter: FetchFollowerFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowersByID(
        ACTOR_A,
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(2);
      expect(followers.map((f) => f.getFromID())).toStrictEqual([
        USER_B,
        USER_D,
      ]);
    });
  });

  describe('fetchFollowingsByName with filters', () => {
    it('should work with filters by name', async () => {
      const filter: FetchFollowingFilter = {
        actorID: ACTOR_A,
        onlyFollower: true,
        onlyFollowing: false,
      };

      const result = await filterTestService.fetchFollowingsByName(
        '@actor@example.com',
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followings = Result.unwrap(result);
      expect(followings).toHaveLength(1);
      expect(followings[0]?.getTargetID()).toStrictEqual(USER_D);
    });
  });

  describe('fetchFollowersByName with filters', () => {
    it('should work with filters by name', async () => {
      const filter: FetchFollowerFilter = {
        actorID: ACTOR_A,
        onlyFollower: false,
        onlyFollowing: true,
      };

      const result = await filterTestService.fetchFollowersByName(
        '@actor@example.com',
        Option.some(filter),
      );

      expect(Result.isOk(result)).toBe(true);
      const followers = Result.unwrap(result);
      expect(followers).toHaveLength(1);
      expect(followers[0]?.getFromID()).toStrictEqual(USER_D);
    });
  });
});
