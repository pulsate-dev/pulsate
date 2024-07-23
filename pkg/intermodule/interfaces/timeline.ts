import type { Result } from '@mikuroxina/mini-fn';
import type { Note } from '../../notes/model/note.js';

export interface TimelineModuleFacade {
  /*
   * @description Push note to timeline
   * @param note to be pushed
   * */
  pushNoteToTimeline(note: Note): Promise<Result.Result<Error, void>>;
}
