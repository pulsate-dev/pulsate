import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import type { Note, NoteID } from '../../../notes/model/note.js';
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

  private generateObjectKey(accountID: AccountID): CacheObjectKey {
    return `timeline:home:${accountID}`;
  }

  async addNotesToHomeTimeline(
    accountID: AccountID,
    notes: Note[],
  ): Promise<Result.Result<Error, void>> {
    const objectKey = this.generateObjectKey(accountID);
    if (!this.data.has(objectKey)) {
      this.data.set(
        objectKey,
        notes.map((note) => note.getID()),
      );
      return Result.ok(undefined);
    }
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
    const fetched = this.data.get(this.generateObjectKey(accountID));
    if (!fetched) {
      return Result.err(new Error('Not found'));
    }
    return Result.ok(fetched.sort());
  }
}
