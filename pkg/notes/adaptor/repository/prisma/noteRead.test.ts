import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import type { AccountID } from '../../../../accounts/model/account.ts';
import { generateDummyAccount } from '../../../../accounts/testData/testData.ts';
import type {
  Prisma,
  PrismaClient,
} from '../../../../adaptors/prisma/client.ts';
import type { Principal } from '../../../../internal/policy/principal.ts';
import { NoteInternalError, NoteNotFoundError } from '../../../model/errors.ts';
import { NoteAction, NotePolicy } from '../../../policy/notePolicy.ts';
import { generateDummyNote } from '../../../testData/testData.ts';
import { PrismaNoteReadRepository } from './noteRead.ts';

function setup(principal: Principal<AccountID> = { kind: 'anonymous' }) {
  const author = generateDummyAccount();
  const note = generateDummyNote({ authorID: author.getID() });
  const findFirst = vi.fn();
  const findUnique = vi.fn();
  const findFollow = vi.fn();
  const transaction = vi.fn(
    async (read: (client: Prisma.TransactionClient) => Promise<unknown>) =>
      read({ note: { findFirst } } as unknown as Prisma.TransactionClient),
  );
  const client = {
    note: { findFirst, findUnique },
    following: { findFirst: findFollow },
    $transaction: transaction,
  } as unknown as PrismaClient;
  const repo = new PrismaNoteReadRepository(client);
  const scope = Result.unwrap(
    NotePolicy.authorize(
      principal,
      NoteAction.read,
      {
        noteId: note.getID(),
        authorId: author.getID(),
        visibility: 'PUBLIC',
        deleted: false,
      },
      { authorAvailable: true, following: false },
    ),
  );
  return {
    author,
    note,
    repo,
    scope,
    findFirst,
    findUnique,
    findFollow,
    transaction,
  };
}

describe('PrismaNoteReadRepository query contract', () => {
  it('selects authorization attributes without note contents or protected relations', async () => {
    const data = setup();
    data.findUnique.mockResolvedValue({
      id: data.note.getID(),
      authorId: data.author.getID(),
      visibility: 0,
      deletedAt: null,
      author: { frozen: 0, deletedAt: null },
    });
    expect(
      Result.isOk(
        await data.repo.findAuthorization(data.note.getID(), {
          kind: 'anonymous',
        }),
      ),
    ).toBe(true);
    expect(data.findUnique).toHaveBeenCalledWith({
      where: { id: data.note.getID() },
      select: {
        id: true,
        authorId: true,
        visibility: true,
        deletedAt: true,
        author: { select: { frozen: true, deletedAt: true } },
      },
    });
    expect(data.findFollow).not.toHaveBeenCalled();
    expect(data.findFirst).not.toHaveBeenCalled();
  });

  it('checks an undeleted follow from the viewer to the author without a state condition', async () => {
    const viewer = generateDummyAccount();
    const data = setup({ kind: 'account', accountId: viewer.getID() });
    data.findUnique.mockResolvedValue({
      id: data.note.getID(),
      authorId: data.author.getID(),
      visibility: 2,
      deletedAt: null,
      author: { frozen: 0, deletedAt: null },
    });
    data.findFollow.mockResolvedValue({ fromId: viewer.getID() });
    await data.repo.findAuthorization(data.note.getID(), data.scope.principal);
    expect(data.findFollow).toHaveBeenCalledWith({
      where: {
        fromId: viewer.getID(),
        toId: data.author.getID(),
        deletedAt: null,
      },
      select: { fromId: true },
    });
  });

  it('applies parent visibility, author state and related deletion conditions to attachment reads', async () => {
    const data = setup();
    data.findFirst.mockResolvedValue({ noteAttachment: [] });
    expect(Result.unwrap(await data.repo.findAttachments(data.scope))).toEqual(
      [],
    );
    expect(data.findFirst).toHaveBeenCalledWith({
      where: {
        id: data.note.getID(),
        deletedAt: null,
        author: { deletedAt: null, frozen: 0 },
        OR: [{ visibility: { in: [0, 1] } }],
      },
      select: {
        noteAttachment: {
          where: { deletedAt: null, medium: { deletedAt: null } },
          select: { medium: true },
        },
      },
    });
    expect(data.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'RepeatableRead',
    });
  });

  it('uses the incoming-follow relation of the author for followers-only reads', async () => {
    const viewer = generateDummyAccount();
    const data = setup({ kind: 'account', accountId: viewer.getID() });
    data.findFirst.mockResolvedValue({ reaction: [] });
    expect(Result.unwrap(await data.repo.findReactions(data.scope))).toEqual(
      [],
    );
    expect(data.findFirst).toHaveBeenCalledWith({
      where: {
        id: data.note.getID(),
        deletedAt: null,
        author: { deletedAt: null, frozen: 0 },
        OR: [
          { visibility: { in: [0, 1] } },
          {
            visibility: 2,
            OR: [
              { authorId: viewer.getID() },
              {
                author: {
                  following: {
                    some: { fromId: viewer.getID(), deletedAt: null },
                  },
                },
              },
            ],
          },
        ],
      },
      select: { reaction: { where: { deletedAt: null } } },
    });
  });

  it('selects only public author attributes when reading a note', async () => {
    const data = setup();
    data.findFirst.mockResolvedValue({
      id: data.note.getID(),
      authorId: data.author.getID(),
      visibility: 0,
      text: 'Hello',
      createdAt: new Date(),
      renoteId: null,
      noteAttachment: [{ mediumId: 'medium' }],
      author: {
        id: data.author.getID(),
        name: data.author.getName(),
        nickname: 'Name',
        bio: 'Bio',
      },
    });
    const result = Result.unwrap(await data.repo.findNote(data.scope));
    expect(result.note.getContent()).toBe('Hello');
    expect(result.note.getAttachmentFileID()).toEqual(['medium']);
    expect(result.author).toEqual({
      id: data.author.getID(),
      name: data.author.getName(),
      display_name: 'Name',
      bio: 'Bio',
    });
    expect(data.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          author: {
            select: { id: true, name: true, nickname: true, bio: true },
          },
          noteAttachment: {
            where: { deletedAt: null, medium: { deletedAt: null } },
            select: { mediumId: true },
          },
        },
      }),
    );
  });

  it('queries only active renotes by the authenticated viewer and skips anonymous queries', async () => {
    const viewer = generateDummyAccount();
    const data = setup({ kind: 'account', accountId: viewer.getID() });
    data.findFirst.mockResolvedValue({ renotes: [{ id: 'renote' }] });
    expect(Result.unwrap(await data.repo.findRenoteStatus(data.scope))).toBe(
      true,
    );
    expect(data.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          renotes: {
            where: { authorId: viewer.getID(), deletedAt: null },
            select: { id: true },
            take: 1,
          },
        },
      }),
    );
    const anonymous = setup();
    expect(
      Result.unwrap(await anonymous.repo.findRenoteStatus(anonymous.scope)),
    ).toBe(false);
    expect(anonymous.findFirst).not.toHaveBeenCalled();
    expect(anonymous.transaction).not.toHaveBeenCalled();
  });

  it.each([
    'findNote',
    'findAttachments',
    'findReactions',
    'findRenoteStatus',
  ] as const)(
    'returns not found, not an empty successful response, when %s loses visibility',
    async (method) => {
      const viewer = generateDummyAccount();
      const data = setup({ kind: 'account', accountId: viewer.getID() });
      data.findFirst.mockResolvedValue(null);
      expect(
        Result.unwrapErr<Error, unknown>(await data.repo[method](data.scope)),
      ).toBeInstanceOf(NoteNotFoundError);
    },
  );

  it.each([
    'findNote',
    'findAttachments',
    'findReactions',
    'findRenoteStatus',
  ] as const)(
    'propagates %s database failures instead of hiding them as absence',
    async (method) => {
      const viewer = generateDummyAccount();
      const data = setup({ kind: 'account', accountId: viewer.getID() });
      const error = new Error('Database unavailable');
      data.findFirst.mockRejectedValue(error);
      const result = Result.unwrapErr<Error, unknown>(
        await data.repo[method](data.scope),
      );
      expect(result).toBeInstanceOf(NoteInternalError);
      expect(result.cause).toBe(error);
    },
  );

  it('propagates authorization lookup failures', async () => {
    const data = setup();
    data.findUnique.mockRejectedValue(new Error('Database unavailable'));
    expect(
      Result.unwrapErr(
        await data.repo.findAuthorization(
          data.note.getID(),
          data.scope.principal,
        ),
      ),
    ).toBeInstanceOf(NoteInternalError);
  });

  it('returns a failure for invalid persisted visibility without throwing', async () => {
    const data = setup();
    data.findUnique.mockResolvedValue({
      id: data.note.getID(),
      authorId: data.author.getID(),
      visibility: 99,
      deletedAt: null,
      author: { frozen: 0, deletedAt: null },
    });
    expect(
      Result.unwrapErr(
        await data.repo.findAuthorization(
          data.note.getID(),
          data.scope.principal,
        ),
      ),
    ).toBeInstanceOf(NoteInternalError);
  });
});
