import { OpenAPIHono } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';
import type { AuthMiddlewareVariable } from '../../adaptors/authenticateMiddleware.ts';
import { accountModuleLogger } from '../adaptor/logger.ts';
import { controller } from '../deps.ts';
import {
  AccountAuthenticationFailedError,
  AccountAuthenticationTokenExpiredError,
  AccountAuthenticationTokenInvalidError,
  AccountLoginRejectedError,
  AccountNotFoundError,
  AccountRefreshTokenExpiredError,
  AccountRefreshTokenInvalidError,
} from '../model/errors.ts';
import { LoginRoute, RefreshRoute } from '../router.ts';

export const authHandlers = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();

authHandlers.openapi(LoginRoute, async (c) => {
  const { email, passphrase } = c.req.valid('json');

  const res = await controller.login(email, passphrase);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountAuthenticationFailedError) {
      return c.json({ error: 'FAILED_TO_LOGIN' as const }, 400);
    }
    if (error instanceof AccountNotFoundError) {
      return c.json({ error: 'FAILED_TO_LOGIN' as const }, 400);
    }
    if (error instanceof AccountLoginRejectedError) {
      return c.json({ error: 'YOU_ARE_FROZEN' as const }, 403);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});

authHandlers.openapi(RefreshRoute, async (c) => {
  const token = c.req.header('Authorization');
  if (!token) return c.json({ error: 'INVALID_TOKEN' as const }, 400);

  const res = await controller.refresh(token);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    accountModuleLogger.warn(error);
    if (error instanceof AccountAuthenticationTokenInvalidError) {
      return c.json({ error: 'INVALID_TOKEN' as const }, 400);
    }
    if (error instanceof AccountRefreshTokenInvalidError) {
      return c.json({ error: 'INVALID_TOKEN' as const }, 400);
    }
    if (error instanceof AccountRefreshTokenExpiredError) {
      return c.json({ error: 'EXPIRED_TOKEN' as const }, 400);
    }
    if (error instanceof AccountAuthenticationTokenExpiredError) {
      return c.json({ error: 'EXPIRED_TOKEN' as const }, 400);
    }
    accountModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(Result.unwrap(res), 200);
});
