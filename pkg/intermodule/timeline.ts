import { Result } from '@mikuroxina/mini-fn';
import { hc } from 'hono/client';

import type { Note } from '../notes/model/note.js';
import type { TimelineModuleHandlerType } from '../timeline/mod.js';

export class TimelineModule {
  private readonly client = hc<TimelineModuleHandlerType>(
    'http://localhost:3000',
  );

  /*
   * @description Push note to timeline
   * @param note to be pushed
   * */
  async pushNoteToTimeline(note: Note): Promise<Result.Result<Error, void>> {
    const res = await this.client.timeline.index.$post({
      json: {
        id: note.getID(),
        authorId: note.getAuthorID(),
      },
    });
    if (!res.ok) {
      return Result.err(new Error('Failed to push note'));
    }

    return Result.ok(undefined);
  }
}
