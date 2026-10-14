import { Result } from '@mikuroxina/mini-fn';

import { accountEventFactory } from '../../accounts/model/event/accountEvents.ts';
import { avatarEventFactory } from '../../accounts/model/event/avatarEvents.ts';
import { followEventFactory } from '../../accounts/model/event/followEvents.ts';
import { mediumEventFactory } from '../../drive/model/event/mediumEvents.ts';
import { bookmarkEventFactory } from '../../notes/model/event/bookmarkEvents.ts';
import { noteEventFactory } from '../../notes/model/event/noteEvents.ts';
import { reactionEventFactory } from '../../notes/model/event/reactionEvents.ts';
import { listEventFactory } from '../../timeline/model/event/listEvents.ts';
import type { AnyDomainEvent } from './type.ts';

type EventFactoryMethod = (
  args: Record<string, unknown>,
) => AnyDomainEvent | Result.Result<Error, AnyDomainEvent>;

// Factory methods copy these fields into the event; one dummy value is enough
// to discover each event name despite their different argument types.
const eventFactories = [
  accountEventFactory,
  avatarEventFactory,
  followEventFactory,
  mediumEventFactory,
  bookmarkEventFactory,
  noteEventFactory,
  reactionEventFactory,
  listEventFactory,
] as unknown as Record<string, EventFactoryMethod>[];

const dummyArgs = {
  target: 'dummy',
  actor: 'dummy',
  accountID: 'dummy',
  authorID: 'dummy',
  memberID: 'dummy',
  mediumID: 'dummy',
  ownerID: 'dummy',
  targetID: 'dummy',
  bio: '',
  mail: '',
  nickname: '',
  title: '',
  emoji: '',
  visibility: 'PUBLIC',
  occurredAt: new Date(0),
};

/** Returns all domain event subjects, derived from each event factory. */
export function collectEventNames(): string[] {
  const names = eventFactories.flatMap((factory) =>
    Object.values(factory).map((create) => {
      const produced = create(dummyArgs);
      return 'eventName' in produced
        ? produced.eventName
        : Result.unwrap(produced).eventName;
    }),
  );
  return Array.from(new Set(names));
}
