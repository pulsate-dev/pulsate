import { Ether, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';
import type { Note, NoteID } from '../../notes/model/note.js';

export interface FetchAccountTimelineFilter {
  id: ID<AccountID>;
  /** @default false */
  hasAttachment: boolean;
  /** @default false */
  noNsfw: boolean;
  /** @default undefined
   *  @description if undefined, Retrieved from latest notes */
  beforeId?: ID<NoteID>;
}

export interface TimelineRepository {
  /**
   * @description Fetch account timeline
   * @param accountId ID of the account from which the Note is obtained
   * @param filter Filter for fetching notes
   * */
  getAccountTimeline(
    accountId: ID<AccountID>,
    filter: FetchAccountTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>>;
}
export const timelineRepoSymbol = Ether.newEtherSymbol<TimelineRepository>();
