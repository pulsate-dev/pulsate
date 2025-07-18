import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';
import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../adaptors/authenticateMiddleware.js';
import { isProduction } from '../adaptors/env.js';
import { prismaClient } from '../adaptors/prisma.js';
import { clockSymbol } from '../id/mod.js';
import { accountModuleEther } from '../intermodule/account.js';
import { NotificationController } from './adaptor/controller/notification.js';
import { inMemoryNotificationRepo } from './adaptor/repository/dummy/notification.js';
import { prismaNotificationRepo } from './adaptor/repository/prisma/notification.js';
import {
  GetNotificationsRoute,
  PostMakeAsReadNotificationRoute,
} from './routes.js';
import { fetchNotification } from './service/fetch.js';
import { markAsReadNotification } from './service/markAsRead.js';

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const clock = Ether.newEther(clockSymbol, () => new Clock());

const notificationRepository = isProduction
  ? prismaNotificationRepo(prismaClient)
  : inMemoryNotificationRepo();

const controller = new NotificationController({
  markAsReadService: Ether.runEther(
    Cat.cat(markAsReadNotification)
      .feed(Ether.compose(notificationRepository))
      .feed(Ether.compose(clock)).value,
  ),
  accountModule: Ether.runEther(Cat.cat(accountModuleEther).value),
  fetchNotificationService: Ether.runEther(
    Cat.cat(fetchNotification).feed(Ether.compose(notificationRepository))
      .value,
  ),
});

export const notification = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>().doc31('/notification/doc.json', {
  openapi: '3.1.0',
  info: {
    title: 'Notification API',
    version: '0.1.0',
  },
});
const AuthMiddleware = new AuthenticateMiddlewareService();

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

  const res = await controller.fetchNotifications(actorID, {
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

  const res = await controller.markAsRead(id, actorID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error.message === 'Not allowed') {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }

    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(undefined, { status: 204 });
});
