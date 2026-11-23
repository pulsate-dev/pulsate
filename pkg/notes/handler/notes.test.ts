import { Option, Result } from '@mikuroxina/mini-fn';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import { NoteInternalError } from '../model/errors.ts';
import type { NoteReadRepository } from '../model/repository.ts';
import type { CreateService } from '../service/create.ts';
import type { FetchService } from '../service/fetch.ts';
import type { RenoteService } from '../service/renote.ts';
import { generateDummyNote } from '../testData/testData.ts';

const repository = vi.hoisted(() => ({
  findAuthorization: vi.fn<NoteReadRepository['findAuthorization']>(),
  findNote: vi.fn<NoteReadRepository['findNote']>(),
  findAttachments: vi.fn<NoteReadRepository['findAttachments']>(),
  findReactions: vi.fn<NoteReadRepository['findReactions']>(),
  findRenoteStatus: vi.fn<NoteReadRepository['findRenoteStatus']>(),
}));

vi.mock('../deps.ts', async () => {
  const { NoteController } = await import('../adaptor/controller/note.ts');
  const { ReadNoteService } = await import('../service/read.ts');
  return {
    noteController: new NoteController(
      {} as CreateService,
      {} as FetchService,
      {} as RenoteService,
      new ReadNoteService(repository),
    ),
    reactionController: {},
    bookmarkController: {},
  };
});

vi.mock('../../accounts/deps.ts', async () => {
  const { Result } = await import('@mikuroxina/mini-fn');
  return {
    authenticationTokenService: Promise.resolve({
      verify: async (token: string) =>
        token === 'invalid'
          ? Result.err(new Error('Invalid token'))
          : Result.ok(undefined),
    }),
  };
});

import { noteHandlers } from './notes.ts';

const author = generateDummyAccount();
const viewer = generateDummyAccount({
  frozen: 'frozen',
  status: 'notActivated',
  role: 'admin',
});
const note = generateDummyNote({ authorID: author.getID() });
const profile = {
  id: author.getID(),
  name: author.getName(),
  display_name: author.getNickname(),
  bio: author.getBio(),
};
const token = `header.${Buffer.from(
  JSON.stringify({
    sub: viewer.getID(),
    accountName: viewer.getName(),
  }),
).toString('base64')}.signature`;
const authorization = () => ({
  resource: {
    noteId: note.getID(),
    authorId: author.getID(),
    visibility: note.getVisibility(),
    deleted: false,
  },
  context: { authorAvailable: true, following: false },
});

describe('GET /v0/notes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.findAuthorization.mockResolvedValue(
      Result.ok(Option.some(authorization())),
    );
    repository.findNote.mockResolvedValue(Result.ok({ note, author: profile }));
    repository.findAttachments.mockResolvedValue(Result.ok([]));
    repository.findReactions.mockResolvedValue(Result.ok([]));
    repository.findRenoteStatus.mockResolvedValue(Result.ok(false));
  });

  it('allows anonymous reads and preserves the public profile placeholders', async () => {
    const response = await noteHandlers.request(`/v0/notes/${note.getID()}`);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.author).toEqual({
      ...profile,
      avatar: '',
      header: '',
      followed_count: 0,
      following_count: 0,
    });
    expect(json.renoted).toBe(false);
    expect(repository.findAuthorization).toHaveBeenCalledWith(note.getID(), {
      kind: 'anonymous',
    });
  });

  it('uses the authenticated viewer, not the author, as principal', async () => {
    repository.findRenoteStatus.mockResolvedValueOnce(Result.ok(true));
    const response = await noteHandlers.request(`/v0/notes/${note.getID()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    expect((await response.json()).renoted).toBe(true);
    expect(repository.findAuthorization).toHaveBeenCalledWith(note.getID(), {
      kind: 'account',
      accountId: viewer.getID(),
    });
  });

  it('does not serialize unexpected private author attributes', async () => {
    const privateProfile = {
      ...profile,
      mail: 'private@example.com',
      passphraseHash: 'private-hash',
    };
    repository.findNote.mockResolvedValueOnce(
      Result.ok({ note, author: privateProfile }),
    );
    const response = await noteHandlers.request(`/v0/notes/${note.getID()}`);
    const json = await response.json();
    expect(json.author).not.toHaveProperty('mail');
    expect(json.author).not.toHaveProperty('passphraseHash');
  });

  it.each(['absent', 'followers', 'deleted', 'frozen', 'direct'] as const)(
    'returns the same 404 for %s notes without fetching related data',
    async (reason) => {
      const data = authorization();
      if (reason === 'followers') data.resource.visibility = 'FOLLOWERS';
      if (reason === 'deleted') data.resource.deleted = true;
      if (reason === 'frozen') data.context.authorAvailable = false;
      if (reason === 'direct') data.resource.visibility = 'DIRECT';
      repository.findAuthorization.mockResolvedValueOnce(
        Result.ok(reason === 'absent' ? Option.none() : Option.some(data)),
      );
      const response = await noteHandlers.request(`/v0/notes/${note.getID()}`);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'NOTE_NOT_FOUND' });
      expect(repository.findNote).not.toHaveBeenCalled();
      expect(repository.findAttachments).not.toHaveBeenCalled();
      expect(repository.findReactions).not.toHaveBeenCalled();
      expect(repository.findRenoteStatus).not.toHaveBeenCalled();
    },
  );

  it('does not grant followers-only access to an unrelated authenticated viewer', async () => {
    const data = authorization();
    data.resource.visibility = 'FOLLOWERS';
    repository.findAuthorization.mockResolvedValueOnce(
      Result.ok(Option.some(data)),
    );
    const response = await noteHandlers.request(`/v0/notes/${note.getID()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'NOTE_NOT_FOUND' });
  });

  it('does not downgrade an invalid token to anonymous access', async () => {
    const response = await noteHandlers.request(`/v0/notes/${note.getID()}`, {
      headers: { Authorization: 'Bearer invalid' },
    });
    expect(response.status).toBe(401);
    expect(repository.findAuthorization).not.toHaveBeenCalled();
  });

  it('returns 500 for database failures rather than exposing them as absence', async () => {
    repository.findAuthorization.mockResolvedValueOnce(
      Result.err(new NoteInternalError('Unavailable', { cause: null })),
    );
    const response = await noteHandlers.request(`/v0/notes/${note.getID()}`);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'INTERNAL_ERROR' });
  });
});
