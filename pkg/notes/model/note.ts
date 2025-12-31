import { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { ID } from '../../id/type.js';
import {
  NoteContentLengthError,
  NoteNoDestinationError,
  NoteTooManyAttachmentsError,
} from './errors.js';

export type NoteID = ID<Note>;
export type NoteVisibility = 'PUBLIC' | 'HOME' | 'FOLLOWERS' | 'DIRECT';

export interface CreateNoteArgs {
  id: NoteID;
  authorID: AccountID;
  content: string;
  visibility: NoteVisibility;
  contentsWarningComment: string;
  sendTo: Option.Option<AccountID>;
  originalNoteID: Option.Option<NoteID>;
  attachmentFileID: readonly MediumID[];
  createdAt: Date;
  updatedAt: Option.Option<Date>;
  deletedAt: Option.Option<Date>;
}

export class Note {
  private constructor(arg: CreateNoteArgs) {
    this.id = arg.id;
    this.authorID = arg.authorID;
    this.content = arg.content;
    this.visibility = arg.visibility;
    this.contentsWarningComment = arg.contentsWarningComment;
    this.sendTo = arg.sendTo;
    this.originalNoteID = arg.originalNoteID;
    this.attachmentFileID = arg.attachmentFileID;
    this.createdAt = arg.createdAt;
    this.updatedAt = arg.updatedAt;
    this.deletedAt = arg.deletedAt;
  }

  static new(arg: Omit<CreateNoteArgs, 'updatedAt' | 'deletedAt'>) {
    /*
    Note must satisfy the following conditions:
    - content length <= 3k
    - contentsWarningComment length <= 256
    - attachmentFileID length <= 16
    - if (visibility is "DIRECT")  sendTo must be Some
    - if (not a renote i.e., originalNoteID is None) and (content, contentsWarningComment, and attachmentFileID are all empty) throw error
     */

    if ([...arg.content].length > 3000) {
      throw new NoteContentLengthError('Content too long', {
        cause: { contentLength: [...arg.content].length },
      });
    }

    if ([...arg.contentsWarningComment].length > 256) {
      throw new NoteContentLengthError('ContentsWarningComment too long', {
        cause: {
          contentsWarningCommentLength: [...arg.contentsWarningComment].length,
        },
      });
    }

    if (arg.attachmentFileID.length > 16) {
      throw new NoteTooManyAttachmentsError('Too many attachments', {
        cause: { attachmentCount: arg.attachmentFileID.length },
      });
    }

    if (
      Option.isNone(arg.originalNoteID) &&
      arg.content === '' &&
      arg.contentsWarningComment === '' &&
      arg.attachmentFileID.length === 0
    ) {
      throw new NoteContentLengthError('Note must have content', {
        cause: null,
      });
    }

    if (arg.visibility === 'DIRECT' && Option.isNone(arg.sendTo)) {
      throw new NoteNoDestinationError('No destination', { cause: null });
    }

    return new Note({
      ...arg,
      updatedAt: Option.none(),
      deletedAt: Option.none(),
    });
  }

  static reconstruct(arg: CreateNoteArgs) {
    return new Note(arg);
  }

  private readonly id: NoteID;
  getID(): NoteID {
    return this.id;
  }

  private readonly authorID: AccountID;
  getAuthorID(): AccountID {
    return this.authorID;
  }

  private readonly content: string;
  getContent(): string {
    return this.content;
  }

  private readonly visibility: NoteVisibility;
  getVisibility(): NoteVisibility {
    return this.visibility;
  }

  private readonly contentsWarningComment: string;
  getCwComment(): string {
    return this.contentsWarningComment;
  }

  private readonly sendTo: Option.Option<AccountID>;
  getSendTo(): Option.Option<AccountID> {
    return this.sendTo;
  }

  private readonly originalNoteID: Option.Option<NoteID>;
  getOriginalNoteID(): Option.Option<NoteID> {
    return this.originalNoteID;
  }

  private readonly attachmentFileID: readonly MediumID[];
  getAttachmentFileID(): readonly MediumID[] {
    return this.attachmentFileID;
  }

  private readonly createdAt: Date;
  getCreatedAt(): Date {
    return this.createdAt;
  }

  private readonly updatedAt: Option.Option<Date>;
  getUpdatedAt(): Option.Option<Date> {
    return this.updatedAt;
  }

  private deletedAt: Option.Option<Date>;
  getDeletedAt(): Option.Option<Date> {
    return this.deletedAt;
  }
  setDeletedAt(deletedAt: Date) {
    if (this.createdAt > deletedAt) {
      throw new Error('deletedAt must be after createdAt');
    }
    this.deletedAt = Option.some(deletedAt);
  }
}
