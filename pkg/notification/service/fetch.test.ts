import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { InMemoryNotificationRepository } from '../adaptor/repository/dummy/notification.js';
import {
  FollowedNotification,
  FollowRequestedNotification,
} from '../model/notification.js';
import type { NotificationID } from '../model/notificationBase.js';
import { FetchNotificationService } from './fetch.js';

describe('FetchNotificationService', () => {
  const notifications = [
    FollowedNotification.new({
      id: '1' as NotificationID,
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorID: '20' as AccountID,
      actorType: 'account',
      notificationType: 'followed',
    }),
    FollowRequestedNotification.new({
      id: '2' as NotificationID,
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-11T00:00:00.000Z'),
      actorID: '30' as AccountID,
      actorType: 'account',
      notificationType: 'followRequested',
    }),
    FollowedNotification.new({
      id: '3' as NotificationID,
      recipientID: '20' as AccountID,
      createdAt: new Date('2023-09-12T00:00:00.000Z'),
      actorID: '10' as AccountID,
      actorType: 'account',
      notificationType: 'followed',
    }),
  ];

  const repo = new InMemoryNotificationRepository(notifications);
  const service = new FetchNotificationService(repo);

  it('can fetch a single notification', async () => {
    const res = await service.fetchByID(
      '1' as NotificationID,
      '10' as AccountID,
    );

    expect(Result.isOk(res)).toBeTruthy();
    expect(Result.unwrap(res)).toEqual(notifications[0]);
  });

  it("cannot fetch another person's notification", async () => {
    const res = await service.fetchByID(
      '1' as NotificationID,
      '20' as AccountID,
    );

    expect(Result.isErr(res)).toBeTruthy();
    expect(Result.unwrapErr(res).message).toBe('not allowed');
  });

  it('can fetch multiple notifications', async () => {
    const res = await service.fetchByRecipientID('10' as AccountID, {
      cursor: Option.none(),
      limit: Option.none(),
    });

    expect(Result.isOk(res)).toBeTruthy();
    expect(Result.unwrap(res)).toEqual([notifications[1], notifications[0]]);
  });

  it("cannot fetch another person's notifications", async () => {
    const res = await service.fetchByRecipientID('10' as AccountID, {
      cursor: Option.none(),
      limit: Option.none(),
    });

    expect(Result.isOk(res)).toBeTruthy();
    expect(
      Result.unwrap(res)
        .map((v) => v.getRecipientID())
        .includes('20' as AccountID),
    ).toBeFalsy();
  });
});
