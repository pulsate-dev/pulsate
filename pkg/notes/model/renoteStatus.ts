import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export class RenoteStatus {
  private constructor(
    private readonly actorId: AccountID,
    private readonly noteId: NoteID,
    private readonly isRenoted: boolean,
  ) {}

  static new(actorID: AccountID, noteID: NoteID, isRenoted: boolean) {
    return new RenoteStatus(actorID, noteID, isRenoted);
  }

  getActorID(): AccountID {
    return this.actorId;
  }

  getNoteID(): NoteID {
    return this.noteId;
  }

  getIsRenoted(): boolean {
    return this.isRenoted;
  }
}

export const findRenoteStatusByNoteID = (
  renoteStatus: RenoteStatus,
  noteId: NoteID,
) => {
  return renoteStatus.getNoteID() === noteId;
};
