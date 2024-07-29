import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import type { List, ListID } from '../../model/list.js';
import type {
  FetchAccountTimelineFilter,
  FetchHomeTimelineFilter,
  ListRepository,
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

  async fetchListTimeline(
    noteId: readonly NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    const notes: Note[] = [];
    for (const noteID of noteId) {
      const n = this.data.get(noteID);
      if (!n) {
        return Result.err(new Error('Not found'));
      }
      notes.push(n);
    }

    // NOTE: filter out DIRECT notes
    // ToDo: Consider whether to filter out when Visibility is ‘FOLLOWERS’.
    const filtered = notes.filter((note) => note.getVisibility() !== 'DIRECT');

    return Result.ok(filtered);
  }

  reset(data: readonly Note[] = []) {
    this.data.clear();
    this.data = new Map(data.map((v) => [v.getID(), v]));
  }
}

export class InMemoryListRepository implements ListRepository {
  private listData: Map<ListID, List>;
  private notes: Map<NoteID, Note>;

  constructor(data: readonly List[] = [], notes: readonly Note[] = []) {
    this.listData = new Map(data.map((v) => [v.getId(), v]));
    this.notes = new Map(notes.map((v) => [v.getID(), v]));
  }

  async create(list: List): Promise<Result.Result<Error, void>> {
    if (this.listData.has(list.getId())) {
      return Result.err(new Error('List already exists'));
    }
    this.listData.set(list.getId(), list);
    return Result.ok(undefined);
  }

  async deleteById(listId: ListID): Promise<Result.Result<Error, void>> {
    if (!this.listData.delete(listId)) {
      return Result.err(new Error('List not found'));
    }
    return Result.ok(undefined);
  }

  async fetchList(listId: ListID): Promise<Result.Result<Error, List>> {
    const list = this.listData.get(listId);
    if (!list) {
      return Result.err(new Error('Not found'));
    }
    return Result.ok(list);
  }

  async fetchListsByMemberAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, List[]>> {
    const lists = [...this.listData].filter((list) =>
      list[1].getMemberIds().includes(accountID),
    );
    return Result.ok(lists.map((list) => list[1]));
  }

  async fetchListsByOwnerId(
    ownerId: AccountID,
  ): Promise<Result.Result<Error, List[]>> {
    const lists = [...this.listData].filter(
      (list) => list[1].getOwnerId() === ownerId,
    );
    return Result.ok(lists.map((list) => list[1]));
  }

  async fetchListMembers(
    listId: ListID,
  ): Promise<Result.Result<Error, AccountID[]>> {
    const list = this.listData.get(listId);
    if (!list) {
      return Result.err(new Error('Not found'));
    }
    return Result.ok(list.getMemberIds() as AccountID[]);
  }

  reset(data: readonly List[] = [], notes: readonly Note[] = []) {
    this.listData.clear();
    this.notes.clear();
    this.listData = new Map(data.map((v) => [v.getId(), v]));
    this.notes = new Map(notes.map((v) => [v.getID(), v]));
  }
}
