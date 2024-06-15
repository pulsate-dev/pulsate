import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Note } from '../../notes/model/note.js';
import type {
  FetchHomeTimelineFilter,
  TimelineNotesCacheRepository,
  TimelineRepository,
} from '../model/repository.js';

export class HomeTimelineService {
  constructor(
    private readonly timelineCacheRepository: TimelineNotesCacheRepository,
    private readonly timelineRepository: TimelineRepository,
  ) {}

  async fetchHomeTimeline(
    accountID: AccountID,
    filter: FetchHomeTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    // ToDo: get note IDs from cache repository
    const noteIDs =
      await this.timelineCacheRepository.getHomeTimeline(accountID);
    if (Result.isErr(noteIDs)) {
      return noteIDs;
    }

    const res = await this.timelineRepository.getHomeTimeline(noteIDs[1], {
      id: accountID,
      ...filter,
    });
    if (Result.isErr(res)) {
      return res;
    }

    return res;
  }
}
