import { Option, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import { MediaNotFoundError } from '../model/errors.js';
import type { Medium } from '../model/medium.js';
import type { MediaRepository } from '../model/repository.js';

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
}
