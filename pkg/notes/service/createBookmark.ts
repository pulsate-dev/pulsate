import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import {
  NoteBookmarkAlreadyCreatedError,
  NoteNotFoundError,
} from '../model/errors.js';
import type { Note, NoteID } from '../model/note.js';
import {
  type BookmarkRepository,
  type NoteRepository,
  bookmarkRepoSymbol,
  noteRepoSymbol,
} from '../model/repository.js';

export class CreateBookmarkService {
  constructor(
    private readonly bookmarkRepository: BookmarkRepository,
    private readonly noteRepository: NoteRepository,
  ) {}

  async handle(
    noteID: NoteID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, Note>> {
    const note = await this.noteRepository.findByID(noteID);
    if (Option.isNone(note)) {
      return Result.err(
        new NoteNotFoundError('Note not found', { cause: null }),
      );
    }

    const existBookmark = await this.bookmarkRepository.findByID({
      noteID,
      accountID,
    });

    if (Option.isSome(existBookmark)) {
      return Result.err(
        new NoteBookmarkAlreadyCreatedError('bookmark has already created', {
          cause: null,
        }),
      );
    }

    const creation = await this.bookmarkRepository.create({
      noteID,
      accountID,
    });

    return Result.map(() => Option.unwrap(note))(creation);
  }
}

export const createBookmarkSymbol =
  Ether.newEtherSymbol<CreateBookmarkService>();
export const createBookmark = Ether.newEther(
  createBookmarkSymbol,
  ({ bookmarkRepository, noteRepository }) =>
    new CreateBookmarkService(bookmarkRepository, noteRepository),
  {
    bookmarkRepository: bookmarkRepoSymbol,
    noteRepository: noteRepoSymbol,
  },
);
