import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AuthMiddlewareVariable } from '../adaptors/authenticateMiddleware.js';
import { SnowflakeIDGenerator } from '../id/mod.js';
import { accountModule } from '../intermodule/account.js';
import { TimelineController } from './adaptor/controller/timeline.js';
import {
  InMemoryListRepository,
  InMemoryTimelineRepository,
} from './adaptor/repository/dummy.js';
import {
  CreateListRoute,
  DeleteListRoute,
  EditListRoute,
  FetchListRoute,
  GetAccountTimelineRoute,
  GetListMemberRoute,
} from './router.js';
import { AccountTimelineService } from './service/account.js';
import { CreateListService } from './service/createList.js';
import { DeleteListService } from './service/deleteList.js';
import { EditListService } from './service/editList.js';
import { FetchListService } from './service/fetchList.js';
import { FetchListMemberService } from './service/fetchMember.js';
import { NoteVisibilityService } from './service/noteVisibility.js';

const idGenerator = new SnowflakeIDGenerator(0, {
  now: () => BigInt(Date.now()),
});

const timelineRepository = new InMemoryTimelineRepository();
const listRepository = new InMemoryListRepository();
const noteVisibilityService = new NoteVisibilityService(accountModule);

const controller = new TimelineController({
  accountTimelineService: new AccountTimelineService({
    noteVisibilityService: noteVisibilityService,
    timelineRepository: timelineRepository,
  }),
  createListService: new CreateListService(idGenerator, listRepository),
  editListService: new EditListService(listRepository),
  fetchListService: new FetchListService(listRepository),
  deleteListService: new DeleteListService(listRepository),
  accountModule,
  fetchMemberService: new FetchListMemberService(listRepository, accountModule),
});

export const timeline = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>().doc31('/timeline/doc.json', {
  openapi: '3.1.0',
  info: {
    title: 'Timeline API',
    version: '0.1.0',
  },
});
timeline.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

timeline.openapi(GetAccountTimelineRoute, async (c) => {
  // ToDo: get account id who is trying to see the timeline
  const { id } = c.req.param();
  const { has_attachment, no_nsfw, before_id } = c.req.valid('query');

  const res = await controller.getAccountTimeline(
    id,
    '',
    has_attachment,
    no_nsfw,
    before_id,
  );
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  return c.json(res[1], 200);
});

// ToDo: add account authorization
timeline.openapi(CreateListRoute, async (c) => {
  // NOTE: `public` is a reserved keyword
  const req = c.req.valid('json');
  const ownerID = Option.unwrap(c.get('accountID'));

  const res = await controller.createList(req.title, req.public, ownerID);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  return c.json(res[1], 200);
});

timeline.openapi(EditListRoute, async (c) => {
  const { id } = c.req.valid('param');
  const req = c.req.valid('json');

  const res = await controller.editList(id, req);

  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 400);
  }

  const list = Result.unwrap(res);

  return c.json(list, 200);
});

// ToDo: add account authorization
timeline.openapi(FetchListRoute, async (c) => {
  const { id } = c.req.valid('param');
  const res = await controller.fetchList(id);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  return c.json(Result.unwrap(res), 200);
});

// ToDo: add account authorization
timeline.openapi(DeleteListRoute, async (c) => {
  const { id } = c.req.valid('param');

  const res = await controller.deleteList(id);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  return new Response(undefined, { status: 204 });
});

// ToDo: add account authorization
timeline.openapi(GetListMemberRoute, async (c) => {
  const { id } = c.req.param();

  const res = await controller.getListMembers(id);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  const unwrapped = Result.unwrap(res);
  return c.json(unwrapped, 200);
});
