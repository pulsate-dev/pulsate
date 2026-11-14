import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import {
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.ts';
import { NoteNotFoundError, NoteNotReactedYetError } from '../model/errors.ts';
import type { Note } from '../model/note.ts';
import {
  generateDummyNote,
  generateDummyReaction,
} from '../testData/testData.ts';
import { DeleteReactionService } from './deleteReaction.ts';

const author = generateDummyAccount();
const normalNote = generateDummyNote({
  authorID: author.getID(),
  content: 'test note',
});
const renoteNote = generateDummyNote({
  authorID: author.getID(),
  content: '',
  originalNoteID: Option.some(normalNote.getID()),
});
const reactor = generateDummyAccount();
const anotherReactor = generateDummyAccount();

describe('DeleteReactionService', () => {
  const reactionRepo = new InMemoryReactionRepository([
    generateDummyReaction({
      noteID: normalNote.getID(),
      accountID: reactor.getID(),
      body: '👍',
    }),
    generateDummyReaction({
      noteID: normalNote.getID(),
      accountID: anotherReactor.getID(),
      body: '❤️',
    }),
  ]);
  const noteRepo = new InMemoryNoteRepository([normalNote, renoteNote]);
  const eventPublisher = {
    publishMany: vi.fn(async () => Result.ok(undefined)),
  } as const satisfies MockedObject<EventPublisher>;
  const service = new DeleteReactionService(
    reactionRepo,
    noteRepo,
    eventPublisher,
  );

  it('should delete a reaction', async () => {
    const res = await service.handle(normalNote.getID(), reactor.getID());
    expect(Result.isOk(res)).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.reaction.deleted' }),
    ]);
  });

  it('if note not found, should return NoteNotFoundError', async () => {
    const res = await service.handle(generateDummyID<Note>(), reactor.getID());
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteNotFoundError);
  });

  it('if reaction not found, should return NoteNotReactedYetError', async () => {
    const res = await service.handle(
      normalNote.getID(),
      generateDummyID<Account>(),
    );
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toBeInstanceOf(NoteNotReactedYetError);
  });

  it('deleting reaction via renote ID resolves to original note', async () => {
    const res = await service.handle(
      renoteNote.getID(),
      anotherReactor.getID(),
    );
    expect(Result.isOk(res)).toBe(true);
  });
});
