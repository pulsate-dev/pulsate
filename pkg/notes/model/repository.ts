import { Ether, type Option, type Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { Medium, MediumID } from '../../drive/model/medium.js';
import type { Bookmark } from './bookmark.js';
import type { Note, NoteID } from './note.js';
import type { Reaction, ReactionID } from './reaction.js';

export interface NoteRepository {
  create(note: Note): Promise<Result.Result<Error, void>>;
  findByAuthorID(
    authorID: AccountID,
    limit: number,
  ): Promise<Option.Option<Note[]>>;
  findByID(id: NoteID): Promise<Option.Option<Note>>;
  /**
   * Find notes by id\
   * NOTE: Don't use this method to fetch timeline/list notes.
   *       use {@link TimelineRepository}.\
   * NOTE: Duplicate note IDs are ignored.
   * @param ids ID of the NOTE to be obtained
   * @returns {@link Note} sorted by CreatedAt, descending
   */
  findManyByIDs(ids: NoteID[]): Promise<Result.Result<Error, Note[]>>;
  deleteByID(id: NoteID): Promise<Result.Result<Error, void>>;
  fetchRenoteStatus(
    accountID: AccountID,
    noteIDs: NoteID[],
  ): Promise<boolean[]>;
}
export const noteRepoSymbol = Ether.newEtherSymbol<NoteRepository>();

export interface BookmarkRepository {
  create(id: {
    noteID: NoteID;
    accountID: AccountID;
  }): Promise<Result.Result<Error, void>>;
  findByID(id: {
    noteID: NoteID;
    accountID: AccountID;
  }): Promise<Option.Option<Bookmark>>;
  deleteByID(id: {
    noteID: NoteID;
    accountID: AccountID;
  }): Promise<Result.Result<Error, void>>;
}
export const bookmarkRepoSymbol = Ether.newEtherSymbol<BookmarkRepository>();

export interface NoteAttachmentRepository {
  create(
    noteID: NoteID,
    attachmentFileID: readonly MediumID[],
  ): Promise<Result.Result<Error, void>>;
  findByNoteID(noteID: NoteID): Promise<Result.Result<Error, Medium[]>>;
}
export const noteAttachmentRepoSymbol =
  Ether.newEtherSymbol<NoteAttachmentRepository>();

export interface ReactionRepository {
  create(reaction: Reaction): Promise<Result.Result<Error, void>>;
  findByID(id: ReactionID): Promise<Result.Result<Error, Reaction>>;
  findByCompositeID(id: {
    noteID: NoteID;
    accountID: AccountID;
  }): Promise<Result.Result<Error, Reaction>>;
  reactionsByAccount(id: AccountID): Promise<Result.Result<Error, Reaction[]>>;
  findByNoteID(id: NoteID): Promise<Result.Result<Error, Reaction[]>>;
  deleteByID(id: ReactionID): Promise<Result.Result<Error, void>>;
}
export const reactionRepoSymbol = Ether.newEtherSymbol<ReactionRepository>();
