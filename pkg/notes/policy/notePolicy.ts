import { Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import { type Policy, PolicyAction } from '../../internal/policy/policy.ts';
import type { Principal } from '../../internal/policy/principal.ts';
import { NoteNotFoundError } from '../model/errors.ts';
import type { NoteID, NoteVisibility } from '../model/note.ts';

export class NoteAction extends PolicyAction<'NotesNote'> {
  private constructor(action: string) {
    super('NotesNote', 'Note', action);
  }

  static readonly read = new NoteAction('read');
}

export interface NoteReadResource {
  readonly noteId: NoteID;
  readonly authorId: AccountID;
  readonly visibility: NoteVisibility;
  readonly deleted: boolean;
}

export type NoteReadContext = {
  readonly authorAvailable: boolean;
  readonly following: boolean;
};

class Scope {
  readonly #noteId: NoteID;
  readonly principal: Principal<AccountID>;

  private constructor(noteId: NoteID, principal: Principal<AccountID>) {
    this.#noteId = noteId;
    this.principal = Object.freeze({ ...principal });
    Object.freeze(this);
  }

  get noteId(): NoteID {
    return this.#noteId;
  }

  static issue(noteId: NoteID, principal: Principal<AccountID>): Scope {
    return new Scope(noteId, principal);
  }
}

export type NoteReadScope = Scope;

export const NotePolicy: Policy<
  Principal<AccountID>,
  NoteAction,
  NoteReadResource,
  NoteReadScope,
  NoteNotFoundError,
  NoteReadContext
> = {
  authorize(principal, action, resource, context) {
    if (
      !action.equals(NoteAction.read) ||
      resource.deleted ||
      !context.authorAvailable
    ) {
      return Result.err(
        new NoteNotFoundError('Note not found', { cause: null }),
      );
    }

    const allowed =
      resource.visibility === 'PUBLIC' ||
      resource.visibility === 'HOME' ||
      (resource.visibility === 'FOLLOWERS' &&
        principal.kind === 'account' &&
        (principal.accountId === resource.authorId || context.following));
    return allowed
      ? Result.ok(Scope.issue(resource.noteId, principal))
      : Result.err(new NoteNotFoundError('Note not found', { cause: null }));
  },
};
