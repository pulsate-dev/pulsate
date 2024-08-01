import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { authenticateToken } from '../accounts/service/authenticationTokenService.js';
import {
  type AuthMiddlewareVariable,
  authenticateMiddleware,
} from '../adaptors/authenticateMiddleware.js';
import { prismaClient } from '../adaptors/prisma.js';
import { SnowflakeIDGenerator } from '../id/mod.js';
import { accountModule } from '../intermodule/account.js';
import { BookmarkController } from './adaptor/controller/bookmark.js';
import { NoteController } from './adaptor/controller/note.js';
import {
  InMemoryBookmarkRepository,
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
} from './adaptor/repository/dummy.js';
import {
  PrismaBookmarkRepository,
  PrismaNoteAttachmentRepository,
  PrismaNoteRepository,
} from './adaptor/repository/prisma.js';
import {
  CreateBookmarkRoute,
  CreateNoteRoute,
  DeleteBookmarkRoute,
  GetNoteRoute,
  RenoteRoute,
} from './router.js';
import { CreateService } from './service/create.js';
import { CreateBookmarkService } from './service/createBookmark.js';
import { DeleteBookmarkService } from './service/deleteBookmark.js';
import { FetchService } from './service/fetch.js';
import { FetchBookmarkService } from './service/fetchBookmark.js';
import { RenoteService } from './service/renote.js';

const isProduction = process.env.NODE_ENV === 'production';
export const noteHandlers = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();
const noteRepository = isProduction
  ? new PrismaNoteRepository(prismaClient)
  : new InMemoryNoteRepository();
const bookmarkRepository = isProduction
  ? new PrismaBookmarkRepository(prismaClient)
  : new InMemoryBookmarkRepository();
const attachmentRepository = isProduction
  ? new PrismaNoteAttachmentRepository(prismaClient)
  : new InMemoryNoteAttachmentRepository([], []);
const idGenerator = new SnowflakeIDGenerator(0, {
  now: () => BigInt(Date.now()),
});

const composer = Ether.composeT(Promise.monad);
const liftOverPromise = <const D extends Record<string, symbol>, T>(
  ether: Ether.Ether<D, T>,
): Ether.EtherT<D, Promise.PromiseHkt, T> => ({
  ...ether,
  handler: (resolved) => Promise.pure(ether.handler(resolved)),
});
const AuthMiddleware = await Ether.runEtherT(
  Cat.cat(liftOverPromise(authenticateMiddleware)).feed(
    composer(authenticateToken),
  ).value,
);

// Note
const createService = new CreateService(
  noteRepository,
  idGenerator,
  attachmentRepository,
);
const fetchService = new FetchService(
  noteRepository,
  accountModule,
  attachmentRepository,
);
const renoteService = new RenoteService(
  noteRepository,
  idGenerator,
  attachmentRepository,
);
const controller = new NoteController(
  createService,
  fetchService,
  renoteService,
  accountModule,
);

// Bookmark
const createBookmarkService = new CreateBookmarkService(
  bookmarkRepository,
  noteRepository,
);
const fetchBookmarkService = new FetchBookmarkService(bookmarkRepository);
const deleteBookmarkService = new DeleteBookmarkService(bookmarkRepository);
const bookmarkController = new BookmarkController(
  createBookmarkService,
  fetchBookmarkService,
  deleteBookmarkService,
  fetchService,
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
    return c.json({ error: res[1].message }, 400);
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
    return c.json({ error: res[1].message }, 404);
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
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1], 200);
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
    return c.json({ error: res[1].message }, 404);
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
    return c.json({ error: res[1].message }, 400);
  }

  return new Response(null, { status: 204 });
});
