import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../accounts/model/account.ts';

import {
  AuthenticateMiddlewareService,
  type AuthMiddlewareVariable,
} from '../adaptors/authenticateMiddleware.ts';
import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import { DriveController } from './adaptor/controller/drive.ts';
import { driveModuleLogger } from './adaptor/logger.ts';
import { inMemoryMediaRepo } from './adaptor/repository/dummy.ts';
import { prismaMediaRepo } from './adaptor/repository/prisma.ts';
import { MediaNotFoundError } from './model/errors.ts';
import { GetMediaRoute } from './router.ts';
import { fetchMediaService } from './service/fetch.ts';

const AuthMiddleware = new AuthenticateMiddlewareService();

const mediaRepository = isProduction
  ? prismaMediaRepo(prismaClient)
  : inMemoryMediaRepo([]);

const controller = new DriveController(
  Ether.runEther(
    Cat.cat(fetchMediaService).feed(Ether.compose(mediaRepository)).value,
  ),
);

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
  const res = await controller.getMediaByAuthorId(accountID as AccountID);
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
