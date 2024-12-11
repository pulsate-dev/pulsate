import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import { AccountNotFoundError } from '../../../accounts/model/errors.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import {
  ListInternalError,
  ListNotFoundError,
  TimelineInvalidFilterRangeError,
} from '../../model/errors.js';
import type { List, ListID } from '../../model/list.js';
import {
  type FetchAccountTimelineFilter,
  type ListRepository,
  type TimelineRepository,
  listRepoSymbol,
  timelineRepoSymbol,
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
    if (filter.afterID && filter.beforeId) {
      return Result.err(
        new TimelineInvalidFilterRangeError(
          'beforeID and afterID cannot be specified at the same time',
          { cause: null },
        ),
      );
    }

    const accountNotes = [...this.data].filter(
      ([_, note]) => note.getAuthorID() === accountId,
    );

    // NOTE: filter out DIRECT notes
    const filtered = accountNotes
      .filter(([_, note]) => note.getVisibility() !== 'DIRECT')
      .map((v) => v[1]);

    // ToDo: filter hasAttachment, noNSFW
    filtered.sort(
      (a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime(),
    );

    if (filter.afterID) {
      const afterIndex = filtered
        .reverse()
        .findIndex((note) => note.getID() === filter.afterID);

      return Result.ok(filtered.slice(afterIndex).reverse());
    }

    if (filter.beforeId) {
      const beforeIndex = filter.beforeId
        ? filtered.findIndex((note) => note.getID() === filter.beforeId)
        : filtered.length;

      return Result.ok(filtered.slice(beforeIndex + 1));
    }

    // ToDo: replace 20 with constant
    // NOTE: 20 is the default number of notes to be returned
    return Result.ok(filtered.slice(0, 20));
  }

  async getHomeTimeline(
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    const notes: Note[] = [];
    for (const noteID of noteIDs) {
      const n = this.data.get(noteID);
      if (!n) {
        // ToDo: return NoteNotFoundError
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

    return Result.ok(filtered);
  }

  async fetchListTimeline(
    noteId: readonly NoteID[],
  ): Promise<Result.Result<Error, Note[]>> {
    const notes: Note[] = [];
    for (const noteID of noteId) {
      const n = this.data.get(noteID);
      if (!n) {
        // ToDo: return NoteNotFoundError
        return Result.err(new Error('Not found'));
      }
      notes.push(n);
    }

    // NOTE: filter out DIRECT notes
    // ToDo: Consider whether to filter out when Visibility is ‘FOLLOWERS’.
    const filtered = notes.filter((note) => note.getVisibility() !== 'DIRECT');

    return Result.ok(
      filtered.sort(
        (a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime(),
      ),
    );
  }

  reset(data: readonly Note[] = []) {
    this.data.clear();
    this.data = new Map(data.map((v) => [v.getID(), v]));
  }
}
export const inMemoryTimelineRepo = (data?: Note[]) =>
  Ether.newEther(
    timelineRepoSymbol,
    () => new InMemoryTimelineRepository(data),
  );

export class InMemoryListRepository implements ListRepository {
  private listData: Map<ListID, List>;
  private notes: Map<NoteID, Note>;

  constructor(data: readonly List[] = [], notes: readonly Note[] = []) {
    this.listData = new Map(data.map((v) => [v.getId(), v]));
    this.notes = new Map(notes.map((v) => [v.getID(), v]));
  }

  async create(list: List): Promise<Result.Result<Error, void>> {
    if (this.listData.has(list.getId())) {
      return Result.err(
        new ListInternalError('List already exists', { cause: null }),
      );
    }
    this.listData.set(list.getId(), list);
    return Result.ok(undefined);
  }

  async edit(list: List): Promise<Result.Result<Error, void>> {
    this.listData.set(list.getId(), list);
    return Result.ok(undefined);
  }

  async deleteById(listId: ListID): Promise<Result.Result<Error, void>> {
    if (!this.listData.delete(listId)) {
      return Result.err(
        new ListNotFoundError('List not found', { cause: null }),
      );
    }
    return Result.ok(undefined);
  }

  async fetchList(listId: ListID): Promise<Result.Result<Error, List>> {
    const list = this.listData.get(listId);
    if (!list) {
      return Result.err(new ListNotFoundError('Not found', { cause: null }));
    }
    return Result.ok(list);
  }

  async fetchListsByMemberAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, List[]>> {
    const lists = [...this.listData.values()].filter((list) =>
      list.getMemberIds().includes(accountID),
    );
    return Result.ok(lists);
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
      return Result.err(new ListNotFoundError('Not found', { cause: null }));
    }
    return Result.ok(list.getMemberIds() as AccountID[]);
  }

  async appendListMember(
    listID: ListID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const list = this.listData.get(listID);
    if (!list) {
      return Result.err(new ListNotFoundError('Not found', { cause: null }));
    }

    if (list.getMemberIds().includes(accountID)) {
      // ToDo: Replace Error to ListMemberAlreadyExistsError
      return Result.err(
        new ListInternalError('Account already exists', { cause: null }),
      );
    }

    list.addMember(accountID);

    return Result.ok(undefined);
  }

  async removeListMember(
    listID: ListID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    const list = this.listData.get(listID);
    if (!list) {
      return Result.err(new ListNotFoundError('Not found', { cause: null }));
    }

    if (!list.getMemberIds().includes(accountID)) {
      return Result.err(
        new AccountNotFoundError('List member not found', { cause: null }),
      );
    }

    list.removeMember(accountID);
    return Result.ok(undefined);
  }

  reset(data: readonly List[] = [], notes: readonly Note[] = []) {
    this.listData.clear();
    this.notes.clear();
    this.listData = new Map(data.map((v) => [v.getId(), v]));
    this.notes = new Map(notes.map((v) => [v.getID(), v]));
  }
}
export const inMemoryListRepo = (data?: List[], notes?: Note[]) =>
  Ether.newEther(listRepoSymbol, () => new InMemoryListRepository(data, notes));
