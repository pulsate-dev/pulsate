import { Option, Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { addDuration } from '../../internal/time/mod.ts';
import { InMemoryNotificationRepository } from '../adaptor/repository/dummy/notification.ts';
import {
  FollowedNotification,
  FollowRequestedNotification,
} from '../model/notification.ts';
import type { NotificationBase } from '../model/notificationBase.ts';
import { FetchNotificationService } from './fetch.ts';

describe('FetchNotificationService', () => {
  const baseDate = new Date('2023-09-10T00:00:00.000Z');
  const accountA = generateDummyID<Account>();
  const accountB = generateDummyID<Account>();
  const accountC = generateDummyID<Account>();

  const followedToA = FollowedNotification.new({
    id: generateDummyID<NotificationBase>(baseDate),
    recipientID: accountA,
    createdAt: baseDate,
    actorID: accountB,
    actorType: 'account',
    notificationType: 'followed',
  });
  const followRequestedToA = FollowRequestedNotification.new({
    id: generateDummyID<NotificationBase>(addDuration(baseDate, { days: 1 })),
    recipientID: accountA,
    createdAt: addDuration(baseDate, { days: 1 }),
    actorID: accountC,
    actorType: 'account',
    notificationType: 'followRequested',
  });
  const followedToB = FollowedNotification.new({
    id: generateDummyID<NotificationBase>(addDuration(baseDate, { days: 2 })),
    recipientID: accountB,
    createdAt: addDuration(baseDate, { days: 2 }),
    actorID: accountA,
    actorType: 'account',
    notificationType: 'followed',
  });

  const repo = new InMemoryNotificationRepository([
    followedToA,
    followRequestedToA,
    followedToB,
  ]);
  const service = new FetchNotificationService(repo);

  it('can fetch a single notification', async () => {
    const res = await service.fetchByID(followedToA.getID(), accountA);

    expect(Result.isOk(res)).toBeTruthy();
    expect(Result.unwrap(res)).toEqual(followedToA);
  });

  it("cannot fetch another person's notification", async () => {
    const res = await service.fetchByID(followedToA.getID(), accountB);

    expect(Result.isErr(res)).toBeTruthy();
    expect(Result.unwrapErr(res).message).toBe('not allowed');
  });

  it('can fetch multiple notifications', async () => {
    const res = await service.fetchByRecipientID(accountA, {
      cursor: Option.none(),
      limit: Option.none(),
    });

    expect(Result.isOk(res)).toBeTruthy();
    expect(Result.unwrap(res)).toEqual([followRequestedToA, followedToA]);
  });

  it("cannot fetch another person's notifications", async () => {
    const res = await service.fetchByRecipientID(accountA, {
      cursor: Option.none(),
      limit: Option.none(),
    });

    expect(Result.isOk(res)).toBeTruthy();
    expect(
      Result.unwrap(res)
        .map((v) => v.getRecipientID())
        .includes(accountB),
    ).toBeFalsy();
  });
});
