import { Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { ID } from '../../id/type.js';
import {
  NoteContentLengthError,
  NoteNoDestinationError,
  NoteTooManyAttachmentsError,
} from './errors.js';

export type NoteID = ID<Note>;

const noteVisibilitySchema = v.union([
  v.literal('PUBLIC'),
  v.literal('HOME'),
  v.literal('FOLLOWERS'),
  v.literal('DIRECT'),
]);
export type NoteVisibility = v.InferOutput<typeof noteVisibilitySchema>;

interface NoteConstructorArgs {
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

export type CreateNoteArgs = Omit<
  NoteConstructorArgs,
  'updatedAt' | 'deletedAt'
>;

type RenoteArgs = Omit<
  CreateNoteArgs,
  'content' | 'contentsWarningComment' | 'sendTo'
>;
type QuoteArgs = Omit<CreateNoteArgs, 'sendTo'>;

const noteTextSchema = v.object({
  content: v.pipe(
    v.string(),
    v.check((s) => [...s].length <= 3000, 'Content too long'),
  ),
  visibility: noteVisibilitySchema,
  contentsWarningComment: v.pipe(
    v.string(),
    v.check((s) => [...s].length <= 256, 'ContentsWarningComment too long'),
  ),
});

export class Note {
  private constructor(arg: NoteConstructorArgs) {
    this.id = arg.id;
    this.content = arg.content;
    this.authorID = arg.authorID;
    this.visibility = arg.visibility;
    this.contentsWarningComment = arg.contentsWarningComment;
    this.sendTo = arg.sendTo;
    this.originalNoteID = arg.originalNoteID;
    this.attachmentFileID = arg.attachmentFileID;
    this.createdAt = arg.createdAt;
    this.updatedAt = arg.updatedAt;
    this.deletedAt = arg.deletedAt;
  }

  static new(args: CreateNoteArgs): Result.Result<Error, Note> {
    if (Option.isSome(args.originalNoteID)) {
      if (Note.isThisArgsQuote(args)) {
        return Note.quote(args);
      }

      return Note.renote(args);
    }

    const checked = Note.checkArgs(args);
    if (Result.isErr(checked)) return checked;

    return Result.ok(
      new Note({
        ...Result.unwrap(checked),
        updatedAt: Option.none(),
        deletedAt: Option.none(),
      }),
    );
  }

  static reconstruct(arg: NoteConstructorArgs) {
    return new Note(arg);
  }

  private static checkArgs(
    arg: CreateNoteArgs,
  ): Result.Result<Error, CreateNoteArgs> {
    const result = v.safeParse(noteTextSchema, arg);
    if (!result.success) {
      const message = result.issues[0].message;
      return Result.err(new NoteContentLengthError(message, { cause: null }));
    }

    if (arg.attachmentFileID.length > 16) {
      return Result.err(
        new NoteTooManyAttachmentsError('Too many attachments', {
          cause: null,
        }),
      );
    }

    if (
      Option.isNone(arg.originalNoteID) &&
      arg.content === '' &&
      arg.contentsWarningComment === '' &&
      arg.attachmentFileID.length === 0
    ) {
      return Result.err(
        new NoteContentLengthError('Note must have content', { cause: null }),
      );
    }

    if (arg.visibility === 'DIRECT' && Option.isNone(arg.sendTo)) {
      return Result.err(
        new NoteNoDestinationError('No destination', { cause: null }),
      );
    }

    return Result.ok(arg);
  }

  private static renote(arg: RenoteArgs): Result.Result<Error, Note> {
    const checked = Note.checkArgs({
      ...arg,
      // NOTE: Renotes do not have content or contentsWarningComment
      content: '',
      contentsWarningComment: '',
      sendTo: Option.none(),
    });
    if (Result.isErr(checked)) return checked;

    return Result.ok(
      new Note({
        ...Result.unwrap(checked),
        updatedAt: Option.none(),
        deletedAt: Option.none(),
      }),
    );
  }

  private static quote(arg: QuoteArgs): Result.Result<Error, Note> {
    if (
      arg.content === '' &&
      arg.contentsWarningComment === '' &&
      arg.attachmentFileID.length === 0
    ) {
      return Result.err(
        new NoteContentLengthError('Quote must have content', { cause: null }),
      );
    }

    const checked = Note.checkArgs({
      ...arg,
      sendTo: Option.none(),
    });
    if (Result.isErr(checked)) return checked;

    return Result.ok(
      new Note({
        ...Result.unwrap(checked),
        updatedAt: Option.none(),
        deletedAt: Option.none(),
      }),
    );
  }

  private static isThisArgsQuote(
    args: Pick<
      CreateNoteArgs,
      'content' | 'contentsWarningComment' | 'attachmentFileID'
    >,
  ): boolean {
    return (
      args.content !== '' ||
      args.contentsWarningComment !== '' ||
      args.attachmentFileID.length > 0
    );
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

  isRenote(): boolean {
    return Option.isSome(this.originalNoteID);
  }

  isQuote(): boolean {
    if (!this.isRenote()) return false;
    if (this.content.length > 0) return true;

    return (
      this.contentsWarningComment.length > 0 || this.attachmentFileID.length > 0
    );
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
