import { Ether, Option, Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../accounts/model/account.js';
import type { MediumID } from '../../drive/model/medium.js';
import {
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.js';
import {
  type TimelineModuleFacade,
  timelineModuleFacadeSymbol,
} from '../../intermodule/timeline.js';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.js';
import { checkVisibilityForSilencedActor } from '../model/createDomainService.js';
import {
  NoteInsufficientPermissionError,
  NoteNotFoundError,
} from '../model/errors.js';
import { Note, type NoteID, type NoteVisibility } from '../model/note.js';
import { getRenoteChainRootID } from '../model/renoteDomainService.js';
import {
  type NoteAttachmentRepository,
  type NoteRepository,
  noteAttachmentRepoSymbol,
  noteRepoSymbol,
} from '../model/repository.js';
import { fetchActor } from './fetchActor.js';

export class RenoteService {
  constructor(
    private readonly deps: {
      noteRepository: NoteRepository;
      idGenerator: SnowflakeIDGenerator;
      noteAttachmentRepository: NoteAttachmentRepository;
      accountModule: AccountModuleFacade;
      timelineModule: TimelineModuleFacade;
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
    const actorRes = await fetchActor(this.deps.accountModule, authorID);
    if (Result.isErr(actorRes)) {
      return actorRes;
    }
    const actor = Result.unwrap(actorRes);
    if (!this.isAllowed(actor, visibility)) {
      return Result.err(
        new NoteInsufficientPermissionError('Not allowed', { cause: null }),
      );
    }

    const originalNoteRes = await this.resolveOriginalNote(originalID);
    if (Result.isErr(originalNoteRes)) {
      return originalNoteRes;
    }
    const originalNote = Result.unwrap(originalNoteRes);

    const visibilityCheckRes = originalNote.canBeRenotedBy(authorID);
    if (Result.isErr(visibilityCheckRes)) {
      return visibilityCheckRes;
    }

    const idRes = this.deps.idGenerator.generate<Note>();
    if (Result.isErr(idRes)) {
      return idRes;
    }
    const id = Result.unwrap(idRes);

    const now = this.deps.clock.now();
    const noteArgs = {
      id,
      content: content,
      contentsWarningComment: contentsWarningComment,
      originalNoteID: Option.some(originalNote.getID()),
      authorID: authorID,
      attachmentFileID: attachmentFileID,
      visibility: visibility,
      sendTo: Option.none(),
      createdAt: new Date(Number(now)),
    };

    const renoteRes = Note.new(noteArgs);
    if (Result.isErr(renoteRes)) {
      return renoteRes;
    }
    const renote = Result.unwrap(renoteRes);

    if (attachmentFileID.length !== 0) {
      const attachmentRes = await this.deps.noteAttachmentRepository.create(
        renote.getID(),
        renote.getAttachmentFileID(),
      );
      if (Result.isErr(attachmentRes)) {
        return attachmentRes;
      }
    }

    const res = await this.deps.noteRepository.create(renote);
    if (Result.isErr(res)) {
      return res;
    }

    // ToDo: Even if the note cannot be pushed to the timeline, the note is created successfully, so there is no error here.
    // ToDo: use job queue to push note to timeline
    await this.deps.timelineModule.pushNoteToTimeline(renote);

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

    // NOTE: For pure renotes the chain is followed one hop to the root; for
    // quotes and ordinary notes the target note itself is the original. The
    // decision is owned by the renote domain service.
    const chainRootID = getRenoteChainRootID(note);
    if (Option.isNone(chainRootID)) {
      return Result.ok(note);
    }

    const rootRes = await this.deps.noteRepository.findByID(
      Option.unwrap(chainRootID),
    );
    if (Option.isNone(rootRes)) {
      return Result.err(
        new NoteNotFoundError('Original note not found', { cause: null }),
      );
    }
    return Result.ok(Option.unwrap(rootRes));
  }

  private isAllowed(actor: Account, visibility: NoteVisibility): boolean {
    // NOTE: an actor must be active
    if (!actor.isActivated()) {
      return false;
    }

    if (actor.isFrozen()) {
      return false;
    }

    return Result.isOk(
      checkVisibilityForSilencedActor(actor.isSilenced(), visibility),
    );
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
    timelineModule: timelineModuleFacadeSymbol,
    clock: clockSymbol,
  },
);
