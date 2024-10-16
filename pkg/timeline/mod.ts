import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import { AccountNotFoundError } from '../accounts/model/errors.js';
import { authenticateToken } from '../accounts/service/authenticationTokenService.js';
import {
  type AuthMiddlewareVariable,
  authenticateMiddleware,
} from '../adaptors/authenticateMiddleware.js';
import { prismaClient } from '../adaptors/prisma.js';
import { valkeyClient } from '../adaptors/valkey.js';
import { SnowflakeIDGenerator } from '../id/mod.js';
import {
  accountModule,
  dummyAccountModuleFacade,
} from '../intermodule/account.js';
import { noteModule } from '../intermodule/note.js';
import { TimelineController } from './adaptor/controller/timeline.js';
import {
  InMemoryListRepository,
  InMemoryTimelineRepository,
} from './adaptor/repository/dummy.js';
import { InMemoryTimelineCacheRepository } from './adaptor/repository/dummyCache.js';
import {
  PrismaListRepository,
  PrismaTimelineRepository,
} from './adaptor/repository/prisma.js';
import { ValkeyTimelineCacheRepository } from './adaptor/repository/valkeyCache.js';
import {
  ListNotFoundError,
  ListTitleTooLongError,
  TimelineBlockedByAccountError,
  TimelineNoMoreNotesError,
} from './model/errors.js';
import {
  CreateListRoute,
  DeleteListRoute,
  EditListRoute,
  FetchListRoute,
  GetAccountTimelineRoute,
  GetHomeTimelineRoute,
  GetListMemberRoute,
  GetListTimelineRoute,
} from './router.js';
import { AccountTimelineService } from './service/account.js';
import { CreateListService } from './service/createList.js';
import { DeleteListService } from './service/deleteList.js';
import { EditListService } from './service/editList.js';
import { FetchListService } from './service/fetchList.js';
import { FetchListMemberService } from './service/fetchMember.js';
import { HomeTimelineService } from './service/home.js';
import { ListTimelineService } from './service/list.js';
import { NoteVisibilityService } from './service/noteVisibility.js';

const isProduction = process.env.NODE_ENV === 'production';
const idGenerator = new SnowflakeIDGenerator(0, {
  now: () => BigInt(Date.now()),
});

const timelineRepository = isProduction
  ? new PrismaTimelineRepository(prismaClient)
  : new InMemoryTimelineRepository();
const listRepository = isProduction
  ? new PrismaListRepository(prismaClient)
  : new InMemoryListRepository();
const noteVisibilityService = new NoteVisibilityService(
  isProduction ? accountModule : dummyAccountModuleFacade,
);
// ToDo: export redis client instances at adaptors package
const timelineCacheRepository = isProduction
  ? new ValkeyTimelineCacheRepository(valkeyClient)
  : new InMemoryTimelineCacheRepository();

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
  listTimelineService: new ListTimelineService(
    timelineCacheRepository,
    timelineRepository,
  ),
  noteModule: noteModule,
  homeTimeline: new HomeTimelineService(
    timelineCacheRepository,
    timelineRepository,
  ),
});
const liftOverPromise = Ether.liftEther(Promise.monad);
const composer = Ether.composeT(Promise.monad);
const AuthMiddleware = await Ether.runEtherT(
  Cat.cat(liftOverPromise(authenticateMiddleware)).feed(
    composer(authenticateToken),
  ).value,
);

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

timeline[GetHomeTimelineRoute.method](
  GetHomeTimelineRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(GetHomeTimelineRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { has_attachment, no_nsfw, before_id } = c.req.valid('query');
  const res = await controller.getHomeTimeline(
    actorID,
    has_attachment,
    no_nsfw,
    before_id,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});

timeline[GetAccountTimelineRoute.method](
  GetAccountTimelineRoute.path,
  AuthMiddleware.handle({ forceAuthorized: false }),
);
timeline.openapi(GetAccountTimelineRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { id } = c.req.param();
  const { has_attachment, no_nsfw, before_id } = c.req.valid('query');

  const res = await controller.getAccountTimeline(
    id,
    actorID,
    has_attachment,
    no_nsfw,
    before_id,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof TimelineBlockedByAccountError) {
      return c.json({ error: 'YOU_ARE_BLOCKED' as const }, 403);
    }

    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

timeline[GetListTimelineRoute.method](
  GetListTimelineRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(GetListTimelineRoute, async (c) => {
  const { id } = c.req.param();

  const res = await controller.getListTimeline(id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

timeline[CreateListRoute.method](
  CreateListRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(CreateListRoute, async (c) => {
  // NOTE: `public` is a reserved keyword
  const req = c.req.valid('json');
  const ownerID = Option.unwrap(c.get('accountID'));

  const res = await controller.createList(req.title, req.public, ownerID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof ListTitleTooLongError) {
      return c.json({ error: 'TITLE_TOO_LONG' as const }, 400);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

timeline[EditListRoute.method](
  EditListRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(EditListRoute, async (c) => {
  const { id } = c.req.valid('param');
  const req = c.req.valid('json');

  const res = await controller.editList(id, req);

  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    if (error instanceof ListTitleTooLongError) {
      return c.json({ error: 'TITLE_TOO_LONG' as const }, 400);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  const list = Result.unwrap(res);

  return c.json(list, 200);
});

timeline[FetchListRoute.method](
  FetchListRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(FetchListRoute, async (c) => {
  const { id } = c.req.valid('param');
  const res = await controller.fetchList(id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});

timeline[DeleteListRoute.method](
  DeleteListRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(DeleteListRoute, async (c) => {
  const { id } = c.req.valid('param');

  const res = await controller.deleteList(id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(undefined, { status: 204 });
});

timeline[GetListMemberRoute.method](
  GetListMemberRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(GetListMemberRoute, async (c) => {
  const { id } = c.req.param();

  const res = await controller.getListMembers(id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  const unwrapped = Result.unwrap(res);
  return c.json(unwrapped, 200);
});
