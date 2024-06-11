import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import { Bookmark } from '../../model/bookmark.js';
import { type Note, type NoteID } from '../../model/note.js';
import type {
  BookmarkRepository,
  NoteRepository,
} from '../../model/repository.js';

export class InMemoryNoteRepository implements NoteRepository {
  private readonly notes: Map<ID<NoteID>, Note>;

  constructor(notes: Note[] = []) {
    this.notes = new Map(notes.map((note) => [note.getID(), note]));
  }

  async create(note: Note): Promise<Result.Result<Error, void>> {
    this.notes.set(note.getID(), note);
    return Result.ok(undefined);
  }

  async deleteByID(id: ID<NoteID>): Promise<Result.Result<Error, void>> {
    const target = await this.findByID(id);
    if (Option.isNone(target)) {
      return Result.err(new Error('note not found'));
    }

    this.notes.delete(Option.unwrap(target).getID());
    return Result.ok(undefined);
  }

  findByAuthorID(
    authorID: AccountID,
    limit: number,
  ): Promise<Option.Option<Note[]>> {
    const res = [...this.notes.values()].filter(
      (note) => note.getAuthorID() === authorID,
    );
    if (res.length === 0) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(
      Option.some(
        res
          .sort((a, b) => (a.getCreatedAt() < b.getCreatedAt() ? 1 : -1))
          .slice(0, limit),
      ),
    );
  }

  findByID(id: ID<NoteID>): Promise<Option.Option<Note>> {
    const res = this.notes.get(id);
    if (!res) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(Option.some(res));
  }
}

export class InMemoryBookmarkRepository implements BookmarkRepository {
  private readonly bookmarks: Map<[ID<NoteID>, AccountID], Bookmark>;

  private equalID(
    a: [ID<NoteID>, AccountID],
    b: [ID<NoteID>, AccountID],
  ): boolean {
    return a[0] === b[0] && a[1] === b[1];
  }

  constructor(bookmarks: Bookmark[] = []) {
    this.bookmarks = new Map(
      bookmarks.map((bookmark) => [
        [bookmark.getNoteID(), bookmark.getAccountID()],
        bookmark,
      ]),
    );
  }

  async create(id: {
    noteID: ID<NoteID>;
    accountID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const bookmark = Bookmark.new(id);
    this.bookmarks.set([id.noteID, id.accountID], bookmark);
    return Result.ok(undefined);
  }

  async deleteByID(id: {
    noteID: ID<NoteID>;
    accountID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const key = Array.from(this.bookmarks.keys()).find((k) =>
      this.equalID(k, [id.noteID, id.accountID]),
    );

    if (!key) {
      return Result.err(new Error('bookmark not found'));
    }

    this.bookmarks.delete(key);
    return Result.ok(undefined);
  }

  async findByID(id: {
    noteID: ID<NoteID>;
    accountID: AccountID;
  }): Promise<Option.Option<Bookmark>> {
    const bookmark = Array.from(this.bookmarks.entries()).find((v) =>
      this.equalID(v[0], [id.noteID, id.accountID]),
    );
    if (!bookmark) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(Option.some(bookmark[1]));
  }

  async findByAccountID(id: AccountID): Promise<Option.Option<Bookmark[]>> {
    const bookmarks = Array.from(this.bookmarks.entries())
      .filter((v) => v[0][1] === id)
      .map((v) => v[1]);

    if (bookmarks.length === 0) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(bookmarks));
  }
}
