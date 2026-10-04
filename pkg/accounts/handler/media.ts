import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';
import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../../adaptors/authenticateMiddleware.ts';
import { MediaNotFoundError } from '../../drive/model/errors.ts';
import { accountModuleLogger } from '../adaptor/logger.ts';
import { controller } from '../deps.ts';
import {
  AccountInsufficientPermissionError,
  AccountNotFoundError,
} from '../model/errors.ts';
import {
  SetAccountAvatarRoute,
  SetAccountHeaderRoute,
  UnsetAccountAvatarRoute,
  UnsetAccountHeaderRoute,
} from '../router.ts';

const AuthMiddleware = new AuthenticateMiddlewareService();

export const mediaHandlers = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();

mediaHandlers[SetAccountAvatarRoute.method](
  SetAccountAvatarRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

mediaHandlers.openapi(SetAccountAvatarRoute, async (c) => {
  const { name } = c.req.valid('param');
  const { medium_id } = c.req.valid('json');
  const actorID = Option.unwrap(c.get('accountID'));

  const res = await controller.setAvatar(name, actorID, medium_id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }
    if (error instanceof MediaNotFoundError) {
      return c.json({ error: 'FILE_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

mediaHandlers[UnsetAccountAvatarRoute.method](
  UnsetAccountAvatarRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

mediaHandlers.openapi(UnsetAccountAvatarRoute, async (c) => {
  const { name } = c.req.valid('param');
  const actorID = Option.unwrap(c.get('accountID'));

  const res = await controller.unsetAvatar(name, actorID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

mediaHandlers[SetAccountHeaderRoute.method](
  SetAccountHeaderRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

mediaHandlers.openapi(SetAccountHeaderRoute, async (c) => {
  const { name } = c.req.valid('param');
  const { medium_id } = c.req.valid('json');
  const actorID = Option.unwrap(c.get('accountID'));

  const res = await controller.setHeader(name, actorID, medium_id);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }
    if (error instanceof MediaNotFoundError) {
      return c.json({ error: 'FILE_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});

mediaHandlers[UnsetAccountHeaderRoute.method](
  UnsetAccountHeaderRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

mediaHandlers.openapi(UnsetAccountHeaderRoute, async (c) => {
  const actorID = Option.unwrap(c.get('accountID'));
  const { name } = c.req.valid('param');

  const res = await controller.unsetHeader(name, actorID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);

    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return new Response(null, { status: 204 });
});
