import { Option, Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { ID } from '../../id/type.js';
import {
  NoteContentLengthError,
  NoteDateInvalidError,
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

export type NewNoteArgs = Omit<CreateNoteArgs, 'updatedAt' | 'deletedAt'>;

type NoteValidationError =
  | NoteContentLengthError
  | NoteTooManyAttachmentsError
  | NoteNoDestinationError;

const segmenter = new Intl.Segmenter();
const graphemeLength = (s: string): number => [...segmenter.segment(s)].length;

const noteContentSchema = v.pipe(
  v.string(),
  v.check((s) => graphemeLength(s) <= 3000),
);

const cwCommentSchema = v.pipe(
  v.string(),
  v.check((s) => graphemeLength(s) <= 256),
);

export class Note {
  readonly #id: NoteID;
  readonly #authorID: AccountID;
  readonly #content: string;
  readonly #visibility: NoteVisibility;
  readonly #contentsWarningComment: string;
  readonly #sendTo: Option.Option<AccountID>;
  readonly #originalNoteID: Option.Option<NoteID>;
  readonly #attachmentFileID: readonly MediumID[];
  readonly #createdAt: Date;
  readonly #updatedAt: Option.Option<Date>;
  #deletedAt: Option.Option<Date>;

  private constructor(arg: CreateNoteArgs) {
    this.#id = arg.id;
    this.#authorID = arg.authorID;
    this.#content = arg.content;
    this.#visibility = arg.visibility;
    this.#contentsWarningComment = arg.contentsWarningComment;
    this.#sendTo = arg.sendTo;
    this.#originalNoteID = arg.originalNoteID;
    this.#attachmentFileID = arg.attachmentFileID;
    this.#createdAt = arg.createdAt;
    this.#updatedAt = arg.updatedAt;
    this.#deletedAt = arg.deletedAt;
  }

  static new(
    args: Omit<CreateNoteArgs, 'updatedAt' | 'deletedAt'>,
  ): Result.Result<NoteValidationError, Note> {
    if (Option.isSome(args.originalNoteID)) {
      if (Note.#isThisArgsQuote(args)) {
        return Note.#quote(args);
      }
      return Note.#renote(args);
    }
    const err = Note.#checkArgs(args);
    if (Result.isErr(err)) return err;
    return Result.ok(
      new Note({ ...args, updatedAt: Option.none(), deletedAt: Option.none() }),
    );
  }

  static reconstruct(arg: CreateNoteArgs): Note {
    return new Note(arg);
  }

  static #checkArgs(
    arg: Omit<CreateNoteArgs, 'updatedAt' | 'deletedAt'>,
  ): Result.Result<NoteValidationError, void> {
    /*
    Note must satisfy the following conditions:
    - content length <= 3k
    - contentsWarningComment length <= 256
    - attachmentFileID length <= 16
    - if (visibility is "DIRECT")  sendTo must be Some
    - if (not a renote i.e., originalNoteID is None) and (content, contentsWarningComment, and attachmentFileID are all empty) return error
     */

    if (!v.safeParse(noteContentSchema, arg.content).success) {
      return Result.err(
        new NoteContentLengthError('Content too long', {
          cause: { contentLength: graphemeLength(arg.content) },
        }),
      );
    }

    if (!v.safeParse(cwCommentSchema, arg.contentsWarningComment).success) {
      return Result.err(
        new NoteContentLengthError('ContentsWarningComment too long', {
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
        new NoteTooManyAttachmentsError('Too many attachments', {
          cause: { attachmentCount: arg.attachmentFileID.length },
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
        new NoteContentLengthError('Note must have content', {
          cause: null,
        }),
      );
    }

    if (arg.visibility === 'DIRECT' && Option.isNone(arg.sendTo)) {
      return Result.err(
        new NoteNoDestinationError('No destination', { cause: null }),
      );
    }

    return Result.ok(undefined);
  }

  static #renote(
    arg: Pick<
      CreateNoteArgs,
      | 'id'
      | 'authorID'
      | 'visibility'
      | 'originalNoteID'
      | 'attachmentFileID'
      | 'createdAt'
    >,
  ): Result.Result<NoteValidationError, Note> {
    const normalizedArg = {
      ...arg,
      // NOTE: Renotes do not have content or contentsWarningComment
      content: '',
      contentsWarningComment: '',
      sendTo: Option.none(),
    } as const;
    const err = Note.#checkArgs(normalizedArg);
    if (Result.isErr(err)) return err;
    return Result.ok(
      new Note({
        ...normalizedArg,
        updatedAt: Option.none(),
        deletedAt: Option.none(),
      }),
    );
  }

  static #quote(
    arg: Pick<
      CreateNoteArgs,
      | 'id'
      | 'authorID'
      | 'content'
      | 'visibility'
      | 'contentsWarningComment'
      | 'sendTo'
      | 'originalNoteID'
      | 'attachmentFileID'
      | 'createdAt'
    >,
  ): Result.Result<NoteValidationError, Note> {
    if (
      arg.content === '' &&
      arg.contentsWarningComment === '' &&
      arg.attachmentFileID.length === 0
    ) {
      return Result.err(
        new NoteContentLengthError('Quote must have content', {
          cause: null,
        }),
      );
    }

    const normalizedArg = { ...arg, sendTo: Option.none() } as const;
    const err = Note.#checkArgs(normalizedArg);
    if (Result.isErr(err)) return err;
    return Result.ok(
      new Note({
        ...normalizedArg,
        updatedAt: Option.none(),
        deletedAt: Option.none(),
      }),
    );
  }

  static #isThisArgsQuote(
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

  getID(): NoteID {
    return this.#id;
  }

  getAuthorID(): AccountID {
    return this.#authorID;
  }

  getContent(): string {
    return this.#content;
  }

  getVisibility(): NoteVisibility {
    return this.#visibility;
  }

  getCwComment(): string {
    return this.#contentsWarningComment;
  }

  getSendTo(): Option.Option<AccountID> {
    return this.#sendTo;
  }

  getOriginalNoteID(): Option.Option<NoteID> {
    return this.#originalNoteID;
  }

  isRenote(): boolean {
    return Option.isSome(this.#originalNoteID);
  }

  isQuote(): boolean {
    if (!this.isRenote()) return false;
    if (this.#content.length > 0) return true;
    return (
      this.#contentsWarningComment.length > 0 ||
      this.#attachmentFileID.length > 0
    );
  }

  getAttachmentFileID(): readonly MediumID[] {
    return this.#attachmentFileID;
  }

  getCreatedAt(): Date {
    return this.#createdAt;
  }

  getUpdatedAt(): Option.Option<Date> {
    return this.#updatedAt;
  }

  getDeletedAt(): Option.Option<Date> {
    return this.#deletedAt;
  }

  setDeletedAt(deletedAt: Date): Result.Result<NoteDateInvalidError, void> {
    if (this.#createdAt > deletedAt) {
      return Result.err(
        new NoteDateInvalidError('deletedAt must be after createdAt', {
          cause: null,
        }),
      );
    }
    this.#deletedAt = Option.some(deletedAt);
    return Result.ok(undefined);
  }
}
