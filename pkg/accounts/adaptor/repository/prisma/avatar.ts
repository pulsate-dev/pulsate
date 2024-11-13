import { Ether, Result } from '@mikuroxina/mini-fn';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { prismaClient } from '../../../../adaptors/prisma.js';
import { Medium, type MediumID } from '../../../../drive/model/medium.js';
import type { AccountID } from '../../../model/account.js';
import { AccountInternalError } from '../../../model/errors.js';
import {
  type AccountAvatarRepository,
  accountAvatarRepoSymbol,
} from '../../../model/repository.js';
import { parsePrismaError } from './prisma.js';

type AccountAvatarData = Prisma.PromiseReturnType<
  typeof prismaClient.accountAvatar.findMany<{ include: { medium: true } }>
>;

export class PrismaAccountAvatarRepository implements AccountAvatarRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    accountID: AccountID,
    mediumID: MediumID,
  ): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.accountAvatar.create({
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
      await this.prisma.accountAvatar.delete({
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
      const res = await this.prisma.accountAvatar.findUniqueOrThrow({
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

  fromPrismaData(arg: AccountAvatarData): Medium {
    if (!arg[0]) {
      throw new AccountInternalError('Account Avatar parsing failed', {
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
export const prismaAccountAvatarRepo = (prisma: PrismaClient) =>
  Ether.newEther(
    accountAvatarRepoSymbol,
    () => new PrismaAccountAvatarRepository(prisma),
  );
