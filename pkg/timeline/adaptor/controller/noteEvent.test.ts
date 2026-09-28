import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, type MockedObject, vi } from 'vitest';

import type { AccountID } from '../../../accounts/model/account.ts';
import type { NoteModuleFacade } from '../../../intermodule/note.ts';
import type { EventID } from '../../../internal/event/type.ts';
import { Note, type NoteID } from '../../../notes/model/note.ts';
import type { PushTimelineService } from '../../service/push.ts';
import { NoteEventHandler } from './noteEvent.ts';

const note = Note.reconstruct({
  id: '1' as NoteID,
  authorID: '101' as AccountID,
  content: 'hello',
  contentsWarningComment: '',
  createdAt: new Date(),
  originalNoteID: Option.none(),
  attachmentFileID: [],
  sendTo: Option.none(),
  visibility: 'PUBLIC',
  updatedAt: Option.none(),
  deletedAt: Option.none(),
});

const baseEvent = {
  id: 'event-1' as EventID,
  target: '1' as NoteID,
  actor: '101' as AccountID,
  occurredAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('NoteEventHandler', () => {
  const initDeps = () => {
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

  it('pushes the note when note.created is PUBLIC', async () => {
    const { handler, pushTimelineService, noteModule } = initDeps();

    const res = await handler.handle({
      ...baseEvent,
      eventName: 'note.created',
      payload: { authorID: '101' as AccountID, visibility: 'PUBLIC' },
    });

    expect(noteModule.fetchNoteByID).toHaveBeenCalledWith('1' as NoteID);
    expect(pushTimelineService.handle).toHaveBeenCalledWith(note);
    expect(Result.isOk(res)).toBe(true);
  });

  it('skips DIRECT note.created without fetching the note', async () => {
    const { handler, pushTimelineService, noteModule } = initDeps();

    const res = await handler.handle({
      ...baseEvent,
      eventName: 'note.created',
      payload: { authorID: '101' as AccountID, visibility: 'DIRECT' },
    });

    expect(noteModule.fetchNoteByID).not.toHaveBeenCalled();
    expect(pushTimelineService.handle).not.toHaveBeenCalled();
    expect(res).toStrictEqual(Result.ok(undefined));
  });

  it('treats a missing note as a successful no-op', async () => {
    const { handler, pushTimelineService, noteModule } = initDeps();
    noteModule.fetchNoteByID.mockResolvedValueOnce(
      Result.err(new Error('Note not found')),
    );

    const res = await handler.handle({
      ...baseEvent,
      eventName: 'note.created',
      payload: { authorID: '101' as AccountID, visibility: 'PUBLIC' },
    });

    expect(pushTimelineService.handle).not.toHaveBeenCalled();
    expect(res).toStrictEqual(Result.ok(undefined));
  });

  it('pushes the note for note.renoted', async () => {
    const { handler, pushTimelineService, noteModule } = initDeps();

    const res = await handler.handle({
      ...baseEvent,
      eventName: 'note.renoted',
      payload: { originalNoteID: '2' as NoteID },
    });

    expect(noteModule.fetchNoteByID).toHaveBeenCalledWith('1' as NoteID);
    expect(pushTimelineService.handle).toHaveBeenCalledWith(note);
    expect(Result.isOk(res)).toBe(true);
  });

  it('propagates an error from PushTimelineService', async () => {
    const { handler, pushTimelineService } = initDeps();
    const error = new Error('push failed');
    pushTimelineService.handle.mockResolvedValueOnce(Result.err(error));

    const res = await handler.handle({
      ...baseEvent,
      eventName: 'note.renoted',
      payload: { originalNoteID: '2' as NoteID },
    });

    expect(res).toStrictEqual(Result.err(error));
  });

  it('ignores unrelated event names', async () => {
    const { handler, pushTimelineService, noteModule } = initDeps();

    const res = await handler.handle({
      ...baseEvent,
      eventName: 'note.deleted',
      payload: {},
    });

    expect(noteModule.fetchNoteByID).not.toHaveBeenCalled();
    expect(pushTimelineService.handle).not.toHaveBeenCalled();
    expect(res).toStrictEqual(Result.ok(undefined));
  });
});
