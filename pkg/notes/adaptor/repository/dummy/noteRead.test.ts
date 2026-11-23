import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import { InMemoryAccountFollowRepository } from '../../../../accounts/adaptor/repository/dummy/follow.ts';
import type { AccountID } from '../../../../accounts/model/account.ts';
import { AccountNotFoundError } from '../../../../accounts/model/errors.ts';
import {
  generateDummyAccount,
  generateDummyFollow,
} from '../../../../accounts/testData/testData.ts';
import {
  dummyMedium,
  generateDummyMedium,
} from '../../../../drive/testData/testData.ts';
import type { Principal } from '../../../../internal/policy/principal.ts';
import { NoteNotFoundError } from '../../../model/errors.ts';
import type { NoteVisibility } from '../../../model/note.ts';
import { NoteAction, NotePolicy } from '../../../policy/notePolicy.ts';
import { ReadNoteService } from '../../../service/read.ts';
import {
  generateDummyNote,
  generateDummyReaction,
} from '../../../testData/testData.ts';
import {
  InMemoryNoteAttachmentRepository,
  InMemoryNoteRepository,
  InMemoryReactionRepository,
  inMemoryNoteAttachmentRepo,
  inMemoryNoteRepo,
  inMemoryReactionRepo,
} from '../dummy.ts';
import { InMemoryNoteReadRepository } from './noteRead.ts';

function setup(visibility: NoteVisibility = 'PUBLIC') {
  const author = generateDummyAccount();
  const viewer = generateDummyAccount();
  const note = generateDummyNote({ authorID: author.getID(), visibility });
  const follow = generateDummyFollow({
    fromID: viewer.getID(),
    targetID: author.getID(),
  });
  const follows = new InMemoryAccountFollowRepository();
  const notes = new InMemoryNoteRepository([note]);
  const attachments = new InMemoryNoteAttachmentRepository([], []);
  const reactions = new InMemoryReactionRepository();
  const accounts = {
    fetchAccount: vi.fn(async (id: AccountID) =>
      id === author.getID()
        ? Result.ok(author)
        : Result.err(
            new AccountNotFoundError('Account not found', { cause: null }),
          ),
    ),
    hasActiveFollow: vi.fn((from: AccountID, to: AccountID) =>
      follows.hasActiveFollow(from, to),
    ),
  };
  const repo = new InMemoryNoteReadRepository(
    notes,
    attachments,
    reactions,
    accounts,
  );
  const principal: Principal<AccountID> = {
    kind: 'account',
    accountId: viewer.getID(),
  };
  return {
    author,
    viewer,
    note,
    follow,
    follows,
    notes,
    attachments,
    reactions,
    accounts,
    repo,
    principal,
  };
}

async function scopeFor(
  data: ReturnType<typeof setup>,
  principal: Principal<AccountID> = data.principal,
) {
  const authorization = Option.unwrapOr({
    resource: {
      noteId: data.note.getID(),
      authorId: data.author.getID(),
      visibility: data.note.getVisibility(),
      deleted: false,
    },
    context: { authorAvailable: false, following: false },
  })(
    Result.unwrap(
      await data.repo.findAuthorization(data.note.getID(), principal),
    ),
  );
  return Result.unwrap(
    NotePolicy.authorize(
      principal,
      NoteAction.read,
      authorization.resource,
      authorization.context,
    ),
  );
}

describe('InMemoryNoteReadRepository', () => {
  it.each(['PUBLIC', 'HOME'] as const)(
    'allows anonymous %s reads without querying followers',
    async (visibility) => {
      const data = setup(visibility);
      const result = Result.unwrap(
        await new ReadNoteService(data.repo).handle(data.note.getID(), {
          kind: 'anonymous',
        }),
      );
      expect(result.note).toBe(data.note);
      expect(result.author).toEqual({
        id: data.author.getID(),
        name: data.author.getName(),
        display_name: data.author.getNickname(),
        bio: data.author.getBio(),
      });
      expect(result.attachments).toEqual([]);
      expect(result.reactions).toEqual([]);
      expect(result.renoted).toBe(false);
      expect(data.accounts.hasActiveFollow).not.toHaveBeenCalled();
    },
  );

  it('allows the owner of a followers-only note without a follow query', async () => {
    const data = setup('FOLLOWERS');
    expect(
      Result.isOk(
        await new ReadNoteService(data.repo).handle(data.note.getID(), {
          kind: 'account',
          accountId: data.author.getID(),
        }),
      ),
    ).toBe(true);
    expect(data.accounts.hasActiveFollow).not.toHaveBeenCalled();
  });

  it('rejects a residual DIRECT note even for its owner or an active follower', async () => {
    const data = setup('DIRECT');
    await data.follows.follow(data.follow);
    for (const principal of [
      data.principal,
      { kind: 'account', accountId: data.author.getID() } as const,
    ]) {
      const result = await new ReadNoteService(data.repo).handle(
        data.note.getID(),
        principal,
      );
      expect(Result.unwrapErr(result)).toBeInstanceOf(NoteNotFoundError);
    }
  });

  it('rejects logically deleted notes without querying follows', async () => {
    const data = setup('FOLLOWERS');
    await data.notes.create(
      generateDummyNote({
        id: data.note.getID(),
        authorID: data.author.getID(),
        visibility: 'FOLLOWERS',
        deletedAt: Option.some(new Date()),
      }),
    );
    const result = await new ReadNoteService(data.repo).handle(
      data.note.getID(),
      data.principal,
    );
    expect(Result.unwrapErr(result)).toBeInstanceOf(NoteNotFoundError);
    expect(data.accounts.hasActiveFollow).not.toHaveBeenCalled();
  });

  it('propagates follow lookup failures without allowing access', async () => {
    const data = setup('FOLLOWERS');
    const error = new Error('Follow lookup failed');
    data.accounts.hasActiveFollow.mockResolvedValueOnce(Result.err(error));
    const result = await new ReadNoteService(data.repo).handle(
      data.note.getID(),
      data.principal,
    );
    expect(Result.unwrapErr(result)).toBe(error);
  });

  it('requires an active forward follow, not a reverse or deleted follow', async () => {
    const data = setup('FOLLOWERS');
    const service = new ReadNoteService(data.repo);
    await data.follows.follow(
      generateDummyFollow({
        fromID: data.author.getID(),
        targetID: data.viewer.getID(),
      }),
    );
    expect(
      Result.unwrapErr(await service.handle(data.note.getID(), data.principal)),
    ).toBeInstanceOf(NoteNotFoundError);
    await data.follows.follow(data.follow);
    expect(
      Result.isOk(await service.handle(data.note.getID(), data.principal)),
    ).toBe(true);
    Result.unwrap(data.follow.delete(new Date()));
    expect(
      Result.unwrapErr(await service.handle(data.note.getID(), data.principal)),
    ).toBeInstanceOf(NoteNotFoundError);
  });

  it.each(['note', 'author', 'follow'] as const)(
    'rechecks %s changes for every scoped read',
    async (change) => {
      const data = setup('FOLLOWERS');
      await data.follows.follow(data.follow);
      const scope = await scopeFor(data);
      if (change === 'note') await data.notes.deleteByID(data.note.getID());
      if (change === 'author')
        Result.unwrap(data.author.setFreeze(data.author.getID()));
      if (change === 'follow') Result.unwrap(data.follow.delete(new Date()));
      for (const read of [
        () => data.repo.findNote(scope),
        () => data.repo.findAttachments(scope),
        () => data.repo.findReactions(scope),
        () => data.repo.findRenoteStatus(scope),
      ]) {
        expect(Result.unwrapErr<Error, unknown>(await read())).toBeInstanceOf(
          NoteNotFoundError,
        );
      }
    },
  );

  it('rejects a deleted author and distinguishes absent accounts from account failures', async () => {
    const data = setup();
    const deleted = generateDummyAccount({
      id: data.author.getID(),
      deletedAt: new Date(),
    });
    data.accounts.fetchAccount.mockResolvedValueOnce(Result.ok(deleted));
    expect(
      Result.unwrapErr(
        await new ReadNoteService(data.repo).handle(
          data.note.getID(),
          data.principal,
        ),
      ),
    ).toBeInstanceOf(NoteNotFoundError);
    data.accounts.fetchAccount.mockResolvedValueOnce(
      Result.err(new AccountNotFoundError('Missing', { cause: null })),
    );
    expect(
      Result.unwrapErr(
        await new ReadNoteService(data.repo).handle(
          data.note.getID(),
          data.principal,
        ),
      ),
    ).toBeInstanceOf(NoteNotFoundError);
    const error = new Error('Unavailable');
    data.accounts.fetchAccount.mockResolvedValueOnce(Result.err(error));
    expect(
      Result.unwrapErr(
        await new ReadNoteService(data.repo).handle(
          data.note.getID(),
          data.principal,
        ),
      ),
    ).toBe(error);
  });

  it('reads writes from the shared repositories and excludes logically deleted related records', async () => {
    const data = setup();
    const removedMedium = generateDummyMedium();
    const removedAttachment = generateDummyMedium();
    const activeReaction = generateDummyReaction({
      noteID: data.note.getID(),
      accountID: data.viewer.getID(),
    });
    const removedReaction = generateDummyReaction({
      noteID: data.note.getID(),
      accountID: data.author.getID(),
    });
    const attachments = new InMemoryNoteAttachmentRepository(
      [dummyMedium, removedMedium, removedAttachment],
      [],
      {
        media: new Set([removedMedium.getId()]),
        attachments: new Map([
          [data.note.getID(), new Set([removedAttachment.getId()])],
        ]),
      },
    );
    const reactions = new InMemoryReactionRepository(
      [],
      new Set([removedReaction.getID()]),
    );
    const repo = new InMemoryNoteReadRepository(
      data.notes,
      attachments,
      reactions,
      data.accounts,
    );
    Result.unwrap(
      await attachments.create(data.note.getID(), [
        dummyMedium.getId(),
        removedMedium.getId(),
        removedAttachment.getId(),
      ]),
    );
    Result.unwrap(await reactions.create(activeReaction));
    Result.unwrap(await reactions.create(removedReaction));
    const result = Result.unwrap(
      await new ReadNoteService(repo).handle(data.note.getID(), data.principal),
    );
    expect(result.attachments).toEqual([dummyMedium]);
    expect(result.reactions).toEqual([activeReaction]);
    Result.unwrap(await reactions.deleteByID(activeReaction.getID()));
    expect(
      Result.unwrap(
        await new ReadNoteService(repo).handle(
          data.note.getID(),
          data.principal,
        ),
      ).reactions,
    ).toEqual([]);
  });

  it('uses only the viewer active renotes', async () => {
    const data = setup();
    const scope = await scopeFor(data);
    await data.notes.create(
      generateDummyNote({
        authorID: data.author.getID(),
        originalNoteID: Option.some(data.note.getID()),
      }),
    );
    await data.notes.create(
      generateDummyNote({
        authorID: data.viewer.getID(),
        originalNoteID: Option.some(data.note.getID()),
        deletedAt: Option.some(new Date()),
      }),
    );
    expect(Result.unwrap(await data.repo.findRenoteStatus(scope))).toBe(false);
    await data.notes.create(
      generateDummyNote({
        authorID: data.viewer.getID(),
        originalNoteID: Option.some(data.note.getID()),
      }),
    );
    expect(Result.unwrap(await data.repo.findRenoteStatus(scope))).toBe(true);
    expect(
      Result.unwrap(
        await data.repo.findRenoteStatus(
          await scopeFor(data, { kind: 'anonymous' }),
        ),
      ),
    ).toBe(false);
  });

  it('shares each dependency Ether instance instead of copying the underlying stores', () => {
    const data = setup();
    const notes = inMemoryNoteRepo([data.note]);
    const attachments = inMemoryNoteAttachmentRepo([], []);
    const reactions = inMemoryReactionRepo([]);
    expect(Ether.runEther(notes)).toBe(Ether.runEther(notes));
    expect(Ether.runEther(attachments)).toBe(Ether.runEther(attachments));
    expect(Ether.runEther(reactions)).toBe(Ether.runEther(reactions));
  });
});
