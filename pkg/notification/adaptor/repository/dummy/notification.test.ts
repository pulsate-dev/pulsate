import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { Account } from '../../../../accounts/model/account.ts';
import { generateDummyID } from '../../../../internal/id/dummy.ts';
import { addDuration } from '../../../../internal/time/mod.ts';
import type { Note } from '../../../../notes/model/note.ts';
import type { Reaction } from '../../../../notes/model/reaction.ts';
import {
  FollowedNotification,
  FollowRequestedNotification,
  MentionedNotification,
  ReactedNotification,
  RenotedNotification,
} from '../../../model/notification.ts';
import type { NotificationBase } from '../../../model/notificationBase.ts';
import { InMemoryNotificationRepository } from './notification.ts';

describe('InMemoryNotificationRepository', () => {
  const baseDate = new Date('2023-09-10T00:00:00Z');
  const recipientID = generateDummyID<Account>();
  const actorID = generateDummyID<Account>();
  const createdAt = (days: number) => addDuration(baseDate, { days });
  const notificationID = (days: number) =>
    generateDummyID<NotificationBase>(createdAt(days));

  const dummyNotification1 = FollowedNotification.new({
    id: notificationID(0),
    recipientID: recipientID,
    notificationType: 'followed',
    actorType: 'account',
    actorID: actorID,
    createdAt: createdAt(0),
  });
  const dummyNotification2 = ReactedNotification.new({
    id: notificationID(1),
    recipientID: recipientID,
    notificationType: 'reacted',
    actorType: 'account',
    actorID: actorID,
    createdAt: createdAt(1),
    sourceID: generateDummyID<Note>(),
    activityID: generateDummyID<Reaction>(),
  });
  const dummyNotification3 = MentionedNotification.new({
    id: notificationID(2),
    recipientID: recipientID,
    notificationType: 'mentioned',
    actorType: 'account',
    actorID: actorID,
    createdAt: createdAt(2),
    activityID: generateDummyID<Note>(),
  });
  const dummyNotification4 = RenotedNotification.new({
    id: notificationID(3),
    recipientID: recipientID,
    notificationType: 'renoted',
    actorType: 'account',
    actorID: actorID,
    createdAt: createdAt(3),
    sourceID: generateDummyID<Note>(),
    activityID: generateDummyID<Note>(),
  });
  const dummyNotification5 = FollowRequestedNotification.new({
    id: notificationID(4),
    recipientID: recipientID,
    notificationType: 'followRequested',
    actorType: 'account',
    actorID: actorID,
    createdAt: createdAt(4),
  });

  const repository = new InMemoryNotificationRepository([
    dummyNotification1,
    dummyNotification2,
    dummyNotification3,
    dummyNotification4,
    dummyNotification5,
  ]);

  it('filter: if beforeID is specified, return notes before the specified note', async () => {
    /**
     * NOTE:
     * ```
     * Old -> New
     * 1   2   3   4   5
     *         ^ before
     *        ←| returns 1,2 (specified notification is excluded)
     * ```
     */
    const actual = await repository.findByRecipientID(recipientID, {
      limit: Option.none(),
      cursor: Option.some({
        type: 'before',
        id: dummyNotification3.getID(),
      }),
    });

    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([
      dummyNotification2,
      dummyNotification1,
    ]);
  });

  it('filter: if afterID is specified, return notes after the specified note', async () => {
    /**
     * NOTE:
     * ```
     * Old -> New
     * 1   2   3   4   5
     *         ^ after
     *         |→ returns 4,5 (specified notification is included)
     * ```
     */
    const actual = await repository.findByRecipientID(recipientID, {
      limit: Option.none(),
      cursor: Option.some({
        type: 'after',
        id: dummyNotification3.getID(),
      }),
    });

    expect(Result.isOk(actual)).toBe(true);
    expect(Result.unwrap(actual)).toStrictEqual([
      dummyNotification5,
      dummyNotification4,
    ]);
  });

  it('filter: if after/beforeID are not specified, return {filter.limit} notifications from the latest notification', async () => {
    // if limit not set, returns 5 notifications
    // NOTE: If the number of all notifications is less than the limit, return all notifications
    const limitNotSet = await repository.findByRecipientID(recipientID, {
      limit: Option.none(),
      cursor: Option.none(),
    });
    expect(Result.isOk(limitNotSet)).toBe(true);
    expect(Result.unwrap(limitNotSet)).toStrictEqual([
      dummyNotification5,
      dummyNotification4,
      dummyNotification3,
      dummyNotification2,
      dummyNotification1,
    ]);

    // if limit set 2, returns 2 notifications
    const limit2 = await repository.findByRecipientID(recipientID, {
      limit: Option.some(2),
      cursor: Option.none(),
    });
    expect(Result.isOk(limit2)).toBe(true);
    expect(Result.unwrap(limit2)).toStrictEqual([
      dummyNotification5,
      dummyNotification4,
    ]);
  });
});
