import { Option, Result } from '@mikuroxina/mini-fn';
import type { Prisma, PrismaClient } from '@prisma/client';

import type { AccountID } from '../../../accounts/model/account.js';
import {
  Note,
  type NoteID,
  type NoteVisibility,
} from '../../../notes/model/note.js';
import type {
  FetchAccountTimelineFilter,
  TimelineRepository,
} from '../../model/repository.js';

export class PrismaTimelineRepository implements TimelineRepository {
  private readonly TIMELINE_NOTE_LIMIT = 20;
  constructor(private readonly prisma: PrismaClient) {}

  private deserialize(
    data: Prisma.PromiseReturnType<typeof this.prisma.note.findMany>,
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
      cursor: {
        id: filter.beforeId ?? '',
      },
    });

    return Result.ok(this.deserialize(accountNotes));
  }

  async getHomeTimeline(
    noteIDs: NoteID[],
    filter: FetchAccountTimelineFilter,
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
      cursor: {
        id: filter.beforeId ?? '',
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
