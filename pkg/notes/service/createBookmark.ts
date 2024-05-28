import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { Note, NoteID } from '../model/note.js';
import type {
  BookmarkRepository,
  NoteRepository,
} from '../model/repository.js';

export class CreateBookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async handle(
    noteID: ID<NoteID>,
    accountID: ID<AccountID>,
  ): Promise<Result.Result<Error, Note>> {
    const note = await this.noteRepository.findByID(noteID);
    if (Option.isNone(note)) {
      return Result.err(new Error('Note not found'));
    }

    const existBookmark = await this.bookmarkRepository.findByID({
      noteID,
      accountID,
    });

    if (Option.isSome(existBookmark)) {
      return Result.err(new Error('bookmark has already created'));
    }

    const creation = await this.bookmarkRepository.create({
      noteID,
      accountID,
    });

    return Result.map(() => Option.unwrap(note))(creation);
  }
}
