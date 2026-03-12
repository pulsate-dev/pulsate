import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../accounts/model/account.js';
import { AccountNotFoundError } from '../../accounts/model/errors.js';
import type { MediumID } from '../../drive/model/medium.js';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../id/mod.js';
import {
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.js';
import {
  NoteInsufficientPermissionError,
  NoteNotFoundError,
  NoteTooManyAttachmentsError,
  NoteVisibilityInvalidError,
} from '../model/errors.js';
import type { NoteID, NoteVisibility } from '../model/note.js';
import { Note } from '../model/note.js';
import {
  type NoteAttachmentRepository,
  type NoteRepository,
  noteAttachmentRepoSymbol,
  noteRepoSymbol,
} from '../model/repository.js';

export class RenoteService {
  constructor(
    private readonly deps: {
      noteRepository: NoteRepository;
      idGenerator: SnowflakeIDGenerator;
      noteAttachmentRepository: NoteAttachmentRepository;
      accountModule: AccountModuleFacade;
      clock: Clock;
    },
  ) {}

  /**
   * Renote a note
   * @returns created note
   */
  async handle(
    originalID: NoteID,
    content: string,
    contentsWarningComment: string,
    authorID: AccountID,
    attachmentFileID: MediumID[],
    visibility: NoteVisibility,
  ): Promise<Result.Result<Error, Note>> {
    const actorRes = await this.deps.accountModule.fetchAccount(authorID);
    if (Result.isErr(actorRes)) {
      return Result.err(
        new AccountNotFoundError('Account not found', { cause: null }),
      );
    }
    const actor = Result.unwrap(actorRes);
    if (!this.isAllowed(actor, visibility)) {
      return Result.err(
        new NoteInsufficientPermissionError('Not allowed', { cause: null }),
      );
    }

    // NOTE: PUBLIC, HOME note can be renote
    switch (visibility) {
      case 'PUBLIC':
      case 'HOME':
        break;
      default:
        return Result.err(
          new NoteVisibilityInvalidError('Invalid visibility', { cause: null }),
        );
    }

    if (attachmentFileID.length > 16) {
      return Result.err(
        new NoteTooManyAttachmentsError('Too many attachments', {
          cause: null,
        }),
      );
    }

    const originalNoteRes = await this.resolveOriginalNote(originalID);
    if (Result.isErr(originalNoteRes)) {
      return originalNoteRes;
    }
    const originalNote = Result.unwrap(originalNoteRes);

    const visibilityCheckRes = this.checkOriginalVisibility(
      originalNote,
      authorID,
    );
    if (Result.isErr(visibilityCheckRes)) {
      return visibilityCheckRes;
    }

    const id = this.deps.idGenerator.generate<Note>();
    if (Result.isErr(id)) {
      return id;
    }

    const now = this.deps.clock.now();
    const noteArgs = {
      id: Result.unwrap(id) as NoteID,
      authorID: authorID,
      createdAt: new Date(Number(now)),
      attachmentFileID: attachmentFileID,
      sendTo: Option.none() as Option.Option<AccountID>,
      visibility: visibility,
    };

    const isQuote =
      content !== '' ||
      contentsWarningComment !== '' ||
      attachmentFileID.length > 0;

    const renote = isQuote
      ? Note.quote(originalNote, {
          ...noteArgs,
          content: content,
          contentsWarningComment: contentsWarningComment,
        })
      : Note.renote(originalNote, noteArgs);

    const res = await this.deps.noteRepository.create(renote);
    if (Result.isErr(res)) {
      return res;
    }

    if (attachmentFileID.length !== 0) {
      const attachmentRes = await this.deps.noteAttachmentRepository.create(
        renote.getID(),
        renote.getAttachmentFileID(),
      );
      if (Result.isErr(attachmentRes)) {
        return attachmentRes;
      }
    }

    return Result.ok(renote);
  }

  private async resolveOriginalNote(
    originalID: NoteID,
  ): Promise<Result.Result<Error, Note>> {
    const res = await this.deps.noteRepository.findByID(originalID);
    if (Option.isNone(res)) {
      return Result.err(
        new NoteNotFoundError('Original note not found', { cause: null }),
      );
    }
    const note = Option.unwrap(res);

    if (!note.isRenote()) {
      return Result.ok(note);
    }

    const rootID = Option.unwrap(note.getOriginalNoteID());
    const rootRes = await this.deps.noteRepository.findByID(rootID);
    if (Option.isNone(rootRes)) {
      return Result.err(
        new NoteNotFoundError('Original note not found', { cause: null }),
      );
    }
    return Result.ok(Option.unwrap(rootRes));
  }

  private checkOriginalVisibility(
    originalNote: Note,
    authorID: AccountID,
  ): Result.Result<Error, void> {
    switch (originalNote.getVisibility()) {
      case 'PUBLIC':
      case 'HOME':
        return Result.ok(undefined);
      case 'FOLLOWERS':
        if (originalNote.getAuthorID() !== authorID) {
          return Result.err(
            new NoteVisibilityInvalidError(
              'Can not renote others FOLLOWERS note',
              { cause: null },
            ),
          );
        }
        return Result.ok(undefined);
      case 'DIRECT':
        return Result.err(
          new NoteVisibilityInvalidError('Can not renote direct note', {
            cause: null,
          }),
        );
    }
  }

  private isAllowed(actor: Account, visibility: NoteVisibility): boolean {
    // NOTE: an actor must be active
    if (!actor.isActivated()) {
      return false;
    }

    if (actor.isFrozen()) {
      return false;
    }

    if (actor.isSilenced()) {
      // NOTE: silenced account cannot set note visibility to PUBLIC
      if (visibility === 'PUBLIC') {
        return false;
      }
    }
    return true;
  }
}
export const renoteSymbol = Ether.newEtherSymbol<RenoteService>();
export const renote = Ether.newEther(
  renoteSymbol,
  (deps) => new RenoteService(deps),
  {
    noteRepository: noteRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    noteAttachmentRepository: noteAttachmentRepoSymbol,
    accountModule: accountModuleFacadeSymbol,
    clock: clockSymbol,
  },
);
