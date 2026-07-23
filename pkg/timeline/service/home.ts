import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.ts';
import type { Note } from '../../notes/model/note.ts';
import { timelineModuleLogger } from '../adaptor/logger.ts';
import {
  type FetchHomeTimelineFilter,
  type TimelineNotesCacheRepository,
  type TimelineRepository,
  timelineNotesCacheRepoSymbol,
  timelineRepoSymbol,
} from '../model/repository.ts';

export class HomeTimelineService {
  readonly #timelineCacheRepository: TimelineNotesCacheRepository;
  readonly #timelineRepository: TimelineRepository;
  constructor(
    timelineCacheRepository: TimelineNotesCacheRepository,
    timelineRepository: TimelineRepository,
  ) {
    this.#timelineCacheRepository = timelineCacheRepository;
    this.#timelineRepository = timelineRepository;
  }

  async fetchHomeTimeline(
    accountID: AccountID,
    filter: FetchHomeTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    // ToDo: get note IDs from cache repository
    const noteIDsRes =
      await this.#timelineCacheRepository.getHomeTimeline(accountID);
    if (Result.isErr(noteIDsRes)) {
      timelineModuleLogger.warn(
        'Failed to get home timeline cache',
        Result.unwrapErr(noteIDsRes),
      );
      return Result.ok([]);
    }
    const noteIDs = Result.unwrap(noteIDsRes);

    return await this.#timelineRepository.getHomeTimeline(noteIDs, filter);
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
