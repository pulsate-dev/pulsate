import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../accounts/model/account.js';
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

export const noteHandlers = new OpenAPIHono();
const noteRepository = new InMemoryNoteRepository();
const bookmarkRepository = new InMemoryBookmarkRepository();
const idGenerator = new SnowflakeIDGenerator(0, {
  now: () => BigInt(Date.now()),
});

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

noteHandlers.openapi(GetNoteRoute, async (c) => {
  const { id } = c.req.param();
  const res = await controller.getNoteByID(id);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  return c.json(res[1]);
});

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
