import { Result } from '@mikuroxina/mini-fn';
import { type Redis } from 'ioredis';

import type { AccountID } from '../../../accounts/model/account.js';
import { type Note, type NoteID } from '../../../notes/model/note.js';
import type {
  CacheObjectKey,
  TimelineNotesCacheRepository,
} from '../../model/repository.js';

export class ValkeyTimelineCacheRepository
  implements TimelineNotesCacheRepository
{
  constructor(private readonly redisClient: Redis) {}

  private generateObjectKey(accountID: AccountID): CacheObjectKey {
    return `timeline:home:${accountID}`;
  }

  async addNotesToHomeTimeline(
    accountID: AccountID,
    notes: Note[],
  ): Promise<Result.Result<Error, void>> {
    try {
      // ToDo: replace with bulk insert
      await Promise.all(
        notes.map((v) =>
          this.redisClient.zadd(
            this.generateObjectKey(accountID),
            v.getCreatedAt().getTime(),
            v.getID(),
          ),
        ),
      );
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async getHomeTimeline(
    accountID: AccountID,
  ): Promise<Result.Result<Error, NoteID[]>> {
    try {
      const fetched = await this.redisClient.zrange(
        this.generateObjectKey(accountID),
        0,
        -1,
      );
      return Result.ok(fetched as NoteID[]);
    } catch (e) {
      return Result.err(e as Error);
    }
  }
}
