import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Medium } from '../model/medium.js';
import type { MediaRepository } from '../model/repository.js';

export class FetchMediaService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  async fetchMediaByAuthorID(
    authorID: AccountID,
  ): Promise<Result.Result<Error, Medium[]>> {
    const res = await this.mediaRepository.findByAuthor(authorID);
    if (Option.isNone(res)) {
      return Result.err(new Error('Failed to fetch media'));
    }

    return Result.ok(Option.unwrap(res));
  }
}
