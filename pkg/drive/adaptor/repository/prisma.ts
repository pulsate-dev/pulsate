import { Option, Result } from '@mikuroxina/mini-fn';
import type { Prisma, PrismaClient } from '@prisma/client';

import type { AccountID } from '../../../accounts/model/account.js';
import type { prismaClient } from '../../../adaptors/prisma.js';
import { Medium, type MediumID } from '../../model/medium.js';
import type { MediaRepository } from '../../model/repository.js';

type MediumPrismaArgs = Prisma.PromiseReturnType<
  typeof prismaClient.medium.findUnique
>;

export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async create(medium: Medium): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.medium.create({
        data: {
          ...this.toPrismaArgs(medium),
        },
      });
    } catch (e) {
      return Result.err(e as Error);
    }

    return Result.ok(undefined);
  }

  async findById(id: MediumID): Promise<Option.Option<Medium>> {
    const res = await this.prisma.medium.findUnique({
      where: {
        id,
      },
    });

    if (!res) {
      return Option.none();
    }

    return Option.some(this.fromPrismaArgs(res));
  }

  async findByAuthor(authorId: AccountID): Promise<Option.Option<Medium[]>> {
    try {
      const res = await this.prisma.medium.findMany({
        where: {
          authorId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return Option.some(res.map((v) => this.fromPrismaArgs(v)));
    } catch {
      return Option.none();
    }
  }

  private toPrismaArgs(medium: Medium): Prisma.MediumCreateInput {
    return {
      id: medium.getId(),
      name: medium.getName(),
      author: {
        connect: {
          id: medium.getAuthorId(),
        },
      },
      hash: medium.getHash(),
      mime: medium.getMime(),
      nsfw: medium.isNsfw(),
      url: medium.getUrl(),
      thumbnailUrl: medium.getThumbnailUrl(),
    };
  }

  private fromPrismaArgs(args: MediumPrismaArgs): Medium {
    if (args === null) {
      throw new Error('failed to serialize');
    }

    return Medium.reconstruct({
      id: args.id as MediumID,
      name: args.name,
      authorId: args.authorId as AccountID,
      hash: args.hash,
      mime: args.mime,
      nsfw: args.nsfw,
      url: args.url,
      thumbnailUrl: args.thumbnailUrl,
    });
  }
}
