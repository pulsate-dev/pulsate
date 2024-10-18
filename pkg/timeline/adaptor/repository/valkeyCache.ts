import { Ether, Result } from '@mikuroxina/mini-fn';
import type { Redis } from 'ioredis';

import type { AccountID } from '../../../accounts/model/account.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import { TimelineInternalError } from '../../model/errors.js';
import type { ListID } from '../../model/list.js';
import {
  type CacheObjectKey,
  type TimelineNotesCacheRepository,
  timelineNotesCacheRepoSymbol,
} from '../../model/repository.js';

export class ValkeyTimelineCacheRepository
  implements TimelineNotesCacheRepository
{
  constructor(private readonly redisClient: Redis) {}

  private generateObjectKey(
    id: AccountID | ListID,
    timelineType: 'home' | 'list',
  ): CacheObjectKey {
    return `timeline:${timelineType}:${id}`;
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
            this.generateObjectKey(accountID, 'home'),
            v.getCreatedAt().getTime(),
            v.getID(),
          ),
        ),
      );
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(
        new TimelineInternalError('unknown valkey error', { cause: e }),
      );
    }
  }

  async addNotesToList(
    listID: ListID,
    notes: readonly Note[],
  ): Promise<Result.Result<Error, void>> {
    try {
      await Promise.all(
        notes.map((v) =>
          this.redisClient.zadd(
            this.generateObjectKey(listID, 'list'),
            v.getCreatedAt().getTime(),
            v.getID(),
          ),
        ),
      );
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(
        new TimelineInternalError('unknown valkey error', { cause: e }),
      );
    }
  }

  async getHomeTimeline(
    accountID: AccountID,
  ): Promise<Result.Result<Error, NoteID[]>> {
    try {
      const fetched = await this.redisClient.zrange(
        this.generateObjectKey(accountID, 'home'),
        0,
        -1,
      );
      return Result.ok(fetched as NoteID[]);
    } catch (e) {
      return Result.err(
        new TimelineInternalError('unknown valkey error', { cause: e }),
      );
    }
  }

  async getListTimeline(
    listID: ListID,
  ): Promise<Result.Result<Error, NoteID[]>> {
    try {
      const fetched = await this.redisClient.zrange(
        this.generateObjectKey(listID, 'list'),
        0,
        -1,
      );
      return Result.ok(fetched as NoteID[]);
    } catch (e) {
      return Result.err(
        new TimelineInternalError('unknown valkey error', { cause: e }),
      );
    }
  }
}
export const valkeyTimelineCacheRepo = (redisClient: Redis) =>
  Ether.newEther(
    timelineNotesCacheRepoSymbol,
    () => new ValkeyTimelineCacheRepository(redisClient),
  );
