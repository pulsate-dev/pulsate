import { Result } from '@mikuroxina/mini-fn';
import type { PrismaClient } from '@prisma/client';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import type { Note } from '../../../notes/model/note.js';
import type {
  FetchAccountTimelineFilter,
  TimelineRepository,
} from '../../model/repository.js';

export class PrismaTimelineRepository implements TimelineRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getAccountTimeline(
    accountId: ID<AccountID>,
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
    return Result.err(new Error('Not implemented'));
  }
}
