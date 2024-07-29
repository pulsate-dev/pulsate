import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
import type { ListID } from '../../model/list.js';
import type {
  CacheObjectKey,
  TimelineNotesCacheRepository,
} from '../../model/repository.js';

export class InMemoryTimelineCacheRepository
  implements TimelineNotesCacheRepository
{
  private readonly data: Map<CacheObjectKey, NoteID[]>;
  constructor(data: [AccountID, NoteID[]][] = []) {
    this.data = new Map(
      data.map(([accountID, noteIDs]) => [
        `timeline:home:${accountID}`,
        noteIDs,
      ]),
    );
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
    const objectKey = this.generateObjectKey(accountID, 'home');
    if (!this.data.has(objectKey)) {
      this.data.set(
        objectKey,
        notes.map((note) => note.getID()),
      );
      return Result.ok(undefined);
    }
    // biome-ignore lint/style/noNonNullAssertion: Use assertion to avoid compile errors because type inference has failed.
    const fetched = this.data.get(objectKey)!;
    // NOTE: replace by updated object
    this.data.delete(objectKey);

    fetched.push(...notes.map((note) => note.getID()));
    this.data.set(objectKey, fetched);

    return Result.ok(undefined);
  }

  async addNotesToList(
    listID: ListID,
    notes: readonly Note[],
  ): Promise<Result.Result<Error, void>> {
    const objectKey = this.generateObjectKey(listID, 'list');
    if (!this.data.has(objectKey)) {
      this.data.set(
        objectKey,
        notes.map((note) => note.getID()),
      );
      return Result.ok(undefined);
    }
    // biome-ignore lint/style/noNonNullAssertion: Use assertion to avoid compile errors because type inference has failed.
    const fetched = this.data.get(objectKey)!;
    // NOTE: replace by updated object
    this.data.delete(objectKey);

    fetched.push(...notes.map((note) => note.getID()));
    this.data.set(objectKey, fetched);

    return Result.ok(undefined);
  }

  async getHomeTimeline(
    accountID: AccountID,
  ): Promise<Result.Result<Error, NoteID[]>> {
    const fetched = this.data.get(this.generateObjectKey(accountID, 'home'));
    if (!fetched) {
      return Result.err(new Error('Not found'));
    }
    return Result.ok(fetched.sort());
  }

  async getListTimeline(
    listID: ListID,
  ): Promise<Result.Result<Error, NoteID[]>> {
    const fetched = this.data.get(this.generateObjectKey(listID, 'list'));
    if (!fetched) {
      return Result.err(new Error('Not found'));
    }
    return Result.ok(fetched.sort());
  }

  reset(): void {
    this.data.clear();
  }
}
