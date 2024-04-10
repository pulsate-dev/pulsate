import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { NoteID } from './note.js';

export interface CreateBookmarkArgs {
  noteID: ID<NoteID>;
  accountID: ID<AccountID>;
}

export class Bookmark {
  private constructor(arg: CreateBookmarkArgs) {
    this.noteID = arg.noteID;
    this.accountID = arg.accountID;
  }

  static new(arg: CreateBookmarkArgs) {
    return new Bookmark(arg);
  }

  private readonly noteID: ID<NoteID>;

  getNoteID(): ID<NoteID> {
    return this.noteID;
  }

  private readonly accountID: ID<AccountID>;

  getAccountID(): ID<AccountID> {
    return this.accountID;
  }
}
