import { OpenAPIHono } from '@hono/zod-openapi';
import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../accounts/model/account.js';
import { authenticateToken } from '../accounts/service/authenticationTokenService.js';
import { authenticateMiddleware } from '../adaptors/authenticateMiddleware.js';
import { prismaClient } from '../adaptors/prisma.js';
import { DriveController } from './adaptor/controller/drive.js';
import { InMemoryMediaRepository } from './adaptor/repository/dummy.js';
import { PrismaMediaRepository } from './adaptor/repository/prisma.js';
import { GetMediaRoute } from './router.js';
import { FetchMediaService } from './service/fetch.js';

const isProduction = process.env.NODE_ENV === 'production';
const composer = Ether.composeT(Promise.monad);
const liftOverPromise = <const D extends Record<string, symbol>, T>(
  ether: Ether.Ether<D, T>,
): Ether.EtherT<D, Promise.PromiseHkt, T> => ({
  ...ether,
  handler: (resolved) => Promise.pure(ether.handler(resolved)),
});
const AuthMiddleware = await Ether.runEtherT(
  Cat.cat(liftOverPromise(authenticateMiddleware)).feed(
    composer(authenticateToken),
  ).value,
);
const mediaRepository = isProduction
  ? new PrismaMediaRepository(prismaClient)
  : new InMemoryMediaRepository([]);
const fetchService = new FetchMediaService(mediaRepository);
const controller = new DriveController(fetchService);

const drive = new OpenAPIHono();

drive[GetMediaRoute.method](
  GetMediaRoute.path,
  AuthMiddleware.handle({ forceAuthorized: true }),
);
drive.openapi(GetMediaRoute, async (c) => {
  // ToDo: fill authorID
  const res = await controller.getMediaByAuthorId('' as AccountID);
  if (Result.isErr(res)) {
    return c.json({ error: res[1].message }, 404);
  }

  return c.json(res[1], 200);
});
