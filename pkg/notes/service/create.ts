import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import {
  type Clock,
  type SnowflakeIDGenerator,
  clockSymbol,
  snowflakeIDGeneratorSymbol,
} from '../../id/mod.js';
import {
  type TimelineModuleFacade,
  timelineModuleFacadeSymbol,
} from '../../intermodule/timeline.js';
import {
  NoteInternalError,
  NoteNoDestinationError,
  NoteTooLongContentsError,
  NoteTooManyAttachmentsError,
} from '../model/errors.js';
import { Note, type NoteID, type NoteVisibility } from '../model/note.js';
import {
  type NoteAttachmentRepository,
  type NoteRepository,
  noteAttachmentRepoSymbol,
  noteRepoSymbol,
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
      return Result.err(
        new NoteTooManyAttachmentsError('Too many attachments', {
          cause: null,
        }),
      );
    }
    const id = this.deps.idGenerator.generate<Note>();
    if (Result.isErr(id)) {
      return Result.err(
        new NoteInternalError('id generation failed', {
          cause: Result.unwrapErr(id),
        }),
      );
    }
    const now = this.deps.clock.now();
    try {
      const note = Note.new({
        id: id[1] as NoteID,
        content: content,
        contentsWarningComment: contentsWarningComment,
        createdAt: new Date(Number(now)),
        sendTo: sendTo,
        originalNoteID: Option.none(),
        attachmentFileID: attachmentFileID,
        visibility: visibility,
        authorID: authorID,
      });
      const res = await this.deps.noteRepository.create(note);
      if (Result.isErr(res)) {
        return res;
      }

      if (attachmentFileID.length !== 0) {
        const attachmentRes = await this.deps.noteAttachmentRepository.create(
          note.getID(),
          note.getAttachmentFileID(),
        );
        if (Result.isErr(attachmentRes)) {
          return attachmentRes;
        }
      }

      // ToDo: Even if the note cannot be pushed to the timeline, the note is created successfully, so there is no error here.
      // ToDo: use job queue to push note to timeline
      await this.deps.timelineModule.pushNoteToTimeline(note);

      return Result.ok(note);
    } catch (e) {
      if (e instanceof NoteNoDestinationError) {
        return Result.err(e);
      }
      if (e instanceof NoteTooLongContentsError) {
        return Result.err(e);
      }
      return Result.err(new NoteInternalError('unknown error', { cause: e }));
    }
  }

  constructor(
    private readonly deps: {
      noteRepository: NoteRepository;
      idGenerator: SnowflakeIDGenerator;
      noteAttachmentRepository: NoteAttachmentRepository;
      timelineModule: TimelineModuleFacade;
      clock: Clock;
    },
  ) {}
}
export const createServiceSymbol = Ether.newEtherSymbol<CreateService>();
export const createService = Ether.newEther(
  createServiceSymbol,
  (deps) => new CreateService(deps),
  {
    noteRepository: noteRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    noteAttachmentRepository: noteAttachmentRepoSymbol,
    timelineModule: timelineModuleFacadeSymbol,
    clock: clockSymbol,
  },
);
