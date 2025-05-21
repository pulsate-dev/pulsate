import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { MockClock } from '../../id/mod.js';
import { InMemoryNotificationRepository } from '../adaptor/repository/dummy/notification.js';
import {
  type CreateFollowedNotificationArgs,
  FollowedNotification,
} from '../model/notification.js';
import type { NotificationID } from '../model/notificationBase.js';
import { MarkAsReadNotificationService } from './markAsRead.js';

describe('MarkAsReadNotificationService', () => {
  const testNotificationArgs = {
    id: '1' as NotificationID,
    notificationType: 'followed',
    recipientID: '10' as AccountID,
    actorType: 'account',
    actorID: '20' as AccountID,
    createdAt: new Date(),
    readAt: Option.none(),
  } as const satisfies CreateFollowedNotificationArgs;

  const repo = new InMemoryNotificationRepository([
    FollowedNotification.new(testNotificationArgs),
    FollowedNotification.reconstruct({
      ...testNotificationArgs,
      id: '2' as NotificationID,
      readAt: Option.some(new Date()),
    }),
  ]);
  const service = new MarkAsReadNotificationService(
    repo,
    new MockClock(new Date('2023-09-10T00:00:00Z')),
  );

  it('Should mark a notification as read', async () => {
    const res = await service.handle('1' as NotificationID, '10' as AccountID);

    expect(Result.isOk(res)).toBe(true);
    expect(Result.unwrap(res).getIsRead()).toBe(true);
  });

  it('Should return an error if the notification is already read', async () => {
    const res = await service.handle('2' as NotificationID, '10' as AccountID);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(
      new Error('Notification already read'),
    );
  });

  it('should return an error if the user is not the recipient', async () => {
    const res = await service.handle('1' as NotificationID, '30' as AccountID);
    expect(Result.isErr(res)).toBe(true);
    expect(Result.unwrapErr(res)).toStrictEqual(new Error('Not allowed'));
  });
});
