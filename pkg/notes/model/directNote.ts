import { Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { ID } from '../../internal/id/type.js';
import {
  DirectNoteContentLengthError,
  DirectNoteDateInvalidError,
  DirectNoteSelfSendError,
  DirectNoteTooManyAttachmentsError,
} from './errors.js';
import { cwCommentSchema, noteContentSchema } from './note.js';

export type DirectNoteID = ID<DirectNote>;

export interface CreateDirectNoteArgs {
  id: DirectNoteID;
  authorID: AccountID;
  recipientID: AccountID;
  content: string;
  contentsWarningComment: string;
  attachmentFileID: readonly MediumID[];
  createdAt: Date;
  deletedAt: Option.Option<Date>;
}

type DirectNoteValidationError =
  | DirectNoteContentLengthError
  | DirectNoteTooManyAttachmentsError
  | DirectNoteSelfSendError;

const segmenter = new Intl.Segmenter();
const graphemeLength = (s: string): number => [...segmenter.segment(s)].length;

export class DirectNote {
  readonly #id: DirectNoteID;
  readonly #authorID: AccountID;
  readonly #recipientID: AccountID;
  readonly #content: string;
  readonly #contentsWarningComment: string;
  readonly #attachmentFileID: readonly MediumID[];
  readonly #createdAt: Date;
  #deletedAt: Option.Option<Date>;

  private constructor(arg: CreateDirectNoteArgs) {
    this.#id = arg.id;
    this.#authorID = arg.authorID;
    this.#recipientID = arg.recipientID;
    this.#content = arg.content;
    this.#contentsWarningComment = arg.contentsWarningComment;
    this.#attachmentFileID = arg.attachmentFileID;
    this.#createdAt = arg.createdAt;
    this.#deletedAt = arg.deletedAt;
  }

  static new(
    args: Omit<CreateDirectNoteArgs, 'deletedAt'>,
  ): Result.Result<DirectNoteValidationError, DirectNote> {
    const err = DirectNote.#checkArgs(args);
    if (Result.isErr(err)) return err;
    return Result.ok(new DirectNote({ ...args, deletedAt: Option.none() }));
  }

  static reconstruct(arg: CreateDirectNoteArgs): DirectNote {
    return new DirectNote(arg);
  }

  static #checkArgs(
    arg: Omit<CreateDirectNoteArgs, 'deletedAt'>,
  ): Result.Result<DirectNoteValidationError, void> {
    if (arg.authorID === arg.recipientID) {
      return Result.err(
        new DirectNoteSelfSendError('Cannot send direct note to yourself', {
          cause: null,
        }),
      );
    }

    if (!v.safeParse(noteContentSchema, arg.content).success) {
      return Result.err(
        new DirectNoteContentLengthError('Content too long', {
          cause: { contentLength: graphemeLength(arg.content) },
        }),
      );
    }

    if (!v.safeParse(cwCommentSchema, arg.contentsWarningComment).success) {
      return Result.err(
        new DirectNoteContentLengthError('ContentsWarningComment too long', {
          cause: {
            contentsWarningCommentLength: graphemeLength(
              arg.contentsWarningComment,
            ),
          },
        }),
      );
    }

    if (arg.attachmentFileID.length > 16) {
      return Result.err(
        new DirectNoteTooManyAttachmentsError('Too many attachments', {
          cause: { attachmentCount: arg.attachmentFileID.length },
        }),
      );
    }

    if (
      arg.content === '' &&
      arg.contentsWarningComment === '' &&
      arg.attachmentFileID.length === 0
    ) {
      return Result.err(
        new DirectNoteContentLengthError('DirectNote must have content', {
          cause: null,
        }),
      );
    }

    return Result.ok(undefined);
  }

  getID(): DirectNoteID {
    return this.#id;
  }

  getAuthorID(): AccountID {
    return this.#authorID;
  }

  getRecipientID(): AccountID {
    return this.#recipientID;
  }

  getContent(): string {
    return this.#content;
  }

  getCwComment(): string {
    return this.#contentsWarningComment;
  }

  getAttachmentFileID(): readonly MediumID[] {
    return this.#attachmentFileID;
  }

  getCreatedAt(): Date {
    return this.#createdAt;
  }

  getDeletedAt(): Option.Option<Date> {
    return this.#deletedAt;
  }

  setDeletedAt(
    deletedAt: Date,
  ): Result.Result<DirectNoteDateInvalidError, void> {
    if (this.#createdAt > deletedAt) {
      return Result.err(
        new DirectNoteDateInvalidError('deletedAt must be after createdAt', {
          cause: null,
        }),
      );
    }
    this.#deletedAt = Option.some(deletedAt);
    return Result.ok(undefined);
  }
}
