import { Cat, Ether } from '@mikuroxina/mini-fn';

import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import {
  accountModule,
  accountModuleEther,
  accountModuleFacadeSymbol,
  dummyAccountModuleFacade,
} from '../intermodule/account.ts';
import { timelineModuleFacadeEther } from '../intermodule/timeline.ts';
import { eventPublisherEther } from '../internal/event/mod.ts';
import { clockSymbol, snowflakeIDGenerator } from '../internal/id/mod.ts';
import { BookmarkController } from './adaptor/controller/bookmark.ts';
import { NoteController } from './adaptor/controller/note.ts';
import { ReactionController } from './adaptor/controller/reaction.ts';
import {
  inMemoryBookmarkRepo,
  inMemoryNoteAttachmentRepo,
  inMemoryNoteRepo,
  inMemoryReactionRepo,
} from './adaptor/repository/dummy.ts';
import { prismaDirectNoteRepo } from './adaptor/repository/prisma/directNote.ts';
import {
  prismaBookmarkRepo,
  prismaNoteAttachmentRepo,
  prismaNoteRepo,
  prismaReactionRepo,
} from './adaptor/repository/prisma/note.ts';
import { createService } from './service/create.ts';
import { createBookmark } from './service/createBookmark.ts';
import { createReactionService } from './service/createReaction.ts';
import { deleteBookmarkService } from './service/deleteBookmark.ts';
import { deleteReaction } from './service/deleteReaction.ts';
import { fetch } from './service/fetch.ts';
import { renote } from './service/renote.ts';

// These dependency Ethers are shared with the intermodule layer so both use the same instances.
// DirectNote has no in-memory fallback and uses Prisma in every environment.
export const directNoteRepoEther = prismaDirectNoteRepo(prismaClient);
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

class Clock {
  now() {
    return BigInt(Date.now());
  }
}

export const noteClockEther = Ether.newEther(clockSymbol, () => new Clock());
export const noteIdGeneratorEther = Ether.compose(noteClockEther)(
  snowflakeIDGenerator(0),
);

/** Shared service instances used by the intermodule layer and Notes module. */
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
    .feed(Ether.compose(accountModuleFacade))
    .feed(Ether.compose(timelineModuleFacadeEther))
    .feed(Ether.compose(eventPublisherEther)).value,
);

const bookmarkRepository = isProduction
  ? prismaBookmarkRepo(prismaClient)
  : inMemoryBookmarkRepo([]);

const renoteServiceObj = Ether.runEther(
  Cat.cat(renote)
    .feed(Ether.compose(noteClockEther))
    .feed(Ether.compose(noteRepoEther))
    .feed(Ether.compose(noteIdGeneratorEther))
    .feed(Ether.compose(noteAttachmentRepoEther))
    .feed(Ether.compose(accountModuleEther))
    .feed(Ether.compose(timelineModuleFacadeEther))
    .feed(Ether.compose(eventPublisherEther)).value,
);

export const noteController = new NoteController(
  noteCreateServiceInstance,
  noteFetchServiceInstance,
  renoteServiceObj,
  isProduction ? accountModule : dummyAccountModuleFacade,
);

const createBookmarkServiceObj = Ether.runEther(
  Cat.cat(createBookmark)
    .feed(Ether.compose(noteRepoEther))
    .feed(Ether.compose(bookmarkRepository))
    .feed(Ether.compose(eventPublisherEther)).value,
);

const deleteBookmarkServiceObj = Ether.runEther(
  Cat.cat(deleteBookmarkService)
    .feed(Ether.compose(bookmarkRepository))
    .feed(Ether.compose(eventPublisherEther)).value,
);

export const bookmarkController = new BookmarkController(
  createBookmarkServiceObj,
  deleteBookmarkServiceObj,
  noteFetchServiceInstance,
);

const createReactionServiceObj = Ether.runEther(
  Cat.cat(createReactionService)
    .feed(Ether.compose(noteIdGeneratorEther))
    .feed(Ether.compose(noteReactionRepoEther))
    .feed(Ether.compose(noteRepoEther))
    .feed(Ether.compose(eventPublisherEther)).value,
);

const deleteReactionServiceObj = Ether.runEther(
  Cat.cat(deleteReaction)
    .feed(Ether.compose(noteReactionRepoEther))
    .feed(Ether.compose(noteRepoEther))
    .feed(Ether.compose(eventPublisherEther)).value,
);

export const reactionController = new ReactionController(
  createReactionServiceObj,
  noteFetchServiceInstance,
  deleteReactionServiceObj,
);
