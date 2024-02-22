import type { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { Note, NoteID } from './note.js';

export interface NoteRepository {
  create(note: Note): Promise<Result.Result<Error, void>>;
  findByAuthorID(
    authorID: ID<AccountID>,
    limit: number,
  ): Promise<Option.Option<Note[]>>;
  findByID(id: ID<NoteID>): Promise<Option.Option<Note>>;
  deleteByID(id: ID<NoteID>): Promise<Result.Result<Error, void>>;
}
