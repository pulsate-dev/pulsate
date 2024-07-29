import { Ether, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Note, NoteID } from '../../notes/model/note.js';
import type { List, ListID } from './list.js';

export interface FetchAccountTimelineFilter {
  id: AccountID;
  /** @default false */
  hasAttachment: boolean;
  /** @default false */
  noNsfw: boolean;
  /** @default undefined
   *  @description if undefined, Retrieved from latest notes */
  beforeId?: NoteID;
}
export type FetchHomeTimelineFilter = Omit<FetchAccountTimelineFilter, 'id'>;

export interface TimelineRepository {
  /**
   * @description Fetch account timeline
   * @param accountId ID of the account from which the Note is obtained
   * @param filter Filter for fetching notes
   * */
  getAccountTimeline(
    accountId: AccountID,
    filter: FetchAccountTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>>;

  /**
   * @description Fetch home timeline
   * @param noteIDs IDs of the notes to be fetched
   * @param filter Filter for fetching notes
   * */
  getHomeTimeline(
    noteIDs: readonly NoteID[],
    filter: FetchAccountTimelineFilter,
  ): Promise<Result.Result<Error, Note[]>>;

  /**
   * @description Fetch list timeline
   * @param noteId IDs of the notes to be fetched
   * */
  fetchListTimeline(
    noteId: readonly NoteID[],
  ): Promise<Result.Result<Error, Note[]>>;
}
export const timelineRepoSymbol = Ether.newEtherSymbol<TimelineRepository>();

export type CacheObjectKey =
  `timeline:${'home' | 'list'}:${AccountID | ListID}`;
export interface TimelineNotesCacheRepository {
  addNotesToHomeTimeline(
    accountID: AccountID,
    notes: readonly Note[],
  ): Promise<Result.Result<Error, void>>;

  addNotesToList(
    listID: ListID,
    notes: readonly Note[],
  ): Promise<Result.Result<Error, void>>;

  getListTimeline(listID: ListID): Promise<Result.Result<Error, NoteID[]>>;

  getHomeTimeline(
    accountID: AccountID,
  ): Promise<Result.Result<Error, NoteID[]>>;
}
export const timelineNotesCacheRepoSymbol =
  Ether.newEtherSymbol<TimelineNotesCacheRepository>();

export interface ListRepository {
  create(list: List): Promise<Result.Result<Error, void>>;
  fetchList(listId: ListID): Promise<Result.Result<Error, List>>;
  fetchListsByOwnerId(
    ownerId: AccountID,
  ): Promise<Result.Result<Error, List[]>>;
  fetchListMembers(listId: ListID): Promise<Result.Result<Error, AccountID[]>>;
  /**
   * @description Fetch lists by member account ID
   * @param accountId ID of the account to which the list belongs
   */
  fetchListsByMemberAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, List[]>>;
  deleteById(listId: ListID): Promise<Result.Result<Error, void>>;
}
