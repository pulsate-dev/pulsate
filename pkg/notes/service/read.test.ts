import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import { NoteNotFoundError } from '../model/errors.ts';
import type { NoteReadRepository } from '../model/repository.ts';
import { generateDummyNote } from '../testData/testData.ts';
import { ReadNoteService } from './read.ts';

function setup() {
  const author = generateDummyAccount();
  const viewer = generateDummyAccount();
  const note = generateDummyNote({ authorID: author.getID() });
  const authorization = {
    resource: {
      noteId: note.getID(),
      authorId: author.getID(),
      visibility: note.getVisibility(),
      deleted: false,
    },
    context: { authorAvailable: true, following: false },
  };
  const repository = {
    findAuthorization: vi.fn<NoteReadRepository['findAuthorization']>(
      async () => Result.ok(Option.some(authorization)),
    ),
    findNote: vi.fn<NoteReadRepository['findNote']>(async () =>
      Result.ok({
        note,
        author: {
          id: author.getID(),
          name: author.getName(),
          display_name: author.getNickname(),
          bio: author.getBio(),
        },
      }),
    ),
    findAttachments: vi.fn<NoteReadRepository['findAttachments']>(async () =>
      Result.ok([]),
    ),
    findReactions: vi.fn<NoteReadRepository['findReactions']>(async () =>
      Result.ok([]),
    ),
    findRenoteStatus: vi.fn<NoteReadRepository['findRenoteStatus']>(async () =>
      Result.ok(false),
    ),
  } satisfies NoteReadRepository;
  return {
    author,
    viewer,
    note,
    authorization,
    repository,
    service: new ReadNoteService(repository),
  };
}

describe('ReadNoteService', () => {
  it.each(['absent', 'private', 'deleted', 'frozen', 'direct'] as const)(
    'stops before protected reads for %s notes',
    async (reason) => {
      const data = setup();
      if (reason === 'absent')
        data.repository.findAuthorization.mockResolvedValueOnce(
          Result.ok(Option.none()),
        );
      if (reason === 'private')
        data.authorization.resource.visibility = 'FOLLOWERS';
      if (reason === 'deleted') data.authorization.resource.deleted = true;
      if (reason === 'frozen')
        data.authorization.context.authorAvailable = false;
      if (reason === 'direct')
        data.authorization.resource.visibility = 'DIRECT';
      expect(
        Result.unwrapErr(
          await data.service.handle(data.note.getID(), { kind: 'anonymous' }),
        ),
      ).toBeInstanceOf(NoteNotFoundError);
      expect(data.repository.findNote).not.toHaveBeenCalled();
      expect(data.repository.findAttachments).not.toHaveBeenCalled();
      expect(data.repository.findReactions).not.toHaveBeenCalled();
      expect(data.repository.findRenoteStatus).not.toHaveBeenCalled();
    },
  );

  it('passes the same policy-issued scope to all protected reads', async () => {
    const data = setup();
    const principal = {
      kind: 'account',
      accountId: data.viewer.getID(),
    } as const;
    expect(
      Result.isOk(await data.service.handle(data.note.getID(), principal)),
    ).toBe(true);
    expect(data.repository.findAuthorization).toHaveBeenCalledWith(
      data.note.getID(),
      principal,
    );
    const scope = data.repository.findNote.mock.calls[0]?.[0];
    expect(scope).toBeDefined();
    if (!scope) throw new Error('Expected a note read scope');
    expect(scope.noteId).toBe(data.note.getID());
    expect(scope.principal).toEqual(principal);
    for (const method of [
      data.repository.findAttachments,
      data.repository.findReactions,
      data.repository.findRenoteStatus,
    ]) {
      expect(method).toHaveBeenCalledWith(scope);
    }
  });

  it.each([
    'findAuthorization',
    'findNote',
    'findAttachments',
    'findReactions',
    'findRenoteStatus',
  ] as const)(
    'propagates %s failures without returning a partial result',
    async (method) => {
      const data = setup();
      const error = new Error('Database unavailable');
      data.repository[method].mockResolvedValueOnce(Result.err(error));
      expect(
        Result.unwrapErr(
          await data.service.handle(data.note.getID(), { kind: 'anonymous' }),
        ),
      ).toBe(error);
      if (method === 'findAttachments') {
        expect(data.repository.findReactions).not.toHaveBeenCalled();
        expect(data.repository.findRenoteStatus).not.toHaveBeenCalled();
      }
    },
  );
});
