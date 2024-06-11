import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import type { Note } from '../../../notes/model/note.js';
import type {
  FetchAccountTimelineFilter,
  TimelineRepository,
} from '../../model/repository.js';

export class InMemoryTimelineRepository implements TimelineRepository {
  private readonly data: Set<Note>;

  constructor(data: Note[] = []) {
    this.data = new Set<Note>(data);
  }

  async getAccountTimeline(
    accountId: ID<AccountID>,
    filter: FetchAccountTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    const accountNotes = [...this.data].filter(
      (note) => note.getAuthorID() === accountId,
    );

    // ToDo: filter hasAttachment, noNSFW
    accountNotes.sort((a, b) =>
      a.getCreatedAt().getTime() > b.getCreatedAt().getTime() ? 1 : -1,
    );
    const beforeIndex = filter.beforeId
      ? accountNotes.findIndex((note) => note.getID() === filter.beforeId)
      : accountNotes.length - 1;
    return Result.ok(accountNotes.slice(0, beforeIndex));
  }
}
