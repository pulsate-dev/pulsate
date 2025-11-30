import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export class RenoteStatus {
  private constructor(
    private readonly actorId: AccountID,
    private readonly noteId: NoteID,
    private readonly isRenoted: boolean,
  ) {}

  static new(actorId: AccountID, noteId: NoteID, isRenoted: boolean) {
    return new RenoteStatus(actorId, noteId, isRenoted);
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

export const findRenoteStatusByNoteID =
  (noteId: NoteID) =>
  (renoteStatus: RenoteStatus): boolean =>
    renoteStatus.getNoteID() === noteId;
