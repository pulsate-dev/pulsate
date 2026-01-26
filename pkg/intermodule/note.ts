import { Cat, Ether, type Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../accounts/model/account.js';
import { isProduction } from '../adaptors/env.js';
import { prismaClient } from '../adaptors/prisma.js';
import type { Medium } from '../drive/model/medium.js';
import { clockSymbol, snowflakeIDGenerator } from '../id/mod.js';
import {
  inMemoryNoteAttachmentRepo,
  inMemoryNoteRepo,
  inMemoryReactionRepo,
} from '../notes/adaptor/repository/dummy.js';
import {
  prismaNoteAttachmentRepo,
  prismaNoteRepo,
  prismaReactionRepo,
} from '../notes/adaptor/repository/prisma.js';
import type { Note, NoteID } from '../notes/model/note.js';
import type { Reaction } from '../notes/model/reaction.js';
import type { RenoteStatus } from '../notes/model/renoteStatus.js';
import { type CreateService, createService } from '../notes/service/create.js';
import { type FetchService, fetch } from '../notes/service/fetch.js';
import {
  accountModule,
  accountModuleFacadeSymbol,
  dummyAccountModuleFacade,
} from './account.js';
import { timelineModuleFacadeEther } from './timeline.js';

export class NoteModuleFacade {
  constructor(
    private readonly fetchService: FetchService,
    private readonly createNoteService: CreateService,
  ) {}

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
  ): Promise<RenoteStatus[]> {
    return await this.fetchService.fetchRenoteStatus(accountID, noteIDs);
  }

  // NOTE: The following section is used only in development mode to synchronize Note data between the Note and Timeline modules. Calls from production mode or from modules other than Timeline are prohibited.

  subscribeNoteCreation(callback: (note: Note) => Promise<void>): void {
    this.createNoteService.subscribeNoteCreated(callback);
  }
}

// NOTE: These dependency Ethers are shared between intermodule and notes module to ensure the same instances are used
export const noteAttachmentRepoEther = isProduction
  ? prismaNoteAttachmentRepo(prismaClient)
  : inMemoryNoteAttachmentRepo([], []);
export const noteReactionRepoEther = isProduction
  ? prismaReactionRepo(prismaClient)
  : inMemoryReactionRepo([]);
export const noteRepoEther = isProduction
  ? prismaNoteRepo(prismaClient)
  : inMemoryNoteRepo([]);
const accountModuleFacade = Ether.newEther(accountModuleFacadeSymbol, () =>
  isProduction ? accountModule : dummyAccountModuleFacade,
);
export const noteModuleFacadeSymbol = Ether.newEtherSymbol<NoteModuleFacade>();

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
export const noteClockEther = Ether.newEther(clockSymbol, () => new Clock());
export const noteIdGeneratorEther = Ether.compose(noteClockEther)(
  snowflakeIDGenerator(0),
);

/**
 *  Shared Service Instances
 *  NOTE: These instances are shared between intermodule and notes module to ensure subscription works correctly
 */
export const noteFetchServiceInstance = Ether.runEther(
  Cat.cat(fetch)
    .feed(Ether.compose(noteRepoEther))
    .feed(Ether.compose(accountModuleFacade))
    .feed(Ether.compose(noteAttachmentRepoEther))
    .feed(Ether.compose(noteReactionRepoEther)).value,
);

export const noteCreateServiceInstance = Ether.runEther(
  Cat.cat(createService)
    .feed(Ether.compose(noteRepoEther))
    .feed(Ether.compose(noteClockEther))
    .feed(Ether.compose(noteIdGeneratorEther))
    .feed(Ether.compose(noteAttachmentRepoEther))
    .feed(Ether.compose(timelineModuleFacadeEther)).value,
);

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
