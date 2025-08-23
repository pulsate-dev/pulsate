import { Ether, type Result } from '@mikuroxina/mini-fn';

import type { Note } from '../../notes/model/note.js';
import {
  type FetchHomeTimelineFilter,
  type TimelineRepository,
  timelineRepoSymbol,
} from '../model/repository.js';

export class PublicTimelineService {
  constructor(private readonly timelineRepository: TimelineRepository) {}

  async fetchPublicTimeline(
    filter: FetchHomeTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    return await this.timelineRepository.getPublicTimeline(filter);
  }
}
export const publicTimelineSymbol =
  Ether.newEtherSymbol<PublicTimelineService>();
export const publicTimeline = Ether.newEther(
  publicTimelineSymbol,
  ({ timelineRepository }) => new PublicTimelineService(timelineRepository),
  {
    timelineRepository: timelineRepoSymbol,
  },
);
