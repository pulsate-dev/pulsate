import { Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { Note } from '../../notes/model/note.js';
import type {
  FetchAccountTimelineFilter,
  TimelineRepository,
} from '../model/repository.js';
import type { NoteVisibilityService } from './noteVisibility.js';

export class AccountTimelineService {
  constructor(
    private readonly noteVisibilityService: NoteVisibilityService,
    private readonly timelineRepository: TimelineRepository,
  ) {}

  async handle(
    targetId: ID<AccountID>,
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
      const visibility = await this.noteVisibilityService.handle({
        accountID: filter.id,
        note: v,
      });
      if (visibility) {
        filtered.push(v);
      }
    }

    return Result.ok(filtered);
  }
}
