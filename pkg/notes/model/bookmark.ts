import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export interface CreateBookmarkArgs {
  noteID: NoteID;
  accountID: AccountID;
}

export class Bookmark {
  readonly #noteID: NoteID;
  readonly #accountID: AccountID;

  private constructor(arg: CreateBookmarkArgs) {
    this.#noteID = arg.noteID;
    this.#accountID = arg.accountID;
  }

  static new(arg: CreateBookmarkArgs): Bookmark {
    return new Bookmark(arg);
  }

  getNoteID(): NoteID {
    return this.#noteID;
  }

  getAccountID(): AccountID {
    return this.#accountID;
  }
}
