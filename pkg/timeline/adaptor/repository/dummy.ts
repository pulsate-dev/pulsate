import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import { AccountNotFoundError } from '../../../accounts/model/errors.js';
import type { Bookmark } from '../../../notes/model/bookmark.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import {
  ListInternalError,
  ListNotFoundError,
  TimelineInvalidFilterRangeError,
} from '../../model/errors.js';
import type { List, ListID } from '../../model/list.js';
import {
  type BookmarkTimelineFilter,
  type BookmarkTimelineRepository,
  bookmarkTimelineRepoSymbol,
  type ConversationRecipient,
  type ConversationRepository,
  conversationRepoSymbol,
  type FetchAccountTimelineFilter,
  type FetchConversationNotesFilter,
  type FetchHomeTimelineFilter,
  type ListRepository,
  listRepoSymbol,
  type TimelineRepository,
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

  async getPublicTimeline(
    filter: FetchHomeTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    if (filter.afterID && filter.beforeId) {
      return Result.err(
        new TimelineInvalidFilterRangeError(
          'beforeID and afterID cannot be specified at the same time',
          { cause: null },
        ),
      );
    }

    const publicNotes = [...this.data.values()]
      .filter((note) => note.getVisibility() === 'PUBLIC')
      .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());

    // ToDo: filter hasAttachment, noNSFW

    if (filter.afterID) {
      const afterIndex = publicNotes.findIndex(
        (note) => note.getID() === filter.afterID,
      );

      if (afterIndex === -1) {
        return Result.ok(publicNotes.slice(0, 20));
      }

      return Result.ok(publicNotes.slice(afterIndex + 1, afterIndex + 21));
    }

    if (filter.beforeId) {
      const beforeIndex = publicNotes.findIndex(
        (note) => note.getID() === filter.beforeId,
      );

      return Result.ok(publicNotes.slice(beforeIndex + 1, beforeIndex + 21));
    }

    return Result.ok(publicNotes.slice(0, 20));
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

export class InMemoryBookmarkTimelineRepository
  implements BookmarkTimelineRepository
{
  private data: Map<`${AccountID}_${NoteID}`, Bookmark>;

  constructor(data: readonly Bookmark[] = []) {
    this.data = new Map(
      data.map((v) => [`${v.getAccountID()}_${v.getNoteID()}`, v]),
    );
  }

  async findByAccountID(
    id: AccountID,
    filter: BookmarkTimelineFilter,
  ): Promise<Result.Result<Error, NoteID[]>> {
    if (filter.afterID && filter.beforeId) {
      return Result.err(
        new TimelineInvalidFilterRangeError(
          'beforeID and afterID cannot be specified at the same time',
          { cause: null },
        ),
      );
    }

    const accountNotes = [...this.data].filter(
      ([_, note]) => note.getAccountID() === id,
    );

    // NOTE: sort by NoteID
    accountNotes.sort((a, b) => (b[1].getNoteID() > a[1].getNoteID() ? 1 : -1));

    if (filter.afterID) {
      const afterIndex = accountNotes
        .reverse()
        .findIndex((bookmark) => bookmark[1].getNoteID() === filter.afterID);

      return Result.ok(
        accountNotes
          .slice(afterIndex)
          .reverse()
          .map((v) => v[1].getNoteID()),
      );
    }

    if (filter.beforeId) {
      const beforeIndex = accountNotes.findIndex(
        (bookmark) => bookmark[1].getNoteID() === filter.beforeId,
      );

      return Result.ok(
        accountNotes.slice(beforeIndex + 1).map((v) => v[1].getNoteID()),
      );
    }

    return Result.ok(accountNotes.slice(0, 20).map((v) => v[1].getNoteID()));
  }
}
export const inMemoryBookmarkTimelineRepo = (data?: Bookmark[]) =>
  Ether.newEther(
    bookmarkTimelineRepoSymbol,
    () => new InMemoryBookmarkTimelineRepository(data),
  );

/**
 * @description Sort notes by creation date (newest first)
 * @param a First note
 * @param b Second note
 * @returns Comparison result for sorting
 */
const sortByCreatedAtDesc = (a: Note, b: Note): number =>
  b.getCreatedAt().getTime() - a.getCreatedAt().getTime();

export class InMemoryConversationRepository implements ConversationRepository {
  private data: Note[];

  constructor(data?: Note[]) {
    this.data = data ?? [];
    // FIXME: Consider pre-sorting data at construction/insertion time to avoid O(N log N) sorting
    // on every query, which can be expensive during debugging with large datasets.
    // This would require maintaining sorted order when inserting new notes.
  }

  async findByAccountID(
    id: AccountID,
  ): Promise<Result.Result<Error, ConversationRecipient[]>> {
    const notes = this.data.filter(
      (v) => v.getAuthorID() === id || Option.unwrap(v.getSendTo()) === id,
    );

    // K: Recipient ID/ V: Conversation Notes
    const recipientMap = new Map<AccountID, Note[]>();
    for (const note of notes) {
      if (note.getAuthorID() === id) {
        // Sent
        if (recipientMap.has(Option.unwrap(note.getSendTo()))) {
          const tmp = recipientMap.get(Option.unwrap(note.getSendTo()));
          if (!tmp) throw new Error('Note not found');
          tmp.push(note);
          recipientMap.set(Option.unwrap(note.getSendTo()), tmp);
          continue;
        }
        recipientMap.set(Option.unwrap(note.getSendTo()), [note]);
        continue;
      }
      // Received
      if (recipientMap.has(note.getAuthorID())) {
        const tmp = recipientMap.get(note.getAuthorID());
        if (!tmp) throw new Error('Note not found');
        tmp.push(note);
        recipientMap.set(note.getAuthorID(), tmp);
        continue;
      }
      recipientMap.set(note.getAuthorID(), [note]);
    }

    const res: ConversationRecipient[] = [...recipientMap].map(([k, v]) => {
      const latestNote = v.toSorted(sortByCreatedAtDesc)[0];
      if (!latestNote) throw new Error('Note not found');

      return {
        id: k,
        lastSentAt: latestNote.getCreatedAt(),
        latestNoteID: latestNote.getID(),
        latestNoteAuthor: latestNote.getAuthorID(),
      };
    });
    return Result.ok(res);
  }

  async fetchConversationNotes(
    accountID: AccountID,
    recipientID: AccountID,
    filter: FetchConversationNotesFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    const notes = this.data.filter(
      (v) =>
        v.getVisibility() === 'DIRECT' &&
        ((v.getAuthorID() === accountID &&
          Option.unwrap(v.getSendTo()) === recipientID) ||
          (v.getAuthorID() === recipientID &&
            Option.unwrap(v.getSendTo()) === accountID)),
    );

    if (!filter.cursor) {
      const sortedNotes = notes.toSorted(sortByCreatedAtDesc);
      return Result.ok(sortedNotes.slice(0, filter.limit));
    }

    if (filter.cursor.type === 'before') {
      const beforeIndex = notes.findIndex(
        (n) => n.getID() === filter.cursor?.id,
      );
      if (beforeIndex === -1) {
        return Result.ok([]);
      }
      const slicedNotes = notes
        .slice(0, beforeIndex)
        .toSorted(sortByCreatedAtDesc);
      return Result.ok(slicedNotes.slice(0, filter.limit));
    }

    if (filter.cursor.type === 'after') {
      const afterIndex = notes.findIndex(
        (n) => n.getID() === filter.cursor?.id,
      );
      if (afterIndex === -1) {
        return Result.ok([]);
      }
      const slicedNotes = notes
        .slice(afterIndex + 1)
        .toSorted(sortByCreatedAtDesc);
      return Result.ok(slicedNotes.slice(0, filter.limit));
    }

    return Result.ok([]);
  }
}
export const inMemoryConversationRepo = (data?: Note[]) =>
  Ether.newEther(
    conversationRepoSymbol,
    () => new InMemoryConversationRepository(data),
  );
