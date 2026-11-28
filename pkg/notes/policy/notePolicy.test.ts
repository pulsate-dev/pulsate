import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.ts';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import { PolicyAction } from '../../internal/policy/policy.ts';
import type { Principal } from '../../internal/policy/principal.ts';
import { NoteNotFoundError } from '../model/errors.ts';
import type { NoteVisibility } from '../model/note.ts';
import type { NoteReadRepository } from '../model/repository.ts';
import { generateDummyNote } from '../testData/testData.ts';
import { NoteAction, NotePolicy, type NoteReadScope } from './notePolicy.ts';

const author = generateDummyAccount();
const viewer = generateDummyAccount();
const note = generateDummyNote({ authorID: author.getID() });
const anonymous: Principal<AccountID> = { kind: 'anonymous' };
const owner: Principal<AccountID> = {
  kind: 'account',
  accountId: author.getID(),
};
const other: Principal<AccountID> = {
  kind: 'account',
  accountId: viewer.getID(),
};
const resource = {
  noteId: note.getID(),
  authorId: author.getID(),
  visibility: 'PUBLIC' as NoteVisibility,
  deleted: false,
};
const context = { authorAvailable: true, following: false };

describe('NotePolicy', () => {
  it('rejects unsupported actions without issuing a scope', () => {
    class UnsupportedAction extends PolicyAction<'NotesNote'> {
      constructor() {
        super('NotesNote', 'Note', 'unsupported');
      }
    }
    expect(
      Result.unwrapErr(
        NotePolicy.authorize(
          anonymous,
          new UnsupportedAction(),
          resource,
          context,
        ),
      ),
    ).toBeInstanceOf(NoteNotFoundError);
  });
  it.each(['PUBLIC', 'HOME'] as const)(
    'allows %s for every principal',
    (visibility) => {
      for (const principal of [anonymous, owner, other]) {
        const scope = Result.unwrap(
          NotePolicy.authorize(
            principal,
            NoteAction.read,
            { ...resource, visibility },
            context,
          ),
        );
        expect(scope.noteId).toBe(note.getID());
        expect(scope.principal).toEqual(principal);
      }
    },
  );

  it.each([
    [anonymous, false, false],
    [owner, false, true],
    [other, false, false],
    [other, true, true],
  ] as const)(
    'checks followers-only access for %j with following=%s',
    (principal, following, allowed) => {
      const result = NotePolicy.authorize(
        principal,
        NoteAction.read,
        { ...resource, visibility: 'FOLLOWERS' },
        { ...context, following },
      );
      expect(Result.isOk(result)).toBe(allowed);
      if (!allowed)
        expect(Result.unwrapErr(result)).toBeInstanceOf(NoteNotFoundError);
    },
  );

  it('rejects DIRECT even for its author', () => {
    for (const principal of [anonymous, owner, other]) {
      expect(
        Result.isErr(
          NotePolicy.authorize(
            principal,
            NoteAction.read,
            { ...resource, visibility: 'DIRECT' },
            { ...context, following: true },
          ),
        ),
      ).toBe(true);
    }
  });

  it('rejects deleted notes and unavailable authors before allowing public access', () => {
    expect(
      Result.isErr(
        NotePolicy.authorize(
          anonymous,
          NoteAction.read,
          {
            ...resource,
            deleted: true,
          },
          context,
        ),
      ),
    ).toBe(true);
    expect(
      Result.isErr(
        NotePolicy.authorize(owner, NoteAction.read, resource, {
          ...context,
          authorAvailable: false,
        }),
      ),
    ).toBe(true);
  });

  it('does not expose a scope constructor or accept another policy action', () => {
    expectTypeOf<PolicyAction<'NotesReaction'>>().not.toExtend<NoteAction>();
    expectTypeOf<{
      noteId: typeof resource.noteId;
      principal: Principal<AccountID>;
    }>().not.toExtend<NoteReadScope>();
    expectTypeOf<
      Parameters<NoteReadRepository['findNote']>[0]
    >().toEqualTypeOf<NoteReadScope>();
  });
});
