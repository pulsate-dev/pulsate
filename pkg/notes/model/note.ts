import { Option } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { ID } from '../../id/type.js';

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
  attachmentFileID: MediumID[];
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
    if ([...arg.content].length > 3000) {
      throw new Error('Too long contents');
    }
    if (arg.visibility === 'DIRECT' && Option.isNone(arg.sendTo)) {
      throw new Error('No destination');
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

  private readonly attachmentFileID: MediumID[];
  getAttachmentFileID(): MediumID[] {
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
