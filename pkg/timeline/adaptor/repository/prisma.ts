import { Option, Result } from '@mikuroxina/mini-fn';
import type { Prisma, PrismaClient } from '@prisma/client';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
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
        id: v.id as ID<NoteID>,
        content: v.text,
        authorID: v.authorId as AccountID,
        createdAt: v.createdAt,
        deletedAt: !v.deletedAt ? Option.none() : Option.some(v.deletedAt),
        contentsWarningComment: '',
        originalNoteID: !v.renoteId
          ? Option.some(v.renoteId as ID<NoteID>)
          : Option.none(),
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
    console.log(filter);
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
    console.log(accountNotes);
    return Result.ok(this.deserialize(accountNotes));
  }
}
