import { Ether, type Result } from '@mikuroxina/mini-fn';
import { isProduction } from '../adaptors/env.js';
import { prismaClient } from '../adaptors/prisma.js';
import { InMemoryMediaRepository } from '../drive/adaptor/repository/dummy.js';
import { PrismaMediaRepository } from '../drive/adaptor/repository/prisma.js';
import type { Medium, MediumID } from '../drive/model/medium.js';
import { FetchMediaService } from '../drive/service/fetch.js';

/**
 * Media Module facade.
 */
export class MediaModuleFacade {
  constructor(private readonly fetchMediaService: FetchMediaService) {}

  async fetchMedia(mediumID: MediumID): Promise<Result.Result<Error, Medium>> {
    return await this.fetchMediaService.fetchMediaByID(mediumID);
  }
}
export const mediaModuleFacadeSymbol =
  Ether.newEtherSymbol<MediaModuleFacade>();
export const mediaModuleFacadeEther = Ether.newEther(
  mediaModuleFacadeSymbol,
  () => mediaModuleFacade,
);

/**
 * Media module facade object for dependency injection.
 */
export const mediaModuleFacade = new MediaModuleFacade(
  new FetchMediaService(
    isProduction
      ? new PrismaMediaRepository(prismaClient)
      : new InMemoryMediaRepository([]),
  ),
);

/**
 * Dummy media module.\
 * **NOTE: MUST USE THIS OBJECT FOR TESTING ONLY**
 * @param mediaRepository Dummy media repository
 */
export const dummyMediaModuleFacade = (
  mediaRepository: InMemoryMediaRepository,
) => new MediaModuleFacade(new FetchMediaService(mediaRepository));
