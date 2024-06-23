import { type z } from '@hono/zod-openapi';
import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { FetchMediaService } from '../../service/fetch.js';
import type { GetDriveMediaResponseSchema } from '../validator/schema.js';

export class DriveController {
  constructor(private readonly fetchService: FetchMediaService) {}

  async getMediaByAuthorId(
    authorId: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetDriveMediaResponseSchema>>
  > {
    const res = await this.fetchService.fetchMediaByAuthorID(
      authorId as AccountID,
    );
    if (Result.isErr(res)) {
      return res;
    }
    return Result.ok(
      res[1].map((medium) => ({
        id: medium.getId(),
        name: medium.getName(),
        author_id: medium.getAuthorId(),
        hash: medium.getHash(),
        mime: medium.getMime(),
        nsfw: medium.isNsfw(),
        url: medium.getUrl(),
        thumbnail: medium.getThumbnailUrl(),
      })),
    );
  }
}
