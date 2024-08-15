import { Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import type { SnowflakeIDGenerator } from '../../id/mod.js';
import type { TimelineModuleFacade } from '../../intermodule/timeline.js';
import { Note, type NoteID, type NoteVisibility } from '../model/note.js';
import type {
  NoteAttachmentRepository,
  NoteRepository,
} from '../model/repository.js';

export class CreateService {
  async handle(
    content: string,
    contentsWarningComment: string,
    sendTo: Option.Option<AccountID>,
    authorID: AccountID,
    attachmentFileID: MediumID[],
    visibility: NoteVisibility,
  ): Promise<Result.Result<Error, Note>> {
    if (attachmentFileID.length > 16) {
      return Result.err(new Error('Too many attachments'));
    }
    const id = this.idGenerator.generate<Note>();
    if (Result.isErr(id)) {
      return id;
    }
    try {
      const note = Note.new({
        id: id[1] as NoteID,
        content: content,
        contentsWarningComment: contentsWarningComment,
        createdAt: new Date(),
        sendTo: sendTo,
        originalNoteID: Option.none(),
        attachmentFileID: attachmentFileID,
        visibility: visibility,
        authorID: authorID,
      });
      const res = await this.noteRepository.create(note);
      if (Result.isErr(res)) {
        return res;
      }

      if (attachmentFileID.length !== 0) {
        const attachmentRes = await this.noteAttachmentRepository.create(
          note.getID(),
          note.getAttachmentFileID(),
        );
        if (Result.isErr(attachmentRes)) {
          return attachmentRes;
        }
      }

      // ToDo: Even if the note cannot be pushed to the timeline, the note is created successfully, so there is no error here.
      await this.timelineModule.pushNoteToTimeline(note);

      return Result.ok(note);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly idGenerator: SnowflakeIDGenerator,
    private readonly noteAttachmentRepository: NoteAttachmentRepository,
    private readonly timelineModule: TimelineModuleFacade,
  ) {}
}
