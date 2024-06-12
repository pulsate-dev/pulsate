import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../accounts/model/account.js';
import { authenticateToken } from '../accounts/service/authenticationTokenService.js';
import { authenticateMiddleware } from '../adaptors/authenticateMiddleware.js';
import { prismaClient } from '../adaptors/prisma.js';
import { SnowflakeIDGenerator } from '../id/mod.js';
import type { ID } from '../id/type.js';
import { AccountModule } from '../intermodule/account.js';
import { BookmarkController } from './adaptor/controller/bookmark.js';
import { NoteController } from './adaptor/controller/note.js';
import {
  InMemoryBookmarkRepository,
  InMemoryNoteRepository,
} from './adaptor/repository/dummy.js';
import {
  PrismaBookmarkRepository,
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
  Variables: {
    /*
     * @description authorization token (JWT, ES256)
     */
    token: string;
    /*
     * @description whether the token is checked (if allowUnAuthorized set true, this will be false)
     */
    isValidToken: boolean;
    /*
     * @description account name (if allowUnAuthorized set true, this will be undefined)
     */
    accountName?: string;
  };
}>();
const noteRepository = isProduction
  ? new PrismaNoteRepository(prismaClient)
  : new InMemoryNoteRepository();
const bookmarkRepository = isProduction
  ? new PrismaBookmarkRepository(prismaClient)
  : new InMemoryBookmarkRepository();
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

// Account
const accountModule = new AccountModule();

// Note
const createService = new CreateService(noteRepository, idGenerator);
const fetchService = new FetchService(noteRepository, accountModule);
const renoteService = new RenoteService(noteRepository, idGenerator);
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
);

noteHandlers.doc('/notes/doc.json', {
  openapi: '3.0.0',
  info: {
    title: 'Notes API',
    version: '0.1.0',
  },
});

noteHandlers[CreateNoteRoute.method](
  CreateNoteRoute.path,
  AuthMiddleware.handle({ allowUnAuthorized: false }),
);
noteHandlers.openapi(CreateNoteRoute, async (c) => {
  const { content, visibility, contents_warning_comment, send_to } =
    c.req.valid('json');
  const res = await controller.createNote(
    '',
    content,
    visibility,
    contents_warning_comment,
    send_to,
  );
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1]);
});

noteHandlers[GetNoteRoute.method](
  GetNoteRoute.path,
  AuthMiddleware.handle({ allowUnAuthorized: true }),
);
noteHandlers.openapi(GetNoteRoute, async (c) => {
  const { id } = c.req.param();
  const res = await controller.getNoteByID(id);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  return c.json(res[1]);
});

noteHandlers[RenoteRoute.method](
  RenoteRoute.path,
  AuthMiddleware.handle({ allowUnAuthorized: false }),
);
noteHandlers.openapi(RenoteRoute, async (c) => {
  const { id } = c.req.param();
  const req = c.req.valid('json');
  const res = await controller.renote(
    id,
    req.content,
    req.contents_warning_comment,
    '',
    req.visibility,
  );

  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1]);
});

noteHandlers[CreateBookmarkRoute.method](
  CreateBookmarkRoute.path,
  AuthMiddleware.handle({ allowUnAuthorized: false }),
);
noteHandlers.openapi(CreateBookmarkRoute, async (c) => {
  const { id: noteID } = c.req.valid('param');
  // ToDo: read AccountID from token
  const res = await bookmarkController.createBookmark(
    noteID,
    '' as ID<AccountID>,
  );

  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1]);
});

noteHandlers[DeleteBookmarkRoute.method](
  DeleteBookmarkRoute.path,
  AuthMiddleware.handle({ allowUnAuthorized: false }),
);
noteHandlers.openapi(DeleteBookmarkRoute, async (c) => {
  const { id: noteID } = c.req.valid('param');
  // ToDo: read AccountID from token
  const res = await bookmarkController.deleteBookmark(
    noteID,
    '' as ID<AccountID>,
  );

  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return new Response(null, { status: 204 });
});
