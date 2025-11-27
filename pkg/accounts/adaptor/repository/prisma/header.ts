import { Ether, Result } from '@mikuroxina/mini-fn';
import type { prismaClient } from '../../../../adaptors/prisma.js';
import { Medium, type MediumID } from '../../../../drive/model/medium.js';
import type { PrismaClient } from '../../../../generated/client/client.js';
import type { AccountID } from '../../../model/account.js';
import { AccountInternalError } from '../../../model/errors.js';
import {
  type AccountHeaderRepository,
  accountHeaderRepoSymbol,
} from '../../../model/repository.js';
import { parsePrismaError } from './prisma.js';

type AccountHeaderData = Awaited<
  ReturnType<
    typeof prismaClient.accountHeader.findMany<{ include: { medium: true } }>
  >
>;

export class PrismaAccountHeaderRepository implements AccountHeaderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    accountID: AccountID,
    mediumID: MediumID,
  ): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.accountHeader.create({
        data: {
          accountId: accountID,
          mediumId: mediumID,
        },
      });
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }
    return Result.ok(undefined);
  }

  async delete(accountID: AccountID): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.accountHeader.delete({
        where: {
          accountId: accountID,
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }
  }

  async findByID(accountID: AccountID): Promise<Result.Result<Error, Medium>> {
    try {
      const res = await this.prisma.accountHeader.findUniqueOrThrow({
        where: {
          accountId: accountID,
        },
        include: {
          medium: true,
        },
      });

      return Result.ok(this.fromPrismaData([res]));
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }
  }

  async findByIDs(
    accountIDs: readonly AccountID[],
  ): Promise<Result.Result<Error, Medium[]>> {
    try {
      const res = await this.prisma.accountAvatar.findMany({
        where: {
          accountId: {
            in: accountIDs as AccountID[],
          },
        },
        include: {
          medium: true,
        },
      });
      return Result.ok(res.map((v) => this.fromPrismaData([v])));
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }
  }

  fromPrismaData(arg: AccountHeaderData): Medium {
    if (!arg[0]) {
      throw new AccountInternalError('Account Header parsing failed', {
        cause: null,
      });
    }
    const data = arg[0].medium;

    return Medium.reconstruct({
      id: data.id as MediumID,
      authorId: data.authorId as AccountID,
      hash: data.hash,
      mime: data.mime,
      name: data.name,
      nsfw: data.nsfw,
      thumbnailUrl: data.thumbnailUrl,
      url: data.url,
    });
  }
}
export const prismaAccountHeaderRepo = (prisma: PrismaClient) =>
  Ether.newEther(
    accountHeaderRepoSymbol,
    () => new PrismaAccountHeaderRepository(prisma),
  );
