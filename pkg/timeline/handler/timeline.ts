import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import { AccountNotFoundError } from '../../accounts/model/errors.ts';
import type { AuthMiddlewareVariable } from '../../adaptors/authenticateMiddleware.ts';
import { timelineModuleLogger } from '../adaptor/logger.ts';
import { AuthMiddleware, controller } from '../deps.ts';
import {
  ListNotFoundError,
  ListTitleLengthInvalidError,
  ListTooManyMembersError,
  TimelineBlockedByAccountError,
  TimelineInsufficientPermissionError,
  TimelineNoMoreNotesError,
} from '../model/errors.ts';
import {
  AppendListMemberRoute,
  CreateListRoute,
  DeleteListMemberRoute,
  DeleteListRoute,
  EditListRoute,
  FetchListRoute,
  GetAccountTimelineRoute,
  GetBookmarkTimelineRoute,
  GetConversationRoute,
  GetHomeTimelineRoute,
  GetListMemberRoute,
  GetListTimelineRoute,
  GetPublicTimelineRoute,
} from '../router.ts';

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
  const { has_attachment, no_nsfw, before_id, after_id } = c.req.valid('query');
  const res = await controller.getHomeTimeline(
    actorID,
    has_attachment,
    no_nsfw,
    before_id,
    after_id,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});

timeline[GetAccountTimelineRoute.method](
  GetAccountTimelineRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(GetAccountTimelineRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { id } = c.req.param();
  const { has_attachment, no_nsfw, before_id, after_id } = c.req.valid('query');

  const res = await controller.getAccountTimeline(
    id,
    actorID,
    has_attachment,
    no_nsfw,
    before_id,
    after_id,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    if (error instanceof TimelineBlockedByAccountError) {
      return c.json({ error: 'YOU_ARE_BLOCKED' as const }, 403);
    }

    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught error', error);
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
  const { has_attachment, no_nsfw, before_id, after_id } = c.req.valid('query');

  const res = await controller.getListTimeline(
    id,
    has_attachment,
    no_nsfw,
    before_id,
    after_id,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught error', error);
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
    timelineModuleLogger.warn(error);

    if (error instanceof ListTitleLengthInvalidError) {
      return c.json({ error: 'TITLE_TOO_LONG' as const }, 400);
    }

    timelineModuleLogger.error('Uncaught error', error);
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
    timelineModuleLogger.warn(error);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    if (error instanceof ListTitleLengthInvalidError) {
      return c.json({ error: 'TITLE_TOO_LONG' as const }, 400);
    }

    timelineModuleLogger.error('Uncaught error', error);
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
    timelineModuleLogger.warn(error);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught error', error);
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
    timelineModuleLogger.warn(error);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught error', error);
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
    timelineModuleLogger.warn(error);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  const unwrapped = Result.unwrap(res);
  return c.json(unwrapped, 200);
});

timeline[AppendListMemberRoute.method](
  AppendListMemberRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(AppendListMemberRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { id } = c.req.valid('param');
  const { account_id } = c.req.valid('json');

  const res = await controller.appendListMember(id, account_id, actorID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof TimelineInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }
    if (error instanceof ListTooManyMembersError) {
      return c.json({ error: 'TOO_MANY_MEMBERS' as const }, 400);
    }

    timelineModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }
  return new Response(undefined, { status: 204 });
});

timeline[DeleteListMemberRoute.method](
  DeleteListMemberRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(DeleteListMemberRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { id } = c.req.valid('param');
  const { account_id } = c.req.valid('json');

  const res = await controller.removeListMember(id, account_id, actorID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    if (error instanceof ListNotFoundError) {
      return c.json({ error: 'LIST_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof TimelineInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }

    timelineModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }
  return new Response(undefined, { status: 204 });
});

timeline[GetBookmarkTimelineRoute.method](
  GetBookmarkTimelineRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(GetBookmarkTimelineRoute, async (c) => {
  const accountID = Option.unwrap(c.get('accountID'));
  const { has_attachment, no_nsfw, before_id, after_id } = c.req.valid('query');
  const res = await controller.getBookmarkTimeline(
    accountID,
    has_attachment,
    no_nsfw,
    before_id,
    after_id,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

timeline[GetConversationRoute.method](
  GetConversationRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
timeline.openapi(GetConversationRoute, async (c) => {
  const accountID = Option.unwrap(c.get('accountID'));
  const res = await controller.getConversations(accountID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    timelineModuleLogger.error('Uncaught', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

timeline[GetPublicTimelineRoute.method](
  GetPublicTimelineRoute.path,
  AuthMiddleware.handle({ forceAuthorized: false }),
);
timeline.openapi(GetPublicTimelineRoute, async (c) => {
  const accountId = c.get('accountID') as Option.Option<AccountID>;
  const { has_attachment, no_nsfw, before_id, after_id } = c.req.valid('query');
  const res = await controller.getPublicTimeline(
    accountId,
    has_attachment,
    no_nsfw,
    before_id,
    after_id,
  );
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    timelineModuleLogger.warn(error);

    if (error instanceof TimelineNoMoreNotesError) {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    timelineModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});
