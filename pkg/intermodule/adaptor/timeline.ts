import { Result } from '@mikuroxina/mini-fn';
import type { Note } from '../../notes/model/note.js';
import type { PushTimelineService } from '../../timeline/service/push.js';

export class TimelineModule {
  constructor(private readonly pushTimelineService: PushTimelineService) {}

  /*
   * @description Push note to timeline
   * @param note to be pushed
   * */
  async pushNoteToTimeline(note: Note): Promise<Result.Result<Error, void>> {
    const res = await this.pushTimelineService.handle(note);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }
}
