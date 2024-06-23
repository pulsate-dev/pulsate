import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { SnowflakeIDGenerator } from '../../id/mod.js';
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
  ) {}

  async handle(
    originalNoteID: NoteID,
    content: string,
    contentsWarningComment: string,
    authorID: AccountID,
    attachmentFileID: MediumID[],
    visibility: NoteVisibility,
  ): Promise<Result.Result<Error, Note>> {
    if (visibility === 'DIRECT') {
      return Result.err(new Error('Renote must not be direct note'));
    }
    if (attachmentFileID.length > 16) {
      return Result.err(new Error('Too many attachments'));
    }

    // ToDo: check renote-able
    const originalNote = await this.noteRepository.findByID(originalNoteID);
    if (Option.isNone(originalNote)) {
      return Result.err(new Error('Original note not found'));
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
}
