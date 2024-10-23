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
import { clockSymbol, snowflakeIDGenerator } from '../id/mod.js';
import {
  accountModule,
  accountModuleEther,
  dummyAccountModuleFacade,
} from '../intermodule/account.js';
import { noteModule } from '../intermodule/note.js';
import { TimelineController } from './adaptor/controller/timeline.js';
import {
  inMemoryListRepo,
  inMemoryTimelineRepo,
} from './adaptor/repository/dummy.js';
import { inMemoryTimelineCacheRepo } from './adaptor/repository/dummyCache.js';
import {
  prismaListRepo,
  prismaTimelineRepo,
} from './adaptor/repository/prisma.js';
import { valkeyTimelineCacheRepo } from './adaptor/repository/valkeyCache.js';
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
import { accountTimeline } from './service/account.js';
import { createList } from './service/createList.js';
import { deleteList } from './service/deleteList.js';
import { editList } from './service/editList.js';
import { fetchList } from './service/fetchList.js';
import { fetchListMember } from './service/fetchMember.js';
import { homeTimeline } from './service/home.js';
import { listTimeline } from './service/list.js';
import { noteVisibility } from './service/noteVisibility.js';

const isProduction = process.env.NODE_ENV === 'production';

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const clock = Ether.newEther(clockSymbol, () => new Clock());
const idGenerator = Ether.compose(clock)(snowflakeIDGenerator(0));

const timelineRepository = isProduction
  ? prismaTimelineRepo(prismaClient)
  : inMemoryTimelineRepo();
const listRepository = isProduction
  ? prismaListRepo(prismaClient)
  : inMemoryListRepo();

const liftOverPromise = Ether.liftEther(Promise.monad);
const composer = Ether.composeT(Promise.monad);
const AuthMiddleware = await Ether.runEtherT(
  Cat.cat(liftOverPromise(authenticateMiddleware)).feed(
    composer(authenticateToken),
  ).value,
);
const noteVisibilityService = Cat.cat(noteVisibility).feed(
  Ether.compose(
    accountModuleEther(isProduction ? accountModule : dummyAccountModuleFacade),
  ),
).value;

const timelineCacheRepository = isProduction
  ? valkeyTimelineCacheRepo(valkeyClient)
  : inMemoryTimelineCacheRepo([]);

const controller = new TimelineController({
  accountTimelineService: Ether.runEther(
    Cat.cat(accountTimeline)
      .feed(Ether.compose(noteVisibilityService))
      .feed(Ether.compose(timelineRepository)).value,
  ),
  createListService: Ether.runEther(
    Cat.cat(createList)
      .feed(Ether.compose(idGenerator))
      .feed(Ether.compose(listRepository)).value,
  ),
  editListService: Ether.runEther(
    Cat.cat(editList).feed(Ether.compose(listRepository)).value,
  ),
  fetchListService: Ether.runEther(
    Cat.cat(fetchList).feed(Ether.compose(listRepository)).value,
  ),
  deleteListService: Ether.runEther(
    Cat.cat(deleteList).feed(Ether.compose(listRepository)).value,
  ),
  accountModule: isProduction ? accountModule : dummyAccountModuleFacade,
  fetchMemberService: Ether.runEther(
    Cat.cat(fetchListMember)
      .feed(Ether.compose(listRepository))
      .feed(
        Ether.compose(
          accountModuleEther(
            isProduction ? accountModule : dummyAccountModuleFacade,
          ),
        ),
      ).value,
  ),
  listTimelineService: Ether.runEther(
    Cat.cat(listTimeline)
      .feed(Ether.compose(timelineCacheRepository))
      .feed(Ether.compose(timelineRepository)).value,
  ),
  noteModule: noteModule,
  homeTimeline: Ether.runEther(
    Cat.cat(homeTimeline)
      .feed(Ether.compose(timelineCacheRepository))
      .feed(Ether.compose(timelineRepository)).value,
  ),
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
