import { Ether, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Note } from '../../notes/model/note.js';
import {
  type FetchAccountTimelineFilter,
  type TimelineRepository,
  timelineRepoSymbol,
} from '../model/repository.js';
import {
  type NoteVisibilityService,
  noteVisibilitySymbol,
} from './noteVisibility.js';

export class AccountTimelineService {
  private readonly noteVisibilityService: NoteVisibilityService;
  private readonly timelineRepository: TimelineRepository;

  constructor(args: {
    noteVisibilityService: NoteVisibilityService;
    timelineRepository: TimelineRepository;
  }) {
    this.noteVisibilityService = args.noteVisibilityService;
    this.timelineRepository = args.timelineRepository;
  }

  async handle(
    targetId: AccountID,
    filter: FetchAccountTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>> {
    const res = await this.timelineRepository.getAccountTimeline(
      targetId,
      filter,
    );
    if (Result.isErr(res)) {
      return Result.err(res[1]);
    }

    // NOTE: AccountTimeline not include direct note
    const directFiltered = res[1].filter((v) => v.getVisibility() !== 'DIRECT');
    const filtered: Note[] = [];
    for (const v of directFiltered) {
      const isVisible = await this.noteVisibilityService.handle({
        accountID: filter.id,
        note: v,
      });
      if (isVisible) {
        filtered.push(v);
      }
    }

    return Result.ok(filtered);
  }
}
export const accountTimelineSymbol =
  Ether.newEtherSymbol<AccountTimelineService>();
export const accountTimeline = Ether.newEther(
  accountTimelineSymbol,
  (deps) => new AccountTimelineService(deps),
  {
    timelineRepository: timelineRepoSymbol,
    noteVisibilityService: noteVisibilitySymbol,
  },
);
