import type { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { Note, NoteID } from './note.js';

export interface NoteRepository {
  create(note: Note): Promise<Result.Result<Error, void>>;
  getFiltered(filters: NoteFilter[]): Promise<Result.Result<Error, Note[]>>;
  findByAuthorID(
    authorID: ID<AccountID>,
    limit: number,
  ): Promise<Option.Option<Note[]>>;
  findByID(id: ID<NoteID>): Promise<Option.Option<Note>>;
  deleteByID(id: ID<NoteID>): Promise<Result.Result<Error, void>>;
}

export type NoteFilter =
  | { type: 'author'; any: ID<AccountID>[] }
  | { type: 'attachment'; more: number }
  | { type: 'cw'; is: string }
  | { type: 'created'; less: Date }
  | { type: 'updated'; less: Date }
  | { type: 'deleted'; has: boolean };
