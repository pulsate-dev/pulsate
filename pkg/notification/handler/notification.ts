import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../../adaptors/authenticateMiddleware.ts';
import { notificationController } from '../deps.ts';
import {
  GetNotificationsRoute,
  PostMakeAsReadNotificationRoute,
} from '../routes.ts';

const AuthMiddleware = new AuthenticateMiddlewareService();

export const notification = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>().doc31('/notification/doc.json', {
  openapi: '3.1.0',
  info: {
    title: 'Notification API',
    version: '0.1.0',
  },
});

notification.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

notification[GetNotificationsRoute.method](
  GetNotificationsRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
notification.openapi(GetNotificationsRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { limit, after_id } = c.req.valid('query');

  const res = await notificationController.fetchNotifications(actorID, {
    limit,
    afterID: after_id,
  });
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error.message === 'Nothing left') {
      return c.json({ error: 'NOTHING_LEFT' as const }, 404);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});

notification[PostMakeAsReadNotificationRoute.method](
  PostMakeAsReadNotificationRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
notification.openapi(PostMakeAsReadNotificationRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { id } = c.req.valid('param');

  const res = await notificationController.markAsRead(id, actorID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error.message === 'Not allowed') {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(undefined, { status: 204 });
});
