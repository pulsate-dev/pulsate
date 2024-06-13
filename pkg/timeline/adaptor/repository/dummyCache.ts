import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../../accounts/model/account.js';
import { type Note, type NoteID } from '../../../notes/model/note.js';
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
    const fetched = this.data.get(this.generateObjectKey(accountID));
    if (!fetched) {
      this.data.set(
        this.generateObjectKey(accountID),
        notes.map((note) => note.getID()),
      );
      return Result.ok(undefined);
    }
    // NOTE: replace by updated object
    this.data.delete(this.generateObjectKey(accountID));

    fetched.push(...notes.map((note) => note.getID()));
    this.data.set(this.generateObjectKey(accountID), fetched);

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
