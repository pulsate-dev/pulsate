import type { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type {
  EventSubscriber,
  EventSubscription,
} from '../internal/event/mod.ts';
import type { AnyDomainEvent } from '../internal/event/type.ts';
import { noteEventHandlerInstance } from './deps.ts';

const noteCreatedPayloadSchema = v.object({
  authorID: v.string(),
  visibility: v.picklist(['PUBLIC', 'HOME', 'FOLLOWERS', 'DIRECT']),
});

const noteRenotedPayloadSchema = v.object({
  originalNoteID: v.string(),
});

export function validateNoteTimelineEvent(event: AnyDomainEvent): boolean {
  switch (event.eventName) {
    case 'note.created':
      return v.safeParse(noteCreatedPayloadSchema, event.payload).success;
    case 'note.renoted':
      return v.safeParse(noteRenotedPayloadSchema, event.payload).success;
    default:
      return false;
  }
}

export async function startTimelineEventSubscriptions(
  subscriber: EventSubscriber,
): Promise<Result.Result<Error, EventSubscription>> {
  return subscriber.subscribe({
    id: 'timeline-push-note-v1',
    subjects: ['note.created', 'note.renoted'],
    handler: noteEventHandlerInstance.handle,
    validatePayload: validateNoteTimelineEvent,
    ackWaitMs: 30000,
  });
}
