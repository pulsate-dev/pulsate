import { Option } from '@mikuroxina/mini-fn';
import { hc } from 'hono/client';

import type { Note } from '../notes/model/note.js';
import type { TimelineModuleHandlerType } from '../timeline/mod.js';

export class TimelineModule {
  private readonly client = hc<TimelineModuleHandlerType>(
    'http://localhost:3000',
  );
  constructor() {}

  /*
   * @description Push note to timeline
   * @param note to be pushed
   * */
  async pushNoteToTimeline(note: Note): Promise<Option.Option<Error>> {
    const res = await this.client.timeline.index.$post({
      json: {
        id: note.getID(),
        authorId: note.getAuthorID(),
      },
    });
    if (!res.ok) {
      return Option.some(new Error('Failed to push note'));
    }

    return Option.none();
  }
}
