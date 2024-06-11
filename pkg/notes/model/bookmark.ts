import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export interface CreateBookmarkArgs {
  noteID: NoteID;
  accountID: AccountID;
}

export class Bookmark {
  private constructor(arg: CreateBookmarkArgs) {
    this.noteID = arg.noteID;
    this.accountID = arg.accountID;
  }

  static new(arg: CreateBookmarkArgs) {
    return new Bookmark(arg);
  }

  private readonly noteID: NoteID;

  getNoteID(): NoteID {
    return this.noteID;
  }

  private readonly accountID: AccountID;

  getAccountID(): AccountID {
    return this.accountID;
  }
}
