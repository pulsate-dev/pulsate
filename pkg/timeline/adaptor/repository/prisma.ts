import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import { Prisma, type PrismaClient } from '@prisma/client';

import type { AccountID } from '../../../accounts/model/account.js';
import type { prismaClient } from '../../../adaptors/prisma.js';
import {
  Note,
  type NoteID,
  type NoteVisibility,
} from '../../../notes/model/note.js';
import {
  ListNotFoundError,
  TimelineInternalError,
} from '../../model/errors.js';
import { List, type ListID } from '../../model/list.js';
import {
  type FetchAccountTimelineFilter,
  type ListRepository,
  type TimelineRepository,
  listRepoSymbol,
  timelineRepoSymbol,
} from '../../model/repository.js';

export class PrismaTimelineRepository implements TimelineRepository {
  private readonly TIMELINE_NOTE_LIMIT = 20;
  constructor(private readonly prisma: PrismaClient) {}

  private deserialize(
    data: Prisma.PromiseReturnType<typeof this.prisma.note.findMany & {}>,
  ): Note[] {
    return data.map((v) => {
      const visibility = (): NoteVisibility => {
        switch (v.visibility) {
          case 0:
            return 'PUBLIC';
          case 1:
            return 'HOME';
          case 2:
            return 'FOLLOWERS';
          case 3:
            return 'DIRECT';
          default:
            throw new Error('Invalid Visibility');
        }
      };
      return Note.reconstruct({
        id: v.id as NoteID,
        content: v.text,
        authorID: v.authorId as AccountID,
        createdAt: v.createdAt,
        deletedAt: !v.deletedAt ? Option.none() : Option.some(v.deletedAt),
        contentsWarningComment: '',
        originalNoteID: !v.renoteId
          ? Option.some(v.renoteId as NoteID)
          : Option.none(),
        attachmentFileID: [],
        // ToDo: add SendTo field to db schema
        sendTo: Option.none(),
        updatedAt: Option.none(),
        visibility: visibility() as NoteVisibility,
      });
    });
  }

  async getAccountTimeline(
    accountId: AccountID,
    filter: FetchAccountTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    const accountNotes = await this.prisma.note.findMany({
      where: {
        authorId: accountId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(filter.beforeId
        ? {
            cursor: {
              id: filter.beforeId ?? '',
            },
            // NOTE: Not include specified record
            skip: 1,
          }
        : {}),
      take: this.TIMELINE_NOTE_LIMIT,
    });

    return Result.ok(this.deserialize(accountNotes));
  }

  async getHomeTimeline(
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    const homeNotes = await this.prisma.note.findMany({
      where: {
        id: {
          in: noteIDs,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: this.TIMELINE_NOTE_LIMIT,
    });
    return Result.ok(this.deserialize(homeNotes));
  }

  async fetchListTimeline(
    noteIDs: readonly NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    // ToDo: Add filter
    const listNotes = await this.prisma.note.findMany({
      where: {
        id: {
          // NOTE: prisma requires non-readonly Array in here
          in: noteIDs as NoteID[],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return Result.ok(this.deserialize(listNotes));
  }
}
export const prismaTimelineRepo = (client: PrismaClient) =>
  Ether.newEther(
    timelineRepoSymbol,
    () => new PrismaTimelineRepository(client),
  );

type DeserializeListArgs =
  | (Prisma.PromiseReturnType<typeof prismaClient.list.findUnique> & {
      listMember: {
        memberId: string;
      }[];
    })
  | null;

export class PrismaListRepository implements ListRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private parsePrismaError(e: unknown): Error {
    // NOTE: cf. prisma error reference: https://www.prisma.io/docs/orm/reference/error-reference
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      const NOT_FOUND_ERROR_CODE = ['P2001', 'P2015', 'P2018', 'P2025'];
      if (NOT_FOUND_ERROR_CODE.includes(e.code)) {
        return new ListNotFoundError(e.message, { cause: e });
      }
      return new TimelineInternalError(e.message, { cause: e });
    }
    return new TimelineInternalError('unknown error', { cause: e });
  }

  private deserialize(data: DeserializeListArgs): List {
    if (!data) {
      throw new Error('Invalid List Data');
    }
    return List.new({
      id: data.id as ListID,
      title: data.title,
      ownerId: data.accountId as AccountID,
      publicity: data.visibility === 1 ? 'PUBLIC' : 'PRIVATE',
      createdAt: data.createdAt,
      // ToDo: fill here
      memberIds: data.listMember.map((v) => v.memberId as AccountID),
    });
  }

  private serializeVisibility(isPublic: boolean): number {
    // NOTE: private: 0, public: 1
    return isPublic ? 1 : 0;
  }

  async create(list: List): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.list.create({
        data: {
          id: list.getId(),
          title: list.getTitle(),
          visibility: this.serializeVisibility(list.isPublic()),
          account: {
            connect: {
              id: list.getOwnerId(),
            },
          },
          createdAt: list.getCreatedAt(),
        },
      });
    } catch (e) {
      return Result.err(this.parsePrismaError(e));
    }
    return Result.ok(undefined);
  }

  async fetchListsByOwnerId(
    ownerId: AccountID,
  ): Promise<Result.Result<Error, List[]>> {
    try {
      const res = await this.prisma.list.findMany({
        where: {
          accountId: ownerId,
          deletedAt: undefined,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          listMember: {
            where: {
              deletedAt: undefined,
            },
            select: {
              memberId: true,
            },
          },
        },
      });
      return Result.ok(res.map((v) => this.deserialize(v)));
    } catch (e) {
      return Result.err(this.parsePrismaError(e));
    }
  }

  async fetchList(listId: ListID): Promise<Result.Result<Error, List>> {
    try {
      const res = await this.prisma.list.findUnique({
        where: {
          id: listId,
          deletedAt: undefined,
        },
        include: {
          listMember: {
            where: {
              deletedAt: undefined,
            },
            select: {
              memberId: true,
            },
          },
        },
      });
      return Result.ok(this.deserialize(res));
    } catch (e) {
      return Result.err(this.parsePrismaError(e));
    }
  }

  async fetchListMembers(
    listId: ListID,
  ): Promise<Result.Result<Error, AccountID[]>> {
    try {
      const res = await this.prisma.listMember.findMany({
        where: {
          listId: listId,
          deletedAt: undefined,
        },
      });

      if (!res) {
        return Result.err(new Error('List member not found'));
      }
      return Result.ok(res.map((v) => v.memberId as AccountID));
    } catch (e) {
      return Result.err(this.parsePrismaError(e));
    }
  }

  async fetchListsByMemberAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, List[]>> {
    try {
      const res = await this.prisma.list.findMany({
        where: {
          deletedAt: undefined,
          listMember: {
            every: {
              memberId: accountID,
            },
          },
        },
        include: {
          listMember: {
            where: {
              deletedAt: undefined,
            },
            select: {
              memberId: true,
            },
          },
        },
      });

      return Result.ok(res.map((v) => this.deserialize(v)));
    } catch (e) {
      return Result.err(this.parsePrismaError(e));
    }
  }

  async edit(list: List): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.list.update({
        where: {
          id: list.getId(),
        },
        data: {
          title: list.getTitle(),
          visibility: this.serializeVisibility(list.isPublic()),
        },
      });

      return Result.ok(undefined);
    } catch (e) {
      return Result.err(this.parsePrismaError(e));
    }
  }

  async deleteById(listId: ListID): Promise<Result.Result<Error, void>> {
    try {
      // NOTE: delete list
      await this.prisma.list.updateMany({
        where: {
          id: listId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
      // NOTE: then delete list members
      await this.prisma.listMember.updateMany({
        where: {
          listId: listId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return Result.ok(undefined);
    } catch (e) {
      return Result.err(this.parsePrismaError(e));
    }
  }
}
export const prismaListRepo = (client: PrismaClient) =>
  Ether.newEther(listRepoSymbol, () => new PrismaListRepository(client));
