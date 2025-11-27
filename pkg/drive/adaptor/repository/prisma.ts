import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../accounts/model/account.js';
import type { prismaClient } from '../../../adaptors/prisma.js';
import { Prisma, type PrismaClient } from '../../../generated/client/client.js';
import { DriveInternalError, MediaNotFoundError } from '../../model/errors.js';
import { Medium, type MediumID } from '../../model/medium.js';
import {
  type MediaRepository,
  mediaRepoSymbol,
} from '../../model/repository.js';

type MediumPrismaArgs = Awaited<
  ReturnType<typeof prismaClient.medium.findUnique>
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
      return Result.err(this.parsePrismaError(e));
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
      throw new DriveInternalError('failed to serialize', { cause: null });
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

  private parsePrismaError(e: unknown): Error {
    // NOTE: cf. prisma error reference: https://www.prisma.io/docs/orm/reference/error-reference
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      const NOT_FOUND_ERROR_CODE = ['P2001', 'P2015', 'P2018', 'P2025'];
      if (NOT_FOUND_ERROR_CODE.includes(e.code)) {
        return new MediaNotFoundError(e.message, { cause: e });
      }
      return new DriveInternalError(e.message, { cause: e });
    }
    return new DriveInternalError('unknown error', { cause: e });
  }
}
export const prismaMediaRepo = (prisma: PrismaClient) =>
  Ether.newEther(mediaRepoSymbol, () => new PrismaMediaRepository(prisma));
