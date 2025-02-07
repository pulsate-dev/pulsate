import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import { MockClock, SnowflakeIDGenerator } from '../../id/mod.js';
import type { NoteID } from '../../notes/model/note.js';
import type { ReactionID } from '../../notes/model/reaction.js';
import { InMemoryNotificationRepository } from '../adaptor/repository/dummy/notification.js';
import { CreateNotificationService } from './create.js';

describe('CreateNotificationService', () => {
  const notificationRepository = new InMemoryNotificationRepository();
  const clock = new MockClock(new Date('2023-09-10T00:00:00Z'));
  const idGenerator = new SnowflakeIDGenerator(1, clock);
  const createNotificationService = new CreateNotificationService(
    idGenerator,
    clock,
    notificationRepository,
  );
  it('should create followed Notification', async () => {
    const res = await createNotificationService.createFollowed({
      recipientID: '1' as AccountID,
      actorID: '2' as AccountID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create followRequested Notification', async () => {
    const res = await createNotificationService.createFollowRequested({
      recipientID: '1' as AccountID,
      actorID: '2' as AccountID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create followAccepted Notification', async () => {
    const res = await createNotificationService.createFollowAccepted({
      recipientID: '1' as AccountID,
      actorID: '2' as AccountID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create mentioned Notification', async () => {
    const res = await createNotificationService.createMentioned({
      recipientID: '1' as AccountID,
      actorID: '2' as AccountID,
      activityID: '3' as NoteID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create reacted Notification', async () => {
    const res = await createNotificationService.createReacted({
      recipientID: '1' as AccountID,
      actorID: '2' as AccountID,
      sourceID: '3' as NoteID,
      activityID: '4' as ReactionID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create renoted Notification', async () => {
    const res = await createNotificationService.createRenoted({
      recipientID: '1' as AccountID,
      actorID: '2' as AccountID,
      sourceID: '3' as NoteID,
      activityID: '4' as NoteID,
    });

    expect(Result.isOk(res)).toBe(true);
  });
});
