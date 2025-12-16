import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import { compareID } from '../../../id/mod.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import { TimelineCacheNotFoundError } from '../../model/errors.js';
import type { ListID } from '../../model/list.js';
import {
  type CacheObjectKey,
  type TimelineNotesCacheRepository,
  timelineNotesCacheRepoSymbol,
} from '../../model/repository.js';

export class InMemoryTimelineCacheRepository
  implements TimelineNotesCacheRepository
{
  private data: Map<CacheObjectKey, NoteID[]>;
  constructor(
    homeData: [AccountID, NoteID[]][] = [],
    listData: [ListID, NoteID[]][] = [],
  ) {
    const home = homeData.map((v): [CacheObjectKey, NoteID[]] => {
      const key = this.generateObjectKey(v[0], 'home');
      return [key, v[1]];
    });
    const list = listData.map((v): [CacheObjectKey, NoteID[]] => {
      const key = this.generateObjectKey(v[0], 'list');
      return [key, v[1]];
    });

    this.data = new Map([...home, ...list]);
  }

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
    const newNoteIDs = notes.map((note) => note.getID());
    const objectKey = this.generateObjectKey(accountID, 'home');

    if (!this.data.has(objectKey)) {
      this.data.set(objectKey, newNoteIDs);
      return Result.ok(undefined);
    }
    this.data.get(objectKey)?.push(...newNoteIDs);

    return Result.ok(undefined);
  }

  async addNotesToList(
    listID: ListID,
    notes: readonly Note[],
  ): Promise<Result.Result<Error, void>> {
    const newNoteIDs = notes.map((note) => note.getID());
    const objectKey = this.generateObjectKey(listID, 'list');

    if (!this.data.has(objectKey)) {
      this.data.set(objectKey, newNoteIDs);
      return Result.ok(undefined);
    }
    this.data.get(objectKey)?.push(...newNoteIDs);

    return Result.ok(undefined);
  }

  async getHomeTimeline(
    accountID: AccountID,
  ): Promise<Result.Result<Error, NoteID[]>> {
    const fetched = this.data.get(this.generateObjectKey(accountID, 'home'));
    if (!fetched) {
      return Result.err(
        new TimelineCacheNotFoundError('timeline cache not found', {
          cause: { timelineType: 'home', id: accountID },
        }),
      );
    }
    return Result.ok(fetched.sort(compareID));
  }

  async getListTimeline(
    listID: ListID,
  ): Promise<Result.Result<Error, NoteID[]>> {
    const fetched = this.data.get(this.generateObjectKey(listID, 'list'));
    if (!fetched) {
      return Result.err(
        new TimelineCacheNotFoundError('timeline cache not found', {
          cause: { timelineType: 'list', id: listID },
        }),
      );
    }
    return Result.ok(fetched.sort(compareID));
  }

  reset(
    homeData: [AccountID, NoteID[]][] = [],
    listData: [ListID, NoteID[]][] = [],
  ) {
    const home = homeData.map((v): [CacheObjectKey, NoteID[]] => {
      const key = this.generateObjectKey(v[0], 'home');
      return [key, v[1]];
    });
    const list = listData.map((v): [CacheObjectKey, NoteID[]] => {
      const key = this.generateObjectKey(v[0], 'list');
      return [key, v[1]];
    });

    this.data = new Map([...home, ...list]);
  }

  async deleteNotesFromHomeTimeline(
    accountID: AccountID,
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, void>> {
    const objectKey = this.generateObjectKey(accountID, 'home');
    const fetched = this.data.get(objectKey);
    if (!fetched) {
      return Result.err(
        new TimelineCacheNotFoundError('timeline cache not found', {
          cause: { timelineType: 'home', id: accountID },
        }),
      );
    }
    this.data.set(
      objectKey,
      fetched.filter((v) => !noteIDs.includes(v)),
    );

    return Result.ok(undefined);
  }

  async deleteNotesFromListTimeline(
    listID: ListID,
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, void>> {
    const objectKey = this.generateObjectKey(listID, 'list');
    const fetched = this.data.get(objectKey);
    if (!fetched) {
      return Result.err(
        new TimelineCacheNotFoundError('timeline cache not found', {
          cause: { timelineType: 'list', id: listID },
        }),
      );
    }
    this.data.set(
      objectKey,
      fetched.filter((v) => !noteIDs.includes(v)),
    );

    return Result.ok(undefined);
  }
}

export const inMemoryTimelineCacheRepo = (data: [AccountID, NoteID[]][] = []) =>
  Ether.newEther(
    timelineNotesCacheRepoSymbol,
    () => new InMemoryTimelineCacheRepository(data),
  );
