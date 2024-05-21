import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import { SnowflakeIDGenerator } from '../id/mod.js';
import { AccountModule } from '../intermodule/account.js';
import { NoteController } from './adaptor/controller/note.js';
import { InMemoryNoteRepository } from './adaptor/repository/dummy.js';
import { CreateNoteRoute, GetNoteRoute, RenoteRoute } from './router.js';
import { CreateService } from './service/create.js';
import { FetchService } from './service/fetch.js';
import { RenoteService } from './service/renote.js';

export const noteHandlers = new OpenAPIHono();
const noteRepository = new InMemoryNoteRepository();
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
