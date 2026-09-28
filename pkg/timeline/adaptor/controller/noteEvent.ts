import { Ether, Result } from '@mikuroxina/mini-fn';
import type { NoteModuleFacade } from '../../../intermodule/note.ts';
import { noteModuleFacadeSymbol } from '../../../intermodule/note.ts';
import type { EventHandler } from '../../../internal/event/mod.ts';
import type { AnyDomainEvent } from '../../../internal/event/type.ts';
import type { NoteID, NoteVisibility } from '../../../notes/model/note.ts';
import type { PushTimelineService } from '../../service/push.ts';
import { pushTimelineSymbol } from '../../service/push.ts';

/**
 * Handles `note.created` / `note.renoted` domain events and pushes the
 * referenced note to timelines. This is an adapter, not a domain service: it
 * only resolves the event into a `Note` and delegates to
 * {@link PushTimelineService}.
 */
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
    // NOTE: A missing note (deleted, or author frozen) is not retryable, so
    // treat it as a successfully handled no-op instead of an error.
    if (Result.isErr(noteRes)) {
      return Result.ok(undefined);
    }

    return this.#pushTimelineService.handle(Result.unwrap(noteRes));
  };
}

export const noteEventHandlerSymbol = Ether.newEtherSymbol<NoteEventHandler>();
export const noteEventHandler = Ether.newEther(
  noteEventHandlerSymbol,
  (args) => new NoteEventHandler(args),
  {
    pushTimelineService: pushTimelineSymbol,
    noteModule: noteModuleFacadeSymbol,
  },
);
