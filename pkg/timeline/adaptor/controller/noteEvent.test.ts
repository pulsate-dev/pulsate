import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';
import type { NoteModuleFacade } from '../../../intermodule/note.ts';
import type { EventID } from '../../../internal/event/type.ts';
import { generateDummyID } from '../../../internal/id/dummy.ts';
import { NoteVisibilityInvalidError } from '../../../notes/model/errors.ts';
import type { Note } from '../../../notes/model/note.ts';
import { generateDummyNote } from '../../../notes/testData/testData.ts';
import type { PushTimelineService } from '../../service/push.ts';
import { NoteEventHandler } from './noteEvent.ts';

const note = generateDummyNote({ content: 'hello', visibility: 'PUBLIC' });
const originalNoteID = generateDummyID<Note>();

const baseEvent = {
  id: 'event-1' as EventID,
  target: note.getID(),
  actor: note.getAuthorID(),
  occurredAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('NoteEventHandler', () => {
  const init = () => {
    const pushTimelineService = {
      handle: vi.fn<PushTimelineService['handle']>(async () =>
        Result.ok(undefined),
      ),
    } as const satisfies MockedObject<Pick<PushTimelineService, 'handle'>>;
    const noteModule = {
      fetchNoteByID: vi.fn<NoteModuleFacade['fetchNoteByID']>(async () =>
        Result.ok(note),
      ),
    } as const satisfies MockedObject<Pick<NoteModuleFacade, 'fetchNoteByID'>>;
    const handler = new NoteEventHandler({
      pushTimelineService:
        pushTimelineService as unknown as PushTimelineService,
      noteModule: noteModule as unknown as NoteModuleFacade,
    });
    return { handler, pushTimelineService, noteModule };
  };

  it('pushes notes created with a timeline-visible scope', async () => {
    const { handler, pushTimelineService, noteModule } = init();

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.created',
      payload: { authorID: note.getAuthorID(), visibility: 'PUBLIC' },
    });

    expect(noteModule.fetchNoteByID).toHaveBeenCalledWith(note.getID());
    expect(pushTimelineService.handle).toHaveBeenCalledWith(note);
    expect(Result.isOk(result)).toBe(true);
  });

  it('skips direct notes', async () => {
    const { handler, pushTimelineService, noteModule } = init();

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.created',
      payload: { authorID: note.getAuthorID(), visibility: 'DIRECT' },
    });

    expect(noteModule.fetchNoteByID).not.toHaveBeenCalled();
    expect(pushTimelineService.handle).not.toHaveBeenCalled();
    expect(result).toStrictEqual(Result.ok(undefined));
  });

  it('acknowledges a note that is no longer available', async () => {
    const { handler, pushTimelineService, noteModule } = init();
    noteModule.fetchNoteByID.mockResolvedValueOnce(
      Result.err(new Error('Note not found')),
    );

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.created',
      payload: { authorID: note.getAuthorID(), visibility: 'PUBLIC' },
    });

    expect(pushTimelineService.handle).not.toHaveBeenCalled();
    expect(result).toStrictEqual(Result.ok(undefined));
  });

  it('pushes renotes to timelines', async () => {
    const { handler, pushTimelineService, noteModule } = init();

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.renoted',
      payload: { originalNoteID },
    });

    expect(noteModule.fetchNoteByID).toHaveBeenCalledWith(note.getID());
    expect(pushTimelineService.handle).toHaveBeenCalledWith(note);
    expect(Result.isOk(result)).toBe(true);
  });

  it('skips renotes with direct visibility', async () => {
    const { handler, pushTimelineService, noteModule } = init();
    const directNote = generateDummyNote({
      content: 'direct',
      visibility: 'DIRECT',
    });
    noteModule.fetchNoteByID.mockResolvedValueOnce(Result.ok(directNote));

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.renoted',
      payload: { originalNoteID },
    });

    expect(pushTimelineService.handle).not.toHaveBeenCalled();
    expect(result).toStrictEqual(Result.ok(undefined));
  });

  it('propagates retryable timeline errors', async () => {
    const { handler, pushTimelineService } = init();
    const error = new Error('push failed');
    pushTimelineService.handle.mockResolvedValueOnce(Result.err(error));

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.renoted',
      payload: { originalNoteID },
    });

    expect(result).toStrictEqual(Result.err(error));
  });

  it('acknowledges notes that are not visible in lists', async () => {
    const { handler, pushTimelineService } = init();
    pushTimelineService.handle.mockResolvedValueOnce(
      Result.err(
        new NoteVisibilityInvalidError('Note invisible', { cause: null }),
      ),
    );

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.created',
      payload: { authorID: note.getAuthorID(), visibility: 'FOLLOWERS' },
    });

    expect(result).toStrictEqual(Result.ok(undefined));
  });

  it('ignores unrelated events', async () => {
    const { handler, pushTimelineService, noteModule } = init();

    const result = await handler.handle({
      ...baseEvent,
      eventName: 'note.deleted',
      payload: {},
    });

    expect(noteModule.fetchNoteByID).not.toHaveBeenCalled();
    expect(pushTimelineService.handle).not.toHaveBeenCalled();
    expect(result).toStrictEqual(Result.ok(undefined));
  });
});
