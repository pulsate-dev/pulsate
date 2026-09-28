import type { Result } from '@mikuroxina/mini-fn';
import * as v from 'valibot';

import type {
  EventSubscriber,
  EventSubscription,
} from '../internal/event/mod.ts';
import type { AnyDomainEvent } from '../internal/event/type.ts';
import { noteEventHandlerInstance } from './mod.ts';

const noteCreatedPayloadSchema = v.object({
  visibility: v.picklist(['PUBLIC', 'HOME', 'FOLLOWERS', 'DIRECT']),
});
const noteRenotedPayloadSchema = v.object({
  originalNoteID: v.string(),
});

const validatePayload = (event: AnyDomainEvent): boolean => {
  switch (event.eventName) {
    case 'note.created':
      return v.safeParse(noteCreatedPayloadSchema, event.payload).success;
    case 'note.renoted':
      return v.safeParse(noteRenotedPayloadSchema, event.payload).success;
    default:
      return false;
  }
};

/**
 * @description Starts the durable subscription that pushes newly created and
 * renoted notes to timelines.
 */
export async function startTimelineEventSubscriptions(
  subscriber: EventSubscriber,
): Promise<Result.Result<Error, EventSubscription>> {
  return subscriber.subscribe({
    id: 'timeline-push-note-v1',
    subjects: ['note.created', 'note.renoted'],
    handler: noteEventHandlerInstance.handle,
    validatePayload,
    ackWaitMs: 10000,
  });
}
