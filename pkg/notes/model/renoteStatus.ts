import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from './note.js';

export class RenoteStatus {
  readonly #actorId: AccountID;
  readonly #noteId: NoteID;
  readonly #isRenoted: boolean;
  private constructor(actorId: AccountID, noteId: NoteID, isRenoted: boolean) {
    this.#actorId = actorId;
    this.#noteId = noteId;
    this.#isRenoted = isRenoted;
  }

  static new(actorId: AccountID, noteId: NoteID, isRenoted: boolean) {
    return new RenoteStatus(actorId, noteId, isRenoted);
  }

  getActorID(): AccountID {
    return this.#actorId;
  }

  getNoteID(): NoteID {
    return this.#noteId;
  }

  getIsRenoted(): boolean {
    return this.#isRenoted;
  }
}

export const findRenoteStatusByNoteID =
  (noteId: NoteID) =>
  (renoteStatus: RenoteStatus): boolean =>
    renoteStatus.getNoteID() === noteId;
