import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { AccountModuleFacade } from '../../intermodule/account.js';
import { NoteVisibilityInvalidError } from '../../notes/model/errors.js';
import type { Note } from '../../notes/model/note.js';
import { TimelineInternalError } from '../model/errors.js';
import type { ListID } from '../model/list.js';
import {
  type TimelineNotesCacheRepository,
  timelineNotesCacheRepoSymbol,
} from '../model/repository.js';
import type { FetchSubscribedListService } from './fetchSubscribed.js';
import type { NoteVisibilityService } from './noteVisibility.js';

export class PushTimelineService {
  constructor(
    private readonly accountModule: AccountModuleFacade,
    private readonly noteVisibility: NoteVisibilityService,
    private readonly timelineNotesCacheRepository: TimelineNotesCacheRepository,
    private readonly fetchSubscribedListService: FetchSubscribedListService,
    /**
     * @description Limit length of timeline caches
     * @private
     */
    private readonly TIMELINE_CACHE_LIMIT = 300,
  ) {}

  /**
   * @description Check the number of cached timelines and delete old ones if the limit is reached
   * @private
   */
  private async timelineLimitCheck<T extends 'home' | 'list'>(
    timelineType: T,
    timelineID: T extends 'home' ? AccountID : ListID,
  ): Promise<Result.Result<Error, void>> {
    if (timelineType === 'home') {
      const timelineRes =
        await this.timelineNotesCacheRepository.getHomeTimeline(
          timelineID as AccountID,
        );
      if (Result.isErr(timelineRes)) {
        return timelineRes;
      }
      const timeline = Result.unwrap(timelineRes);
      if (timeline.length >= this.TIMELINE_CACHE_LIMIT) {
        const oldNotes = timeline.slice(this.TIMELINE_CACHE_LIMIT - 1);
        return this.timelineNotesCacheRepository.deleteNotesFromHomeTimeline(
          timelineID as AccountID,
          oldNotes,
        );
      }
      return Result.ok(undefined);
    }

    if (timelineType === 'list') {
      const timelineRes =
        await this.timelineNotesCacheRepository.getListTimeline(
          timelineID as ListID,
        );
      if (Result.isErr(timelineRes)) {
        return timelineRes;
      }
      const timeline = Result.unwrap(timelineRes);
      if (timeline.length >= this.TIMELINE_CACHE_LIMIT) {
        const oldNotes = timeline.slice(this.TIMELINE_CACHE_LIMIT - 1);

        return this.timelineNotesCacheRepository.deleteNotesFromListTimeline(
          timelineID as ListID,
          oldNotes,
        );
      }

      return Result.ok(undefined);
    }
    return Result.err(
      new TimelineInternalError('Unknown timeline type', { cause: null }),
    );
  }

  /**
   * @description Push note to home timeline
   * @param note to be pushed
   * */
  async handle(note: Note): Promise<Result.Result<Error, void>> {
    const home = await this.pushToHomeTimeline(note);
    if (Result.isErr(home)) {
      return home;
    }

    return await this.pushToList(note);
  }

  private async pushToHomeTimeline(
    note: Note,
  ): Promise<Result.Result<Error, void>> {
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
      return Result.err(
        new NoteVisibilityInvalidError('Note invisible', { cause: null }),
      );
    }

    for (const v of unwrappedFollowers) {
      const checkRes = await this.timelineLimitCheck('home', v.id);
      if (Result.isErr(checkRes)) {
        return checkRes;
      }
    }

    // ToDo: bulk insert
    const res = await Promise.all([
      ...unwrappedFollowers.map((v) => {
        return this.timelineNotesCacheRepository.addNotesToHomeTimeline(v.id, [
          note,
        ]);
      }),
      // NOTE: add note to author's home timeline
      this.timelineNotesCacheRepository.addNotesToHomeTimeline(
        note.getAuthorID(),
        [note],
      ),
    ]);
    return res.find(Result.isErr) ?? Result.ok(undefined);
  }

  /**
   * @description push note to List timeline
   * @param note
   */
  private async pushToList(note: Note): Promise<Result.Result<Error, void>> {
    const lists = await this.fetchSubscribedListService.handle(
      note.getAuthorID(),
    );
    if (Result.isErr(lists)) {
      return lists;
    }
    const unwrappedLists = Result.unwrap(lists);

    /*
    PUBLIC, HOME: OK
    FOLLOWER, DIRECT: reject
     */
    const visible = await this.noteVisibility.isVisibleNoteInList({
      accountID: note.getAuthorID(),
      note,
    });
    if (!visible) {
      return Result.err(
        new NoteVisibilityInvalidError('Note invisible', { cause: null }),
      );
    }

    for (const v of unwrappedLists) {
      const checkRes = await this.timelineLimitCheck('list', v);
      if (Result.isErr(checkRes)) {
        return checkRes;
      }
    }

    const res = await Promise.all(
      unwrappedLists.map((v) => {
        return this.timelineNotesCacheRepository.addNotesToList(v, [note]);
      }),
    );
    return res.find(Result.isErr) ?? Result.ok(undefined);
  }
}

export const pushTimelineSymbol = Ether.newEtherSymbol<PushTimelineService>();
export const pushTimeline = Ether.newEther(
  pushTimelineSymbol,
  ({
    accountModule,
    noteVisibility,
    timelineNotesCacheRepository,
    fetchSubscribedListService,
  }) =>
    new PushTimelineService(
      accountModule,
      noteVisibility,
      timelineNotesCacheRepository,
      fetchSubscribedListService,
    ),
  {
    accountModule: Ether.newEtherSymbol<AccountModuleFacade>(),
    noteVisibility: Ether.newEtherSymbol<NoteVisibilityService>(),
    timelineNotesCacheRepository: timelineNotesCacheRepoSymbol,
    fetchSubscribedListService:
      Ether.newEtherSymbol<FetchSubscribedListService>(),
  },
);
