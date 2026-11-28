import { Cat, Option, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../../accounts/model/account.ts';
import { AccountNotFoundError } from '../../../../accounts/model/errors.ts';
import type { AccountModuleFacade } from '../../../../intermodule/account.ts';
import type { Principal } from '../../../../internal/policy/principal.ts';
import { NoteInternalError, NoteNotFoundError } from '../../../model/errors.ts';
import type { Note, NoteID } from '../../../model/note.ts';
import type {
  NoteAttachmentRepository,
  NoteReadProfile,
  NoteReadRepository,
  NoteRepository,
  ReactionRepository,
} from '../../../model/repository.ts';
import {
  NoteAction,
  NotePolicy,
  type NoteReadContext,
  type NoteReadScope,
} from '../../../policy/notePolicy.ts';

interface LoadedNote {
  note: Note;
  author: NoteReadProfile | undefined;
  context: NoteReadContext;
}

export class InMemoryNoteReadRepository implements NoteReadRepository {
  readonly #notes: NoteRepository;
  readonly #attachments: NoteAttachmentRepository;
  readonly #reactions: ReactionRepository;
  readonly #accounts: Pick<
    AccountModuleFacade,
    'fetchAccount' | 'hasActiveFollow'
  >;

  constructor(
    notes: NoteRepository,
    attachments: NoteAttachmentRepository,
    reactions: ReactionRepository,
    accounts: Pick<AccountModuleFacade, 'fetchAccount' | 'hasActiveFollow'>,
  ) {
    this.#notes = notes;
    this.#attachments = attachments;
    this.#reactions = reactions;
    this.#accounts = accounts;
  }

  async #load(
    noteId: NoteID,
    principal: Principal<AccountID>,
  ): Promise<Result.Result<Error, Option.Option<LoadedNote>>> {
    try {
      const note = Option.unwrapOr<Note | undefined>(undefined)(
        await this.#notes.findByID(noteId),
      );
      if (!note) return Result.ok(Option.none());
      const accountResult = await this.#accounts.fetchAccount(
        note.getAuthorID(),
      );
      if (Result.isErr(accountResult)) {
        if (
          !(Result.unwrapErr(accountResult) instanceof AccountNotFoundError)
        ) {
          return accountResult;
        }
        return Result.ok(
          Option.some({
            note,
            author: undefined,
            context: { authorAvailable: false, following: false },
          }),
        );
      }
      const account = Result.unwrap(accountResult);
      const authorAvailable = !account.isFrozen() && !account.getDeletedAt();
      const following =
        authorAvailable &&
        Option.isNone(note.getDeletedAt()) &&
        note.getVisibility() === 'FOLLOWERS' &&
        principal.kind === 'account' &&
        principal.accountId !== note.getAuthorID()
          ? await this.#accounts.hasActiveFollow(
              principal.accountId,
              note.getAuthorID(),
            )
          : Result.ok(false);
      if (Result.isErr(following)) return following;
      return Result.ok(
        Option.some({
          note,
          author: {
            id: account.getID(),
            name: account.getName(),
            display_name: account.getNickname(),
            bio: account.getBio(),
          },
          context: { authorAvailable, following: Result.unwrap(following) },
        }),
      );
    } catch (cause) {
      return Result.err(
        new NoteInternalError('Failed to read note', { cause }),
      );
    }
  }

  async findAuthorization(noteId: NoteID, principal: Principal<AccountID>) {
    return this.#load(noteId, principal).then(
      Result.map(
        Option.map((data) => ({
          resource: {
            noteId: data.note.getID(),
            authorId: data.note.getAuthorID(),
            visibility: data.note.getVisibility(),
            deleted: Option.isSome(data.note.getDeletedAt()),
          },
          context: data.context,
        })),
      ),
    );
  }

  async findNote(scope: NoteReadScope) {
    return Cat.doT(Promise.resultMonad<Error>())
      .addM(
        'data',
        this.#load(scope.noteId, scope.principal).then(
          Result.andThen(
            Option.okOrElse(
              () => new NoteNotFoundError('Note not found', { cause: null }),
            ),
          ),
        ),
      )
      .runWith(({ data }) =>
        Promise.resolve(
          NotePolicy.authorize(
            scope.principal,
            NoteAction.read,
            {
              noteId: data.note.getID(),
              authorId: data.note.getAuthorID(),
              visibility: data.note.getVisibility(),
              deleted: Option.isSome(data.note.getDeletedAt()),
            },
            data.context,
          ),
        ).then(Result.map(() => [])),
      )
      .finishM(({ data }) =>
        Promise.resolve(
          data.author
            ? Result.ok({ note: data.note, author: data.author })
            : Result.err(
                new NoteNotFoundError('Note not found', { cause: null }),
              ),
        ),
      );
  }

  async findAttachments(scope: NoteReadScope) {
    return Cat.doT(Promise.resultMonad<Error>())
      .addM('parent', this.findNote(scope))
      .finishM(() => this.#attachments.findByNoteID(scope.noteId));
  }

  async findReactions(scope: NoteReadScope) {
    return Cat.doT(Promise.resultMonad<Error>())
      .addM('parent', this.findNote(scope))
      .finishM(() => this.#reactions.findByNoteID(scope.noteId));
  }

  async findRenoteStatus(scope: NoteReadScope) {
    if (scope.principal.kind === 'anonymous') return Result.ok(false);
    const accountId = scope.principal.accountId;
    return Cat.doT(Promise.resultMonad<Error>())
      .addM('parent', this.findNote(scope))
      .finishM(() =>
        this.#notes
          .fetchRenoteStatus(accountId, [scope.noteId])
          .then((statuses) => Result.ok(statuses[0]?.getIsRenoted() ?? false)),
      );
  }
}
