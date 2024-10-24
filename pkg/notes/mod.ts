import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { AccountNotFoundError } from '../accounts/model/errors.js';
import { authenticateToken } from '../accounts/service/authenticationTokenService.js';
import {
  type AuthMiddlewareVariable,
  authenticateMiddleware,
} from '../adaptors/authenticateMiddleware.js';
import { prismaClient } from '../adaptors/prisma.js';
import { clockSymbol, snowflakeIDGenerator } from '../id/mod.js';
import {
  accountModule,
  accountModuleEther,
  dummyAccountModuleFacade,
} from '../intermodule/account.js';
import { timelineModuleFacadeEther } from '../intermodule/timeline.js';
import { BookmarkController } from './adaptor/controller/bookmark.js';
import { NoteController } from './adaptor/controller/note.js';
import { ReactionController } from './adaptor/controller/reaction.js';
import {
  inMemoryBookmarkRepo,
  inMemoryNoteAttachmentRepo,
  inMemoryNoteRepo,
  inMemoryReactionRepo,
} from './adaptor/repository/dummy.js';
import {
  prismaBookmarkRepo,
  prismaNoteAttachmentRepo,
  prismaNoteRepo,
  prismaReactionRepo,
} from './adaptor/repository/prisma.js';
import {
  NoteAccountSilencedError,
  NoteAlreadyReactedError,
  NoteAttachmentNotFoundError,
  NoteEmojiNotFoundError,
  NoteNoDestinationError,
  NoteNotFoundError,
  NoteNotReactedYetError,
  NoteTooLongContentsError,
  NoteTooManyAttachmentsError,
  NoteVisibilityInvalidError,
} from './model/errors.js';
import {
  CreateBookmarkRoute,
  CreateNoteRoute,
  CreateReactionRoute,
  DeleteBookmarkRoute,
  DeleteReactionRoute,
  GetNoteRoute,
  RenoteRoute,
} from './router.js';
import { createService } from './service/create.js';
import { createBookmark } from './service/createBookmark.js';
import { createReactionService } from './service/createReaction.js';
import { deleteBookmarkService } from './service/deleteBookmark.js';
import { deleteReaction } from './service/deleteReaction.js';
import { fetch } from './service/fetch.js';
import { fetchBookmarkService } from './service/fetchBookmark.js';
import { renote } from './service/renote.js';

const isProduction = process.env.NODE_ENV === 'production';
export const noteHandlers = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();
const noteRepository = isProduction
  ? prismaNoteRepo(prismaClient)
  : inMemoryNoteRepo([]);
const bookmarkRepository = isProduction
  ? prismaBookmarkRepo(prismaClient)
  : inMemoryBookmarkRepo([]);
const reactionRepository = isProduction
  ? prismaReactionRepo(prismaClient)
  : inMemoryReactionRepo([]);
const attachmentRepository = isProduction
  ? prismaNoteAttachmentRepo(prismaClient)
  : inMemoryNoteAttachmentRepo([], []);

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const clock = Ether.newEther(clockSymbol, () => new Clock());
const idGenerator = Ether.compose(clock)(snowflakeIDGenerator(0));

const composer = Ether.composeT(Promise.monad);
const liftOverPromise = Ether.liftEther(Promise.monad);
const AuthMiddleware = await Ether.runEtherT(
  Cat.cat(liftOverPromise(authenticateMiddleware)).feed(
    composer(authenticateToken),
  ).value,
);

const createServiceObj = Ether.runEther(
  Cat.cat(createService)
    .feed(Ether.compose(noteRepository))
    .feed(Ether.compose(idGenerator))
    .feed(Ether.compose(attachmentRepository))
    .feed(Ether.compose(timelineModuleFacadeEther)).value,
);

const fetchServiceObj = Ether.runEther(
  Cat.cat(fetch)
    .feed(Ether.compose(noteRepository))
    .feed(Ether.compose(accountModuleEther))
    .feed(Ether.compose(attachmentRepository))
    .feed(Ether.compose(reactionRepository)).value,
);

const renoteServiceObj = Ether.runEther(
  Cat.cat(renote)
    .feed(Ether.compose(noteRepository))
    .feed(Ether.compose(idGenerator))
    .feed(Ether.compose(attachmentRepository))
    .feed(Ether.compose(accountModuleEther)).value,
);

const controller = new NoteController(
  createServiceObj,
  fetchServiceObj,
  renoteServiceObj,
  isProduction ? accountModule : dummyAccountModuleFacade,
);

// Bookmark
const createBookmarkServiceObj = Ether.runEther(
  Cat.cat(createBookmark)
    .feed(Ether.compose(noteRepository))
    .feed(Ether.compose(bookmarkRepository)).value,
);
const fetchBookmarkServiceObj = Ether.runEther(
  Cat.cat(fetchBookmarkService).feed(Ether.compose(bookmarkRepository)).value,
);
const bookmarkController = new BookmarkController(
  createBookmarkServiceObj,
  fetchBookmarkServiceObj,
  Ether.runEther(
    Cat.cat(deleteBookmarkService).feed(Ether.compose(bookmarkRepository))
      .value,
  ),
  fetchServiceObj,
);

// Reaction
const createReactionServiceObj = Ether.runEther(
  Cat.cat(createReactionService)
    .feed(Ether.compose(reactionRepository))
    .feed(Ether.compose(noteRepository)).value,
);
const deleteReactionServiceObj = Ether.runEther(
  Cat.cat(deleteReaction).feed(Ether.compose(reactionRepository)).value,
);
const reactionController = new ReactionController(
  createReactionServiceObj,
  fetchServiceObj,
  deleteReactionServiceObj,
);

noteHandlers.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});
noteHandlers.doc31('/notes/doc.json', {
  openapi: '3.1.0',
  info: {
    title: 'Notes API',
    version: '0.1.0',
  },
});

noteHandlers[CreateNoteRoute.method](
  CreateNoteRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(CreateNoteRoute, async (c) => {
  const {
    content,
    visibility,
    contents_warning_comment,
    send_to,
    attachment_file_ids,
  } = c.req.valid('json');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await controller.createNote({
    authorID: accountID,
    content,
    visibility,
    contentsWarningComment: contents_warning_comment,
    attachmentFileID: attachment_file_ids,
    sendTo: send_to,
  });
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof NoteTooManyAttachmentsError) {
      return c.json({ error: 'TOO_MANY_ATTACHMENTS' as const }, 400);
    }
    if (error instanceof NoteTooLongContentsError) {
      return c.json({ error: 'TOO_MANY_CONTENT' as const }, 400);
    }
    if (error instanceof NoteNoDestinationError) {
      return c.json({ error: 'NO_DESTINATION' as const }, 400);
    }
    if (error instanceof NoteVisibilityInvalidError) {
      return c.json({ error: 'INVALID_VISIBILITY' as const }, 400);
    }
    if (error instanceof NoteAccountSilencedError) {
      return c.json({ error: 'YOU_ARE_SILENCED' as const }, 403);
    }
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof NoteAttachmentNotFoundError) {
      return c.json({ error: 'ATTACHMENT_NOT_FOUND' as const }, 404);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[GetNoteRoute.method](
  GetNoteRoute.path,
  AuthMiddleware.handle({ forceAuthorized: false }),
);
noteHandlers.openapi(GetNoteRoute, async (c) => {
  const { id } = c.req.param();
  const res = await controller.getNoteByID(id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[RenoteRoute.method](
  RenoteRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(RenoteRoute, async (c) => {
  const { id } = c.req.param();
  const req = c.req.valid('json');
  const authorID = Option.unwrap(c.get('accountID'));

  const res = await controller.renote({
    originalNoteID: id,
    content: req.content,
    contentsWarningComment: req.contents_warning_comment,
    authorID: authorID,
    visibility: req.visibility,
    attachmentFileID: req.attachment_file_ids,
  });

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof NoteTooManyAttachmentsError) {
      return c.json({ error: 'TOO_MANY_ATTACHMENTS' as const }, 400);
    }
    if (error instanceof NoteTooLongContentsError) {
      return c.json({ error: 'TOO_MANY_CONTENT' as const }, 400);
    }
    if (error instanceof NoteNoDestinationError) {
      return c.json({ error: 'NO_DESTINATION' as const }, 400);
    }
    if (error instanceof NoteVisibilityInvalidError) {
      return c.json({ error: 'INVALID_VISIBILITY' as const }, 400);
    }
    if (error instanceof NoteAccountSilencedError) {
      return c.json({ error: 'YOU_ARE_SILENCED' as const }, 403);
    }
    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[CreateReactionRoute.method](
  CreateReactionRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(CreateReactionRoute, async (c) => {
  const { id } = c.req.valid('param');
  const req = c.req.valid('json');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await reactionController.create(id, accountID, req.emoji);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    if (error instanceof NoteAlreadyReactedError) {
      return c.json({ error: 'ALREADY_REACTED' as const }, 400);
    }
    if (error instanceof NoteEmojiNotFoundError) {
      return c.json({ error: 'EMOJI_NOT_FOUND' as const }, 400);
    }
    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});

noteHandlers[DeleteReactionRoute.method](
  DeleteReactionRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(DeleteReactionRoute, async (c) => {
  const { id } = c.req.valid('param');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await reactionController.delete(id, accountID);

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    if (error instanceof NoteNotReactedYetError) {
      return c.json({ error: 'NOT_REACTED' as const }, 404);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

noteHandlers[CreateBookmarkRoute.method](
  CreateBookmarkRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(CreateBookmarkRoute, async (c) => {
  const { id: noteID } = c.req.valid('param');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await bookmarkController.createBookmark(noteID, accountID);

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

noteHandlers[DeleteBookmarkRoute.method](
  DeleteBookmarkRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
noteHandlers.openapi(DeleteBookmarkRoute, async (c) => {
  const { id: noteID } = c.req.valid('param');
  const accountID = Option.unwrap(c.get('accountID'));

  const res = await bookmarkController.deleteBookmark(noteID, accountID);

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof NoteNotFoundError) {
      return c.json({ error: 'NOTE_NOT_FOUND' as const }, 404);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});
