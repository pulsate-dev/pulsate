import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import { type Note, type NoteID } from '../../model/note.js';
import type { NoteRepository, NoteFilter } from '../../model/repository.js';

const NOTES_LIMIT = /* hard-coded */ 20;

export class InMemoryNoteRepository implements NoteRepository {
  private readonly notes: Map<ID<NoteID>, Note>;

  constructor(notes: Note[] = []) {
    this.notes = new Map(notes.map((note) => [note.getID(), note]));
  }

  async create(note: Note): Promise<Result.Result<Error, void>> {
    this.notes.set(note.getID(), note);
    return Result.ok(undefined);
  }

  async getFiltered(
    filters: NoteFilter[],
  ): Promise<Result.Result<Error, Note[]>> {
    let notes = this.notes.values();
    for (const f of filters) {
      switch (f.type) {
        case 'author':
          notes = notes.filter((n) => {
            return f.any.find((v) => v === n.getAuthorID()) !== undefined;
          });
          break;

        case 'attachment':
          notes = notes.filter(() => {
            return /* hard-coded */ 0 > f.more;
          });
          break;

        case 'cw':
          notes = notes.filter((n) => {
            return n.getCwComment() === f.is;
          });
          break;

        case 'created':
          notes = notes.filter((n) => {
            return n.getCreatedAt() < f.less;
          });
          break;

        case 'updated':
          notes = notes.filter((n) => {
            return Option.map((v: Date) => v < f.less)(n.getUpdatedAt());
          });
          break;

        case 'deleted':
          notes = notes.filter((n) => {
            return Option.isSome(n.getDeletedAt()) === f.has;
          });
          break;
      }
    }

    return Result.ok(notes.take(NOTES_LIMIT).toArray());
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
    authorID: ID<AccountID>,
    limit: number,
  ): Promise<Option.Option<Note[]>> {
    const res = [...this.notes.values()].filter(
      (note) => note.getID() === authorID,
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
