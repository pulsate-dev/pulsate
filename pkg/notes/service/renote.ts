import { Cat, Ether, Option, Promise, Result } from '@mikuroxina/mini-fn';

import type { Account, AccountID } from '../../accounts/model/account.ts';
import type { MediumID } from '../../drive/model/medium.ts';
import {
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.ts';
import {
  type TimelineModuleFacade,
  timelineModuleFacadeSymbol,
} from '../../intermodule/timeline.ts';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import { checkVisibilityForSilencedActor } from '../model/createDomainService.ts';
import {
  NoteInsufficientPermissionError,
  NoteNotFoundError,
} from '../model/errors.ts';
import { Note, type NoteID, type NoteVisibility } from '../model/note.ts';
import { getRenoteChainRootID } from '../model/renoteDomainService.ts';
import {
  type NoteAttachmentRepository,
  type NoteRepository,
  noteAttachmentRepoSymbol,
  noteRepoSymbol,
} from '../model/repository.ts';
import { fetchActor } from './fetchActor.ts';

export class RenoteService {
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
    const now = this.#deps.clock.now();

    const res = await Cat.doT(resultPromiseMonad<Error>())
      .addM('actor', fetchActor(this.#deps.accountModule, authorID))
      .runWith(({ actor }) =>
        Promise.resolve(
          this.isAllowed(actor, visibility)
            ? Result.ok([])
            : Result.err(
                new NoteInsufficientPermissionError('Not allowed', {
                  cause: null,
                }),
              ),
        ),
      )
      .addMWith('originalNote', () => this.resolveOriginalNote(originalID))
      .runWith(({ originalNote }) =>
        Promise.resolve(originalNote.canBeRenotedBy(authorID)).then(
          Result.map(() => []),
        ),
      )
      .addM('id', Promise.resolve(this.#deps.idGenerator.generate<Note>()))
      .addMWith('renote', ({ id, originalNote }) =>
        Promise.resolve(
          Note.new({
            id,
            content: content,
            contentsWarningComment: contentsWarningComment,
            originalNoteID: Option.some(originalNote.getID()),
            authorID: authorID,
            attachmentFileID: attachmentFileID,
            visibility: visibility,
            sendTo: Option.none(),
            createdAt: new Date(Number(now)),
          }),
        ),
      )
      .when(
        () => attachmentFileID.length !== 0,
        ({ renote }) =>
          this.#deps.noteAttachmentRepository
            .create(renote.getID(), renote.getAttachmentFileID())
            .then(Result.map(() => [])),
      )
      .runWith(({ renote }) =>
        this.#deps.noteRepository.create(renote).then(Result.map(() => [])),
      )
      .finish(({ renote }) => renote);

    if (Result.isErr(res)) {
      return res;
    }
    const renote = Result.unwrap(res);

    // ToDo: Even if the note cannot be pushed to the timeline, the note is created successfully, so there is no error here.
    // ToDo: use job queue to push note to timeline
    await this.#deps.timelineModule.pushNoteToTimeline(renote);

    return Result.ok(renote);
  }

  private async resolveOriginalNote(
    originalID: NoteID,
  ): Promise<Result.Result<Error, Note>> {
    const notFound = () =>
      new NoteNotFoundError('Original note not found', { cause: null });

    return Cat.doT(resultPromiseMonad<Error>())
      .addM(
        'note',
        this.#deps.noteRepository
          .findByID(originalID)
          .then(Option.okOrElse(notFound)),
      )
      .addMWith('result', async ({ note }) => {
        // NOTE: For pure renotes the chain is followed one hop to the root; for
        // quotes and ordinary notes the target note itself is the original. The
        // decision is owned by the renote domain service.
        const chainRootID = getRenoteChainRootID(note);
        if (Option.isNone(chainRootID)) {
          return Result.ok(note);
        }
        return this.#deps.noteRepository
          .findByID(Option.unwrap(chainRootID))
          .then(Option.okOrElse(notFound));
      })
      .finish(({ result }) => result);
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
