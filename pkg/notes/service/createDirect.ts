import { Ether, Result } from '@mikuroxina/mini-fn';

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
import { NoteInternalError } from '../model/errors.js';
import {
  type DirectNoteAttachmentRepository,
  type DirectNoteRepository,
  directNoteAttachmentRepoSymbol,
  directNoteRepoSymbol,
} from '../model/repository.js';

export class CreateDirectNoteService {
  constructor(
    private readonly deps: {
      directNoteRepository: DirectNoteRepository;
      directNoteAttachmentRepository: DirectNoteAttachmentRepository;
      idGenerator: SnowflakeIDGenerator;
      clock: Clock;
      accountModule: AccountModuleFacade;
    },
  ) {}

  async handle(
    content: string,
    contentsWarningComment: string,
    authorID: AccountID,
    recipientID: AccountID,
    attachmentFileID: MediumID[],
  ): Promise<Result.Result<Error, DirectNote>> {
    const authorRes = await this.deps.accountModule.fetchAccount(authorID);
    if (Result.isErr(authorRes)) {
      return Result.err(
        new AccountNotFoundError('Author not found', { cause: null }),
      );
    }

    const recipientRes =
      await this.deps.accountModule.fetchAccount(recipientID);
    if (Result.isErr(recipientRes)) {
      return Result.err(
        new AccountNotFoundError('Recipient not found', { cause: null }),
      );
    }

    const idRes = this.deps.idGenerator.generate<DirectNote>();
    if (Result.isErr(idRes)) {
      return Result.err(
        new NoteInternalError('id generation failed', {
          cause: Result.unwrapErr(idRes),
        }),
      );
    }

    const now = this.deps.clock.now();
    const noteRes = DirectNote.new({
      id: idRes[1] as DirectNoteID,
      authorID,
      recipientID,
      content,
      contentsWarningComment,
      attachmentFileID,
      createdAt: new Date(Number(now)),
    });
    if (Result.isErr(noteRes)) {
      return noteRes;
    }
    const note = Result.unwrap(noteRes);

    const createRes = await this.deps.directNoteRepository.create(note);
    if (Result.isErr(createRes)) {
      return createRes;
    }

    if (attachmentFileID.length !== 0) {
      const attachmentRes =
        await this.deps.directNoteAttachmentRepository.create(
          note.getID(),
          note.getAttachmentFileID(),
        );
      if (Result.isErr(attachmentRes)) {
        return attachmentRes;
      }
    }

    return Result.ok(note);
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
