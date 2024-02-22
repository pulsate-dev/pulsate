import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { ID } from '../../../id/type.js';
import { type Note, type NoteID } from '../../model/note.js';
import type { NoteRepository } from '../../model/repository.js';

export class InMemoryNoteRepository implements NoteRepository {
  private readonly data: Set<Note>;

  constructor(notes?: Note[]) {
    this.data = !notes ? new Set() : new Set(notes);
  }

  async create(note: Note): Promise<Result.Result<Error, void>> {
    this.data.add(note);
    return Result.ok(undefined);
  }

  async deleteByID(id: ID<NoteID>): Promise<Result.Result<Error, void>> {
    const target = await this.findByID(id);
    if (Option.isNone(target)) {
      return Result.err(new Error('note not found'));
    }

    this.data.delete(Option.unwrap(target));
    return Result.ok(undefined);
  }

  findByAuthorID(
    authorID: ID<AccountID>,
    limit: number,
  ): Promise<Option.Option<Note[]>> {
    const res = [...this.data].filter((note) => note.getID() === authorID);
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
    const res = [...this.data].find((note) => note.getID() === id);
    if (!res) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(Option.some(res));
  }
}
