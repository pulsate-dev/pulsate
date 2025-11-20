import { Cat, Ether, type Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../accounts/model/account.js';
import { isProduction } from '../adaptors/env.js';
import { prismaClient } from '../adaptors/prisma.js';
import type { Medium } from '../drive/model/medium.js';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../notes/adaptor/repository/dummy.js';
import {
  PrismaNoteAttachmentRepository,
  PrismaNoteRepository,
  PrismaReactionRepository,
} from '../notes/adaptor/repository/prisma.js';
import type { NoteID } from '../notes/model/note.js';
import type { Reaction } from '../notes/model/reaction.js';
import {
  type NoteRepository,
  noteAttachmentRepoSymbol,
  reactionRepoSymbol,
} from '../notes/model/repository.js';
import { type FetchService, fetch } from '../notes/service/fetch.js';
import {
  accountModule,
  accountModuleFacadeSymbol,
  dummyAccountModuleFacade,
} from './account.js';

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

  /**
   * @description Check if the specified account has renoted each of the given notes
   * @param accountID account ID to check
   * @param noteIDs note IDs to check
   * @returns boolean array indicating whether the account has renoted each note (true if renoted, false otherwise)
   */
  async fetchRenoteStatus(
    accountID: AccountID,
    noteIDs: NoteID[],
  ): Promise<boolean[]> {
    return await this.fetchService.fetchRenoteStatus(accountID, noteIDs);
  }
}

const attachmentRepoObject = isProduction
  ? new PrismaNoteAttachmentRepository(prismaClient)
  : new InMemoryNoteAttachmentRepository([], []);
const reactionRepoObject = isProduction
  ? new PrismaReactionRepository(prismaClient)
  : new InMemoryReactionRepository();
const noteRepoObject = isProduction
  ? new PrismaNoteRepository(prismaClient)
  : new InMemoryNoteRepository();
const accountModuleFacade = Ether.newEther(accountModuleFacadeSymbol, () =>
  isProduction ? accountModule : dummyAccountModuleFacade,
);
const noteAttachmentRepository = Ether.newEther(
  noteAttachmentRepoSymbol,
  () => attachmentRepoObject,
);
const reactionRepository = Ether.newEther(
  reactionRepoSymbol,
  () => reactionRepoObject,
);
const noteRepository = Ether.newEther(
  Ether.newEtherSymbol<NoteRepository>(),
  () => noteRepoObject,
);
export const noteModuleFacadeSymbol = Ether.newEtherSymbol<NoteModuleFacade>();

/**
 *  Dependency Injected NoteModule Object
 *  production: Prisma Repository / development: InMemory Repository  (auto-detected)
 */
export const noteModule = new NoteModuleFacade(
  Ether.runEther(
    Cat.cat(fetch)
      .feed(Ether.compose(noteRepository))
      .feed(Ether.compose(accountModuleFacade))
      .feed(Ether.compose(noteAttachmentRepository))
      .feed(Ether.compose(reactionRepository)).value,
  ),
);

/**
 * Dependency Injected NoteModule Ether Object
 *  production: Prisma Repository / development: InMemory Repository  (auto-detected)
 */
export const noteModuleEther = Ether.newEther(
  noteModuleFacadeSymbol,
  () => noteModule,
);
