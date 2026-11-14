import { Option, Result } from '@mikuroxina/mini-fn';
import { afterEach, describe, expect, it, type MockedObject, vi } from 'vitest';
import { generateDummyAccount } from '../../accounts/testData/testData.ts';
import type { EventPublisher } from '../../internal/event/mod.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import {
  InMemoryNoteRepository,
  InMemoryReactionRepository,
} from '../adaptor/repository/dummy.ts';
import type { Note } from '../model/note.ts';
import { generateDummyNote } from '../testData/testData.ts';
import { CreateReactionService } from './createReaction.ts';

const idGenerator = new SnowflakeIDGenerator(1, new MockClock(new Date()));

const normalNote = generateDummyNote({
  content: 'this is a test note',
  createdAt: new Date('2023-10-10T00:00:00Z'),
});
const renoteNote = generateDummyNote({
  content: '',
  originalNoteID: Option.some(normalNote.getID()),
  createdAt: new Date('2023-10-10T01:00:00Z'),
});
const reactor = generateDummyAccount();
const anotherReactor = generateDummyAccount();

let reactionRepository = new InMemoryReactionRepository();
let noteRepository = new InMemoryNoteRepository([normalNote, renoteNote]);
const eventPublisher = {
  publishMany: vi.fn(async () => Result.ok(undefined)),
} as const satisfies MockedObject<EventPublisher>;
let service = new CreateReactionService(
  idGenerator,
  reactionRepository,
  noteRepository,
  eventPublisher,
);

describe('CreateReactionService', () => {
  afterEach(() => {
    reactionRepository = new InMemoryReactionRepository();
    noteRepository = new InMemoryNoteRepository([normalNote, renoteNote]);
    vi.clearAllMocks();
    service = new CreateReactionService(
      idGenerator,
      reactionRepository,
      noteRepository,
      eventPublisher,
    );
  });

  it('add reaction', async () => {
    const res = await service.handle(normalNote.getID(), reactor.getID(), '👍');

    expect(Result.isOk(res)).toBe(true);
    expect(
      Result.isOk(
        await reactionRepository.findByCompositeID({
          noteID: normalNote.getID(),
          accountID: reactor.getID(),
        }),
      ),
    ).toBe(true);
    expect(eventPublisher.publishMany).toHaveBeenCalledWith([
      expect.objectContaining({ eventName: 'note.reaction.created' }),
    ]);
  });

  it('error when already reacted', async () => {
    await service.handle(normalNote.getID(), reactor.getID(), '👍');
    const res = await service.handle(normalNote.getID(), reactor.getID(), '👌');

    const reaction = await reactionRepository.findByCompositeID({
      noteID: normalNote.getID(),
      accountID: reactor.getID(),
    });

    expect(Result.isErr(res)).toBe(true);
    expect(Result.isOk(reaction)).toBe(true);
    expect(Result.unwrap(reaction).getEmoji()).toBe('👍');
  });

  it('error when note not found', async () => {
    const res = await service.handle(
      generateDummyID<Note>(),
      reactor.getID(),
      '👍',
    );

    expect(Result.isErr(res)).toBe(true);
  });

  it('reacting on a renote is attributed to the original note', async () => {
    const res = await service.handle(
      renoteNote.getID(),
      anotherReactor.getID(),
      '👍',
    );

    expect(Result.isOk(res)).toBe(true);
    expect(
      Result.isOk(
        await reactionRepository.findByCompositeID({
          noteID: normalNote.getID(),
          accountID: anotherReactor.getID(),
        }),
      ),
    ).toBe(true);
    // The returned note should be the original note, not the renote
    expect(Result.unwrap(res).getID()).toBe(normalNote.getID());
  });
});
