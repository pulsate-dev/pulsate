import { Ether, Result } from '@mikuroxina/mini-fn';
import type { Note } from '../../notes/model/note.js';
import { timelineModuleLogger } from '../adaptor/logger.js';
import type { ListID } from '../model/list.js';
import {
  type FetchListTimelineFilter,
  type TimelineNotesCacheRepository,
  type TimelineRepository,
  timelineNotesCacheRepoSymbol,
  timelineRepoSymbol,
} from '../model/repository.js';

export class ListTimelineService {
  constructor(
    private readonly timelineCacheRepository: TimelineNotesCacheRepository,
    private readonly timelineRepository: TimelineRepository,
  ) {}

  /**
   * @description Fetch list timeline notes
   * @param listID ID of the list
   * @param filter Filter for fetching notes
   * @returns Note[] list of notes, sorted by CreatedAt descending
   */
  async handle(
    listID: ListID,
    filter: FetchListTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    const cachedNotesRes =
      await this.timelineCacheRepository.getListTimeline(listID);
    if (Result.isErr(cachedNotesRes)) {
      timelineModuleLogger.warn(
        'Failed to get list timeline cache',
        Result.unwrapErr(cachedNotesRes),
      );
      return Result.ok([]);
    }
    const cachedNotes = Result.unwrap(cachedNotesRes);

    return await this.timelineRepository.fetchListTimeline(cachedNotes, filter);
  }
}
export const listTimelineSymbol = Ether.newEtherSymbol<ListTimelineService>();
export const listTimeline = Ether.newEther(
  listTimelineSymbol,
  ({ timelineCacheRepo, timelineRepo }) =>
    new ListTimelineService(timelineCacheRepo, timelineRepo),
  {
    timelineCacheRepo: timelineNotesCacheRepoSymbol,
    timelineRepo: timelineRepoSymbol,
  },
);
