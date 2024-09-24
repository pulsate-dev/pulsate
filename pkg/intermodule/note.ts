import type { Result } from '@mikuroxina/mini-fn';
import type { Medium } from '../drive/model/medium.js';
import type { NoteID } from '../notes/model/note.js';
import type { Reaction } from '../notes/model/reaction.js';
import type { FetchService } from '../notes/service/fetch.js';

export class NoteModuleFacade {
  constructor(private readonly fetchService: FetchService) {}

  /**
   * @description Fetch note reactions
   * @param noteID note ID
   * @returns {@link Reaction} note reactions
   */
  async fetchReactions(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Reaction[]>> {
    return await this.fetchService.fetchNoteReactions(noteID);
  }

  /**
   * @description Fetch note attachments
   * @param noteID note ID
   * @returns {@link Medium} note attachments
   */
  async fetchAttachments(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Medium[]>> {
    return await this.fetchService.fetchNoteAttachments(noteID);
  }
}
