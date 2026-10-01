import { Cat, Ether } from '@mikuroxina/mini-fn';

import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import { DriveController } from './adaptor/controller/drive.ts';
import { inMemoryMediaRepo } from './adaptor/repository/dummy.ts';
import { prismaMediaRepo } from './adaptor/repository/prisma.ts';
import { fetchMediaService } from './service/fetch.ts';

export const mediaRepository = isProduction
  ? prismaMediaRepo(prismaClient)
  : inMemoryMediaRepo([]);

export const fetchMediaServiceInstance = Ether.runEther(
  Cat.cat(fetchMediaService).feed(Ether.compose(mediaRepository)).value,
);

export const driveController = new DriveController(fetchMediaServiceInstance);
