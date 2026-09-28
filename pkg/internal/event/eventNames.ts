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

// NOTE: every factory method only reads its args back into the event it
// builds (id/eventName/target/actor/payload/occurredAt), so one dummy value
// shared across all of them is enough to discover each `eventName`. The
// factories' arg types differ per method, so this cast is unavoidable.
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

/**
 * @description Every domain event name in the system, derived from each
 * module's event factory so a newly added event is picked up automatically.
 */
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
