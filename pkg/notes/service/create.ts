import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
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
import { NoteVisibilityInvalidError } from '../model/errors.js';
import { Note, type NoteID, type NoteVisibility } from '../model/note.js';
import {
  type NoteAttachmentRepository,
  type NoteRepository,
  noteAttachmentRepoSymbol,
  noteRepoSymbol,
} from '../model/repository.js';
import { fetchActor } from './fetchActor.js';

export class CreateService {
  async handle(
    content: string,
    contentsWarningComment: string,
    authorID: AccountID,
    attachmentFileID: MediumID[],
    visibility: NoteVisibility,
  ): Promise<Result.Result<Error, Note>> {
    if (visibility === 'DIRECT') {
      return Result.err(
        new NoteVisibilityInvalidError(
          'Direct notes must use CreateDirectNoteService',
          { cause: null },
        ),
      );
    }

    const now = this.#deps.clock.now();

    return (
      Cat.doT(Promise.resultMonad<Error>())
        .addM('actor', fetchActor(this.#deps.accountModule, authorID))
        .runWith(({ actor }) =>
          Promise.resolve(
            checkVisibilityForSilencedActor(actor.isSilenced(), visibility),
          ).then(Result.map(() => [])),
        )
        .addM('id', Promise.resolve(this.#deps.idGenerator.generate<Note>()))
        .addMWith('note', ({ id }) =>
          Promise.resolve(
            Note.new({
              id: id as NoteID,
              content: content,
              contentsWarningComment: contentsWarningComment,
              createdAt: new Date(Number(now)),
              sendTo: Option.none(),
              originalNoteID: Option.none(),
              attachmentFileID: attachmentFileID,
              visibility: visibility,
              authorID: authorID,
            }),
          ),
        )
        .runWith(({ note }) =>
          this.#deps.noteRepository.create(note).then(Result.map(() => [])),
        )
        .runWith(({ note }) =>
          this.#deps.noteAttachmentRepository
            .create(note.getID(), note.getAttachmentFileID())
            .then(Result.map(() => [])),
        )
        // ToDo: Even if the note cannot be pushed to the timeline, the note is created successfully, so there is no error here.
        // ToDo: use job queue to push note to timeline
        .runWith(({ note }) =>
          this.#deps.timelineModule
            .pushNoteToTimeline(note)
            .then(() => Result.ok([])),
        )
        // NOTE: In dev mode, notify the TimelineRepository about note creation.
        .runWith(({ note }) =>
          this.notifyToSubscribers(note).then(() => Result.ok([])),
        )
        .finish(({ note }) => note)
    );
  }
  readonly #deps: {
    noteRepository: NoteRepository;
    idGenerator: SnowflakeIDGenerator;
    noteAttachmentRepository: NoteAttachmentRepository;
    accountModule: AccountModuleFacade;
    timelineModule: TimelineModuleFacade;
    clock: Clock;
  };
  constructor(deps: {
    noteRepository: NoteRepository;
    idGenerator: SnowflakeIDGenerator;
    noteAttachmentRepository: NoteAttachmentRepository;
    accountModule: AccountModuleFacade;
    timelineModule: TimelineModuleFacade;
    clock: Clock;
  }) {
    this.#deps = deps;
  }

  #subscribers: Array<(note: Note) => Promise<void>> = [];

  /**
   * @description Subscribe to note creation events (for development use only)
   * @param callBack
   */
  subscribeNoteCreated(callBack: (note: Note) => Promise<void>) {
    this.#subscribers.push(callBack);
  }

  private async notifyToSubscribers(note: Note) {
    await Promise.allSettled(this.#subscribers.map((s) => s(note)));
  }
}
export const createServiceSymbol = Ether.newEtherSymbol<CreateService>();
export const createService = Ether.newEther(
  createServiceSymbol,
  (deps) => new CreateService(deps),
  {
    noteRepository: noteRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    noteAttachmentRepository: noteAttachmentRepoSymbol,
    accountModule: accountModuleFacadeSymbol,
    timelineModule: timelineModuleFacadeSymbol,
    clock: clockSymbol,
  },
);
