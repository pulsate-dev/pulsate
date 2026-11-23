import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import {
  Prisma,
  type PrismaClient,
} from '../../../../adaptors/prisma/client.ts';
import {
  AccountAlreadyFollowingError,
  AccountInternalError,
} from '../../../model/errors.ts';
import {
  generateDummyAccount,
  generateDummyFollow,
} from '../../../testData/testData.ts';
import { PrismaAccountFollowRepository } from './prisma.ts';

describe('PrismaAccountFollowRepository.hasActiveFollow query contract', () => {
  it.each([null, { fromId: 'viewer' }])(
    'checks the forward undeleted relationship for %j',
    async (record) => {
      const viewer = generateDummyAccount();
      const author = generateDummyAccount();
      const findFirst = vi.fn().mockResolvedValue(record);
      const repository = new PrismaAccountFollowRepository({
        following: { findFirst },
      } as unknown as PrismaClient);
      expect(
        Result.unwrap(
          await repository.hasActiveFollow(viewer.getID(), author.getID()),
        ),
      ).toBe(record !== null);
      expect(findFirst).toHaveBeenCalledWith({
        where: {
          fromId: viewer.getID(),
          toId: author.getID(),
          deletedAt: null,
        },
        select: { fromId: true },
      });
    },
  );

  it('returns a failure instead of treating database errors as a missing follow', async () => {
    const viewer = generateDummyAccount();
    const author = generateDummyAccount();
    const repository = new PrismaAccountFollowRepository({
      following: {
        findFirst: vi.fn().mockRejectedValue(new Error('Database unavailable')),
      },
    } as unknown as PrismaClient);
    expect(
      Result.isErr(
        await repository.hasActiveFollow(viewer.getID(), author.getID()),
      ),
    ).toBe(true);
  });
});

describe('PrismaAccountFollowRepository.follow uniqueness', () => {
  function setup() {
    const from = generateDummyAccount();
    const to = generateDummyAccount();
    const follow = generateDummyFollow({
      fromID: from.getID(),
      targetID: to.getID(),
    });
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const create = vi.fn().mockResolvedValue({});
    const repository = new PrismaAccountFollowRepository({
      following: { updateMany, create },
    } as unknown as PrismaClient);
    return { from, to, follow, updateMany, create, repository };
  }

  it('creates a new relationship only after checking for a deleted row to restore', async () => {
    const data = setup();
    expect(Result.isOk(await data.repository.follow(data.follow))).toBe(true);
    expect(data.updateMany).toHaveBeenCalledWith({
      where: {
        fromId: data.from.getID(),
        toId: data.to.getID(),
        deletedAt: { not: null },
      },
      data: { deletedAt: null },
    });
    expect(data.create).toHaveBeenCalledWith({
      data: { fromId: data.from.getID(), toId: data.to.getID() },
    });
  });

  it('restores a deleted relationship without trying to insert another row', async () => {
    const data = setup();
    data.updateMany.mockResolvedValueOnce({ count: 1 });
    expect(Result.isOk(await data.repository.follow(data.follow))).toBe(true);
    expect(data.create).not.toHaveBeenCalled();
  });

  it('returns already following when the unique pair already exists, including races', async () => {
    const data = setup();
    const conflict = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
      },
    );
    data.create.mockRejectedValueOnce(conflict);
    const error = Result.unwrapErr(await data.repository.follow(data.follow));
    expect(error).toBeInstanceOf(AccountAlreadyFollowingError);
    expect(error.cause).toBe(conflict);
  });

  it.each(['updateMany', 'create'] as const)(
    'does not mistake a %s database failure for an existing follow',
    async (operation) => {
      const data = setup();
      data[operation].mockRejectedValueOnce(new Error('Database unavailable'));
      const error = Result.unwrapErr(await data.repository.follow(data.follow));
      expect(error).toBeInstanceOf(AccountInternalError);
      if (operation === 'updateMany')
        expect(data.create).not.toHaveBeenCalled();
    },
  );
});
