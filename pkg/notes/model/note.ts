import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';

export type NoteID = string;
export type NoteVisibility = 'public' | 'home' | 'followers' | 'direct';

export interface CreateNoteArgs {
  id: ID<NoteID>;
  content: string;
  visibility: NoteVisibility;
  attachmentFileIDs: string[];
  cwComment: string;
  sendTo?: ID<AccountID>;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Note {
  private constructor(arg: CreateNoteArgs) {
    this.id = arg.id;
    this.content = arg.content;
    this.visibility = arg.visibility;
    this.attachmentFileIDs = arg.attachmentFileIDs;
    this.cwComment = arg.cwComment;
    this.sendTo = arg.sendTo;
    this.createdAt = arg.createdAt;
    this.updatedAt = arg.updatedAt;
    this.deletedAt = arg.deletedAt;
  }

  static new(arg: Omit<CreateNoteArgs, 'updatedAt' | 'deletedAt'>) {
    if (arg.attachmentFileIDs.length > 16) {
      throw new Error('Too many attachments');
    }
    if ([...arg.content].length > 3000) {
      throw new Error('Too long contents');
    }
    if ([...arg.content].length === 0 && arg.attachmentFileIDs.length === 0) {
      throw new Error('No contents');
    }
    if (arg.visibility === 'direct' && !arg.sendTo) {
      throw new Error('No destination');
    }

    return new Note(arg);
  }

  static reconstruct(arg: CreateNoteArgs) {
    return new Note(arg);
  }

  private readonly id: ID<NoteID>;
  getID(): ID<NoteID> {
    return this.id;
  }

  private readonly content: string;
  getContent(): string {
    return this.content;
  }

  private readonly visibility: NoteVisibility;
  getVisibility(): NoteVisibility {
    return this.visibility;
  }
  private readonly attachmentFileIDs: string[];
  getAttachmentFileIDs(): string[] {
    return this.attachmentFileIDs;
  }

  private readonly cwComment: string;
  getCwComment(): string {
    return this.cwComment;
  }

  private readonly sendTo: ID<AccountID> | undefined;
  getSendTo(): ID<AccountID> | undefined {
    return this.sendTo;
  }

  private readonly createdAt: Date;
  getCreatedAt(): Date {
    return this.createdAt;
  }

  private readonly updatedAt: Date | undefined;
  getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  private deletedAt: Date | undefined;
  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }
  setDeletedAt(deletedAt: Date) {
    if (this.createdAt > deletedAt) {
      throw new Error('deletedAt must be after createdAt');
    }
    this.deletedAt = deletedAt;
  }
}
