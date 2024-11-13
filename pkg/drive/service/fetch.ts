import { Ether, Option, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import { MediaNotFoundError } from '../model/errors.js';
import type { Medium, MediumID } from '../model/medium.js';
import { type MediaRepository, mediaRepoSymbol } from '../model/repository.js';

export class FetchMediaService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  async fetchMediaByAuthorID(
    authorID: AccountID,
  ): Promise<Result.Result<Error, Medium[]>> {
    const res = await this.mediaRepository.findByAuthor(authorID);
    return Option.okOrElse(
      () => new MediaNotFoundError('Failed to fetch media', { cause: null }),
    )(res);
  }

  async fetchMediaByID(
    mediumID: MediumID,
  ): Promise<Result.Result<Error, Medium>> {
    const res = await this.mediaRepository.findById(mediumID);
    return Option.okOrElse(
      () => new MediaNotFoundError('Failed to fetch media', { cause: null }),
    )(res);
  }
}
export const fetchMediaServiceSymbol =
  Ether.newEtherSymbol<FetchMediaService>();
export const fetchMediaService = Ether.newEther(
  fetchMediaServiceSymbol,
  ({ mediaRepository }) => new FetchMediaService(mediaRepository),
  {
    mediaRepository: mediaRepoSymbol,
  },
);
