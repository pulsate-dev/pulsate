import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export interface CreateReactionArgs {
  noteID: NoteID;
  accountID: AccountID;
  emoji: string;
}

export class Reaction {
  private constructor(arg: CreateReactionArgs) {
    this.noteID = arg.noteID;
    this.accountID = arg.accountID;
    this.emoji = arg.emoji;
  }

  static new(arg: CreateReactionArgs) {
    return new Reaction(arg);
  }

  private readonly noteID: NoteID;
  getNoteID(): NoteID {
    return this.noteID;
  }

  private readonly accountID: AccountID;
  getAccountID(): AccountID {
    return this.accountID;
  }

  private readonly emoji: string;
  getEmoji(): string {
    return this.emoji;
  }
}
