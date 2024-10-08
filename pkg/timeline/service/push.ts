import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountModuleFacade } from '../../intermodule/account.js';
import { NoteVisibilityInvalidError } from '../../notes/model/errors.js';
import type { Note } from '../../notes/model/note.js';
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
  ) {}

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
