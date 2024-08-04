import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export interface CreateReactionArgs {
  accountID: AccountID;
  noteID: NoteID;
  body: string;
}

export class Reaction {
  private constructor(arg: CreateReactionArgs) {
    this.accountID = arg.accountID;
    this.noteID = arg.noteID;
    this.body = arg.body;
  }

  static new(arg: CreateReactionArgs): Reaction {
    return new Reaction(arg);
  }

  private readonly accountID: AccountID;
  getAccountID(): AccountID {
    return this.accountID;
  }

  private readonly noteID: NoteID;
  getNoteID(): NoteID {
    return this.noteID;
  }

  private readonly body: string;
  getBody(): string {
    return this.body;
  }
}
