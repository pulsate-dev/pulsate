import { Cat, Option, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import type { Principal } from '../../internal/policy/principal.ts';
import { NoteNotFoundError } from '../model/errors.ts';
import type { NoteID } from '../model/note.ts';
import type { NoteReadRepository } from '../model/repository.ts';
import { NoteAction, NotePolicy } from '../policy/notePolicy.ts';

export class ReadNoteService {
  readonly #repository: NoteReadRepository;

  constructor(repository: NoteReadRepository) {
    this.#repository = repository;
  }

  async handle(noteId: NoteID, principal: Principal<AccountID>) {
    return Cat.doT(Promise.resultMonad<Error>())
      .addM(
        'authorization',
        this.#repository
          .findAuthorization(noteId, principal)
          .then(
            Result.andThen(
              Option.okOrElse(
                () => new NoteNotFoundError('Note not found', { cause: null }),
              ),
            ),
          ),
      )
      .addMWith('scope', ({ authorization }) =>
        Promise.resolve(
          NotePolicy.authorize(
            principal,
            NoteAction.read,
            authorization.resource,
            authorization.context,
          ),
        ),
      )
      .addMWith('data', ({ scope }) => this.#repository.findNote(scope))
      .addMWith('attachments', ({ scope }) =>
        this.#repository.findAttachments(scope),
      )
      .addMWith('reactions', ({ scope }) =>
        this.#repository.findReactions(scope),
      )
      .addMWith('renoted', ({ scope }) =>
        this.#repository.findRenoteStatus(scope),
      )
      .finish(({ data, attachments, reactions, renoted }) => ({
        ...data,
        attachments,
        reactions,
        renoted,
      }));
  }
}
