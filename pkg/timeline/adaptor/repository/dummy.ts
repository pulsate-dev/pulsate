import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import type {
  FetchAccountTimelineFilter,
  FetchHomeTimelineFilter,
  TimelineRepository,
} from '../../model/repository.js';

export class InMemoryTimelineRepository implements TimelineRepository {
  private data: Map<NoteID, Note>;

  constructor(data: readonly Note[] = []) {
    this.data = new Map(data.map((v) => [v.getID(), v]));
  }

  async getAccountTimeline(
    accountId: AccountID,
    filter: FetchAccountTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    const accountNotes = [...this.data].filter(
      (note) => note[1].getAuthorID() === accountId,
    );

    // NOTE: filter out DIRECT notes
    const filtered = accountNotes.filter(
      (note) => note[1].getVisibility() !== 'DIRECT',
    );

    // ToDo: filter hasAttachment, noNSFW
    filtered.sort(
      (a, b) => b[1].getCreatedAt().getTime() - a[1].getCreatedAt().getTime(),
    );
    const beforeIndex = filter.beforeId
      ? filtered.findIndex((note) => note[1].getID() === filter.beforeId)
      : filtered.length;

    return Result.ok(filtered.slice(0, beforeIndex).map((note) => note[1]));
  }

  async getHomeTimeline(
    noteIDs: NoteID[],
    filter: FetchHomeTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    const notes: Note[] = [];
    for (const noteID of noteIDs) {
      const n = this.data.get(noteID);
      if (!n) {
        return Result.err(new Error('Not found'));
      }
      notes.push(n);
    }

    // NOTE: filter DIRECT notes
    const filtered = notes.filter((note) => note.getVisibility() !== 'DIRECT');
    // ToDo: filter hasAttachment, noNSFW
    filtered.sort(
      (a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime(),
    );
    const beforeIndex = filter.beforeId
      ? filtered.findIndex((note) => note.getID() === filter.beforeId)
      : filtered.length;

    return Result.ok(filtered.slice(0, beforeIndex));
  }

  reset(data: readonly Note[] = []) {
    this.data.clear();
    this.data = new Map(data.map((v) => [v.getID(), v]));
  }
}
