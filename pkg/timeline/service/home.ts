import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Note } from '../../notes/model/note.js';
import { timelineModuleLogger } from '../adaptor/logger.js';
import {
  type FetchHomeTimelineFilter,
  type TimelineNotesCacheRepository,
  type TimelineRepository,
  timelineNotesCacheRepoSymbol,
  timelineRepoSymbol,
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
    const noteIDsRes =
      await this.timelineCacheRepository.getHomeTimeline(accountID);
    if (Result.isErr(noteIDsRes)) {
      timelineModuleLogger.warn(
        'Failed to get home timeline cache',
        Result.unwrapErr(noteIDsRes),
      );
      return Result.ok([]);
    }
    const noteIDs = Result.unwrap(noteIDsRes);

    return await this.timelineRepository.getHomeTimeline(noteIDs, filter);
  }
}
export const homeTimelineSymbol = Ether.newEtherSymbol<HomeTimelineService>();
export const homeTimeline = Ether.newEther(
  homeTimelineSymbol,
  ({ timelineRepository, timelineCacheRepository }) =>
    new HomeTimelineService(timelineCacheRepository, timelineRepository),
  {
    timelineCacheRepository: timelineNotesCacheRepoSymbol,
    timelineRepository: timelineRepoSymbol,
  },
);
