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
  /**
   * @default undefined
   * @description if undefined, Retrieved from latest notes\
   * NOTE: Only one of beforeID/afterID can be set.
   */
  beforeId?: NoteID;
  /**
   * @default undefined
   * @description if undefined, Retrieved from oldest notes\
   * NOTE: Only one of beforeID/afterID can be set.
   */
  afterID?: NoteID;
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
   * ToDo: Add filter (noNSFW/hasAttachment)
   * */
  getHomeTimeline(
    noteIDs: readonly NoteID[],
  ): Promise<Result.Result<Error, Note[]>>;

  /**
   * @description Fetch list timeline
   * @param noteId IDs of the notes to be fetched
   * @return {@link Note}[] list of Notes, sorted by CreatedAt descending
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

  /**
   * @description Delete notes from home timeline
   * @param accountID
   * @param noteIDs
   */
  deleteNotesFromHomeTimeline(
    accountID: AccountID,
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, void>>;
  /**
   * @description Delete notes from list timeline
   * @param listID
   * @param noteIDs
   */
  deleteNotesFromListTimeline(
    listID: ListID,
    noteIDs: NoteID[],
  ): Promise<Result.Result<Error, void>>;
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
   * @param accountID ID of the account to which the list belongs
   */
  fetchListsByMemberAccountID(
    accountID: AccountID,
  ): Promise<Result.Result<Error, List[]>>;

  /**
   * @description Append account to list
   * @param listID
   * @param accountID
   */
  appendListMember(
    listID: ListID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>>;
  /**
   * @description Remove account from list
   * @param listID
   * @param accountID
   */
  removeListMember(
    listID: ListID,
    accountID: AccountID,
  ): Promise<Result.Result<Error, void>>;

  deleteById(listId: ListID): Promise<Result.Result<Error, void>>;
  edit(list: List): Promise<Result.Result<Error, void>>;
}
export const listRepoSymbol = Ether.newEtherSymbol<ListRepository>();

export type BookmarkTimelineFilter = Omit<FetchAccountTimelineFilter, 'id'>;

export interface BookmarkTimelineRepository {
  findByAccountID(
    id: AccountID,
    filter: BookmarkTimelineFilter,
  ): Promise<Result.Result<Error, NoteID[]>>;
}
export const bookmarkTimelineRepoSymbol =
  Ether.newEtherSymbol<BookmarkTimelineRepository>();

export interface ConversationRecipient {
  id: AccountID;
  /**
   * @desc Time the last message was sent
   */
  lastSentAt: Date;
  latestNoteID: NoteID;
  latestNoteAuthor: AccountID;
}
export interface ConversationRepository {
  /**
   *  @description
   *  Returns the list of {@link ConversationRecipient} that have sent and received direct notes.
   *  The sorting order is chronological (newest to oldest).
   *  NOTE: If the account has not sent or received any direct notes, an empty array is returned.
   *
   *  @returns {@link ConversationRecipient}[]
   */
  findByAccountID(
    id: AccountID,
  ): Promise<Result.Result<Error, ConversationRecipient[]>>;
}
export const conversationRepoSymbol =
  Ether.newEtherSymbol<ConversationRepository>();
