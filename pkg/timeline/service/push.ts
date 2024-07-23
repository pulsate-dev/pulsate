import { Result } from '@mikuroxina/mini-fn';

import type { AccountModuleFacade } from '../../intermodule/interfaces/account.js';
import type { Note } from '../../notes/model/note.js';
import type { TimelineNotesCacheRepository } from '../model/repository.js';
import type { NoteVisibilityService } from './noteVisibility.js';

export class PushTimelineService {
  constructor(
    private readonly accountModule: AccountModuleFacade,
    private readonly noteVisibility: NoteVisibilityService,
    private readonly timelineNotesCacheRepository: TimelineNotesCacheRepository,
  ) {}

  /**
   * @description Push note to home timeline
   * @param note to be pushed
   * */
  async handle(note: Note): Promise<Result.Result<Error, void>> {
    const followers = await this.accountModule.fetchFollowers(
      note.getAuthorID(),
    );
    if (Result.isErr(followers)) {
      return followers;
    }
    const unwrappedFollowers = Result.unwrap(followers);

    /*
    PUBLIC, HOME, FOLLOWER: OK
    DIRECT: reject (direct note is not pushed to home timeline)
     */
    const visible = await this.noteVisibility.isVisibleNoteInHomeTimeline({
      accountID: note.getAuthorID(),
      note,
    });
    if (!visible) {
      return Result.err(new Error('Note invisible'));
    }

    // ToDo: bulk insert
    const res = await Promise.all(
      unwrappedFollowers.map((v) => {
        return this.timelineNotesCacheRepository.addNotesToHomeTimeline(v.id, [
          note,
        ]);
      }),
    );

    return res.find(Result.isErr) ?? Result.ok(undefined);
  }
}
