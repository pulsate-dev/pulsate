import { Ether, type Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../accounts/model/account.ts';
import type { Medium } from '../drive/model/medium.ts';
import {
  noteAttachmentRepoEther,
  noteClockEther,
  noteCreateServiceInstance,
  noteFetchServiceInstance,
  noteIdGeneratorEther,
  noteReactionRepoEther,
  noteRepoEther,
} from '../notes/mod.ts';
import type { Note, NoteID } from '../notes/model/note.ts';
import type { Reaction } from '../notes/model/reaction.ts';
import type { RenoteStatus } from '../notes/model/renoteStatus.ts';

export class NoteModuleFacade {
  readonly #fetchService: typeof noteFetchServiceInstance;
  readonly #createNoteService: typeof noteCreateServiceInstance;
  constructor(
    fetchService: typeof noteFetchServiceInstance,
    createNoteService: typeof noteCreateServiceInstance,
  ) {
    this.#fetchService = fetchService;
    this.#createNoteService = createNoteService;
  }

  /**
   * @description Fetch note reactions
   * @param noteID note ID
   * @returns {@link Reaction} note reactions
   */
  async fetchReactions(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Reaction[]>> {
    return await this.#fetchService.fetchNoteReactions(noteID);
  }

  /**
   * @description Fetch note attachments
   * @param noteID note ID
   * @returns {@link Medium} note attachments
   */
  async fetchAttachments(
    noteID: NoteID,
  ): Promise<Result.Result<Error, Medium[]>> {
    return await this.#fetchService.fetchNoteAttachments(noteID);
  }

  /**
   * @description Check if the specified account has renoted each of the given notes
   * @param accountID account ID to check
   * @param noteIDs note IDs to check
   * @returns boolean array indicating whether the account has renoted each note (true if renoted, false otherwise)
   */
  async fetchRenoteStatus(
    accountID: AccountID,
    noteIDs: NoteID[],
  ): Promise<RenoteStatus[]> {
    return await this.#fetchService.fetchRenoteStatus(accountID, noteIDs);
  }

  // NOTE: The following section is used only in development mode to synchronize Note data between the Note and Timeline modules. Calls from production mode or from modules other than Timeline are prohibited.

  subscribeNoteCreation(callback: (note: Note) => Promise<void>): void {
    this.#createNoteService.subscribeNoteCreated(callback);
  }
}

// NOTE: Re-export dependency Ethers and Service instances from notes module
export {
  noteAttachmentRepoEther,
  noteClockEther,
  noteCreateServiceInstance,
  noteFetchServiceInstance,
  noteIdGeneratorEther,
  noteReactionRepoEther,
  noteRepoEther,
};

export const noteModuleFacadeSymbol = Ether.newEtherSymbol<NoteModuleFacade>();

/**
 *  Dependency Injected NoteModule Object
 *  production: Prisma Repository / development: InMemory Repository  (auto-detected)
 */
export const noteModule = new NoteModuleFacade(
  noteFetchServiceInstance,
  noteCreateServiceInstance,
);

/**
 * Dependency Injected NoteModule Ether Object
 *  production: Prisma Repository / development: InMemory Repository  (auto-detected)
 */
export const noteModuleEther = Ether.newEther(
  noteModuleFacadeSymbol,
  () => noteModule,
);
