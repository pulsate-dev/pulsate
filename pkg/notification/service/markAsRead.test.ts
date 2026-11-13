import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { MockClock } from '../../internal/id/mod.ts';
import { InMemoryNotificationRepository } from '../adaptor/repository/dummy/notification.ts';
import {
  type CreateFollowedNotificationArgs,
  FollowedNotification,
} from '../model/notification.ts';
import type { NotificationBase } from '../model/notificationBase.ts';
import { MarkAsReadNotificationService } from './markAsRead.ts';

describe('MarkAsReadNotificationService', () => {
  const recipientID = generateDummyID<Account>();
  const otherAccountID = generateDummyID<Account>();
  const unreadID = generateDummyID<NotificationBase>();
  const readID = generateDummyID<NotificationBase>();
  const testNotificationArgs = {
    id: unreadID,
    notificationType: 'followed',
    recipientID,
    actorType: 'account',
    actorID: generateDummyID<Account>(),
    createdAt: new Date(),
    readAt: Option.none(),
  } as const satisfies CreateFollowedNotificationArgs;

  const repo = new InMemoryNotificationRepository([
    FollowedNotification.new(testNotificationArgs),
    FollowedNotification.reconstruct({
      ...testNotificationArgs,
      id: readID,
      readAt: Option.some(new Date()),
    }),
  ]);
  const service = new MarkAsReadNotificationService(
    repo,
    new MockClock(new Date('2023-09-10T00:00:00Z')),
  );

  it('Should mark a notification as read', async () => {
    const res = await service.handle(unreadID, recipientID);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getIsRead()).toBe(true);
  });

  it('Should return an error if the notification is already read', async () => {
    const res = await service.handle(readID, recipientID);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(
      new Error('Notification already read'),
    );
  });

  it('should return an error if the user is not the recipient', async () => {
    const res = await service.handle(unreadID, otherAccountID);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(new Error('Not allowed'));
  });
});
