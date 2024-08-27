import { Option, Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { SnowflakeIDGenerator } from '../../id/mod.js';
import type { AccountModuleFacade } from '../../intermodule/account.js';
import type { NoteID, NoteVisibility } from '../model/note.js';
import { Note } from '../model/note.js';
import type {
  NoteAttachmentRepository,
  NoteRepository,
} from '../model/repository.js';

export class RenoteService {
  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly idGenerator: SnowflakeIDGenerator,
    private readonly noteAttachmentRepository: NoteAttachmentRepository,
    private readonly accountModule: AccountModuleFacade,
  ) {}

  /**
   * Renote a note
   * @returns created note
   */
  async handle(
    originalNoteID: NoteID,
    content: string,
    contentsWarningComment: string,
    authorID: AccountID,
    attachmentFileID: MediumID[],
    visibility: NoteVisibility,
  ): Promise<Result.Result<Error, Note>> {
    const actorRes = await this.accountModule.fetchAccount(authorID);
    if (Result.isErr(actorRes)) {
      return Result.err(new Error('Account not found'));
    }
    const actor = Result.unwrap(actorRes);
    if (!this.isAllowed(actor, visibility)) {
      return Result.err(new Error('Not allowed'));
    }

    // NOTE: PUBLIC, HOME note can be renote
    switch (visibility) {
      case 'PUBLIC':
        break;
      case 'HOME':
        break;
      default:
        return Result.err(new Error('Invalid visibility'));
    }

    if (attachmentFileID.length > 16) {
      return Result.err(new Error('Too many attachments'));
    }

    const originalNoteRes = await this.noteRepository.findByID(originalNoteID);
    if (Option.isNone(originalNoteRes)) {
      return Result.err(new Error('Original note not found'));
    }
    const originalNote = Option.unwrap(originalNoteRes);

    switch (originalNote.getVisibility()) {
      case 'PUBLIC':
        break;
      case 'HOME':
        break;

      case 'FOLLOWERS':
        // NOTE: FOLLOWERS note can renote only author
        if (originalNote.getAuthorID() !== authorID) {
          return Result.err(new Error('Can not renote others FOLLOWERS note'));
        }
        break;
      case 'DIRECT':
        // NOTE: can not renote direct note
        return Result.err(new Error('Can not renote direct note'));
    }

    const id = this.idGenerator.generate<Note>();
    if (Result.isErr(id)) {
      return id;
    }

    const renote = Note.new({
      id: Result.unwrap(id) as NoteID,
      authorID: authorID,
      content: content,
      contentsWarningComment: contentsWarningComment,
      createdAt: new Date(),
      originalNoteID: Option.some(originalNoteID),
      attachmentFileID: attachmentFileID,
      // NOTE: Direct note is can not renote
      sendTo: Option.none(),
      visibility: visibility,
    });

    const res = await this.noteRepository.create(renote);
    if (Result.isErr(res)) {
      return res;
    }

    if (attachmentFileID.length !== 0) {
      const attachmentRes = await this.noteAttachmentRepository.create(
        renote.getID(),
        renote.getAttachmentFileID(),
      );
      if (Result.isErr(attachmentRes)) {
        return attachmentRes;
      }
    }

    return Result.ok(renote);
  }

  private isAllowed(actor: Account, visibility: NoteVisibility): boolean {
    // NOTE: actor must be active, not frozen
    if (!(actor.getStatus() === 'active' || actor.getFrozen() === 'normal')) {
      return false;
    }

    if (actor.getStatus() === 'notActivated') {
      return false;
    }
    if (actor.getFrozen() === 'frozen') {
      return false;
    }
    if (actor.getSilenced() === 'silenced') {
      // NOTE: silenced account can not set note visibility to PUBLIC
      if (visibility === 'PUBLIC') {
        return false;
      }
    }
    return true;
  }
}
