import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';

import type { AccountID } from '../../accounts/model/account.js';
import { AccountNotFoundError } from '../../accounts/model/errors.js';
import type { MediumID } from '../../drive/model/medium.js';
import {
  type AccountModuleFacade,
  accountModuleFacadeSymbol,
} from '../../intermodule/account.js';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.js';
import { DirectNote, type DirectNoteID } from '../model/directNote.js';
import {
  type DirectNoteAttachmentRepository,
  type DirectNoteRepository,
  directNoteAttachmentRepoSymbol,
  directNoteRepoSymbol,
} from '../model/repository.js';

export class CreateDirectNoteService {
  readonly #deps: {
    directNoteRepository: DirectNoteRepository;
    directNoteAttachmentRepository: DirectNoteAttachmentRepository;
    idGenerator: SnowflakeIDGenerator;
    clock: Clock;
    accountModule: AccountModuleFacade;
  };
  constructor(deps: {
    directNoteRepository: DirectNoteRepository;
    directNoteAttachmentRepository: DirectNoteAttachmentRepository;
    idGenerator: SnowflakeIDGenerator;
    clock: Clock;
    accountModule: AccountModuleFacade;
  }) {
    this.#deps = deps;
  }

  async handle(
    content: string,
    contentsWarningComment: string,
    authorID: AccountID,
    recipientID: AccountID,
    attachmentFileID: MediumID[],
  ): Promise<Result.Result<Error, DirectNote>> {
    const now = this.#deps.clock.now();

    return Cat.doT(Promise.resultMonad<Error>())
      .runWith(() =>
        this.#deps.accountModule
          .fetchAccount(authorID)
          .then(
            Result.mapErr(
              () =>
                new AccountNotFoundError('Author not found', { cause: null }),
            ),
          )
          .then(Result.map(() => [])),
      )
      .runWith(() =>
        this.#deps.accountModule
          .fetchAccount(recipientID)
          .then(
            Result.mapErr(
              () =>
                new AccountNotFoundError('Recipient not found', {
                  cause: null,
                }),
            ),
          )
          .then(Result.map(() => [])),
      )
      .addM(
        'id',
        Promise.resolve(this.#deps.idGenerator.generate<DirectNote>()),
      )
      .addMWith('note', ({ id }) =>
        Promise.resolve(
          DirectNote.new({
            id: id as DirectNoteID,
            authorID,
            recipientID,
            content,
            contentsWarningComment,
            attachmentFileID,
            createdAt: new Date(Number(now)),
          }),
        ),
      )
      .runWith(({ note }) =>
        this.#deps.directNoteRepository.create(note).then(Result.map(() => [])),
      )
      .when(
        () => attachmentFileID.length !== 0,
        ({ note }) =>
          this.#deps.directNoteAttachmentRepository
            .create(note.getID(), note.getAttachmentFileID())
            .then(Result.map(() => [])),
      )
      .finish(({ note }) => note);
  }
}

export const createDirectNoteServiceSymbol =
  Ether.newEtherSymbol<CreateDirectNoteService>();
export const createDirectNoteService = Ether.newEther(
  createDirectNoteServiceSymbol,
  (deps) => new CreateDirectNoteService(deps),
  {
    directNoteRepository: directNoteRepoSymbol,
    directNoteAttachmentRepository: directNoteAttachmentRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    clock: clockSymbol,
    accountModule: accountModuleFacadeSymbol,
  },
);
