import { Ether, type Result } from '@mikuroxina/mini-fn';
import type { InMemoryMediaRepository } from '../drive/adaptor/repository/dummy.ts';
import { fetchMediaServiceInstance } from '../drive/deps.ts';
import type { Medium, MediumID } from '../drive/model/medium.ts';
import { FetchMediaService } from '../drive/service/fetch.ts';

/**
 * Media Module facade.
 */
export class MediaModuleFacade {
  readonly #fetchMediaService: FetchMediaService;
  constructor(fetchMediaService: FetchMediaService) {
    this.#fetchMediaService = fetchMediaService;
  }

  async fetchMedia(mediumID: MediumID): Promise<Result.Result<Error, Medium>> {
    return await this.#fetchMediaService.fetchMediaByID(mediumID);
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
  fetchMediaServiceInstance,
);

/**
 * Dummy media module.\
 * **NOTE: MUST USE THIS OBJECT FOR TESTING ONLY**
 * @param mediaRepository Dummy media repository
 */
export const dummyMediaModuleFacade = (
  mediaRepository: InMemoryMediaRepository,
) => new MediaModuleFacade(new FetchMediaService(mediaRepository));
