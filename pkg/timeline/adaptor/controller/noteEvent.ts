import { Result } from '@mikuroxina/mini-fn';

import type { NoteModuleFacade } from '../../../intermodule/note.ts';
import type { EventHandler } from '../../../internal/event/mod.ts';
import type { AnyDomainEvent } from '../../../internal/event/type.ts';
import { NoteVisibilityInvalidError } from '../../../notes/model/errors.ts';
import type { NoteID, NoteVisibility } from '../../../notes/model/note.ts';
import type { PushTimelineService } from '../../service/push.ts';

/** Resolves note events to notes and delegates timeline updates. */
export class NoteEventHandler {
  readonly #pushTimelineService: PushTimelineService;
  readonly #noteModule: NoteModuleFacade;

  constructor(args: {
    pushTimelineService: PushTimelineService;
    noteModule: NoteModuleFacade;
  }) {
    this.#pushTimelineService = args.pushTimelineService;
    this.#noteModule = args.noteModule;
  }

  handle: EventHandler = async (event: AnyDomainEvent) => {
    if (
      event.eventName !== 'note.created' &&
      event.eventName !== 'note.renoted'
    ) {
      return Result.ok(undefined);
    }

    if (event.eventName === 'note.created') {
      const payload = event.payload as { visibility: NoteVisibility };
      if (payload.visibility === 'DIRECT') {
        return Result.ok(undefined);
      }
    }

    const noteRes = await this.#noteModule.fetchNoteByID(
      event.target as NoteID,
    );
    // Deleted, frozen-account, or otherwise unavailable notes are not
    // retryable. Acknowledge them without changing the timeline.
    if (Result.isErr(noteRes)) {
      return Result.ok(undefined);
    }

    const note = Result.unwrap(noteRes);
    if (note.getVisibility() === 'DIRECT') {
      return Result.ok(undefined);
    }

    const pushed = await this.#pushTimelineService.handle(note);
    // A note can be valid for home timelines but intentionally invisible in
    // lists (for example, FOLLOWERS notes). That is a completed no-op, not a
    // transient event-processing failure.
    if (
      Result.isErr(pushed) &&
      Result.unwrapErr(pushed) instanceof NoteVisibilityInvalidError
    ) {
      return Result.ok(undefined);
    }
    return pushed;
  };
}
