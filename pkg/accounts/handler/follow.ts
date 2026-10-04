import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';
import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../../adaptors/authenticateMiddleware.ts';
import { accountModuleLogger } from '../adaptor/logger.ts';
import { controller } from '../deps.ts';
import {
  AccountAlreadyFollowingError,
  AccountFollowingBlockedError,
  AccountInsufficientPermissionError,
  AccountNotFollowingError,
  AccountNotFoundError,
} from '../model/errors.ts';
import {
  FollowAccountRoute,
  SilenceAccountRoute,
  UnFollowAccountRoute,
  UnSilenceAccountRoute,
} from '../router.ts';

const AuthMiddleware = new AuthenticateMiddlewareService();

export const followHandlers = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();

followHandlers[SilenceAccountRoute.method](
  SilenceAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

followHandlers.openapi(SilenceAccountRoute, async (c) => {
  const actor = Option.unwrap(c.get('accountName'));
  const name = c.req.param('name');
  const res = await controller.silenceAccount(name, actor);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }

    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' }, 500);
  }

  return new Response(null, { status: 204 });
});

followHandlers[UnSilenceAccountRoute.method](
  UnSilenceAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

followHandlers.openapi(UnSilenceAccountRoute, async (c) => {
  const actor = Option.unwrap(c.get('accountName'));
  const name = c.req.param('name');
  const res = await controller.unSilenceAccount(name, actor);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountInsufficientPermissionError) {
      return c.json({ error: 'NO_PERMISSION' as const }, 403);
    }
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' }, 500);
  }

  return new Response(null, { status: 204 });
});

followHandlers[FollowAccountRoute.method](
  FollowAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

followHandlers.openapi(FollowAccountRoute, async (c) => {
  const targetName = c.req.param('name');
  const fromName = Option.unwrap(c.get('accountName'));

  const res = await controller.followAccount(fromName, targetName);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountAlreadyFollowingError) {
      return c.json({ error: 'ALREADY_FOLLOWING' as const }, 403);
    }
    if (error instanceof AccountFollowingBlockedError) {
      return c.json({ error: 'YOU_ARE_BLOCKED' as const }, 403);
    }

    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' }, 500);
  }

  return c.json({}, 201);
});

followHandlers[UnFollowAccountRoute.method](
  UnFollowAccountRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);

followHandlers.openapi(UnFollowAccountRoute, async (c) => {
  const targetName = c.req.param('name');
  const fromName = Option.unwrap(c.get('accountName'));

  const res = await controller.unFollowAccount(fromName, targetName);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'ACCOUNT_NOT_FOUND' as const }, 404);
    }
    if (error instanceof AccountNotFollowingError) {
      return c.json({ error: 'YOU_ARE_NOT_FOLLOW_ACCOUNT' as const }, 403);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' }, 500);
  }

  return new Response(null, { status: 204 });
});
