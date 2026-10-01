import { OpenAPIHono } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../../adaptors/authenticateMiddleware.ts';
import { driveModuleLogger } from '../adaptor/logger.ts';
import { driveController } from '../deps.ts';
import { MediaNotFoundError } from '../model/errors.ts';
import { GetMediaRoute } from '../router.ts';

const AuthMiddleware = new AuthenticateMiddlewareService();

export const drive = new OpenAPIHono<{
  Variables: AuthMiddlewareVariable;
}>();

drive.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
});

drive.doc31('/drive/doc.json', {
  openapi: '3.1.0',
  info: {
    title: 'Drive API',
    version: '0.1.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
});

drive[GetMediaRoute.method](
  GetMediaRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
drive.openapi(GetMediaRoute, async (c) => {
  const accountID = Option.unwrap(c.get('accountID'));
  const res = await driveController.getMediaByAuthorId(accountID as AccountID);
  if (Result.isErr(res)) {
    const error = Result.unwrapErr(res);
    driveModuleLogger.warn(error);
    if (error instanceof MediaNotFoundError) {
      return c.json({ error: 'FILE_NOT_FOUND' as const }, 404);
    }
    driveModuleLogger.error('Uncaught error', error);
    return c.json({ error: 'INTERNAL_ERROR' as const }, 500);
  }

  return c.json(res[1], 200);
});
