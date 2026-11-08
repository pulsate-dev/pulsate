import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import { MockClock, SnowflakeIDGenerator } from '../../internal/id/mod.ts';
import type { Note } from '../../notes/model/note.ts';
import type { Reaction } from '../../notes/model/reaction.ts';
import { InMemoryNotificationRepository } from '../adaptor/repository/dummy/notification.ts';
import { CreateNotificationService } from './create.ts';

describe('CreateNotificationService', () => {
  const notificationRepository = new InMemoryNotificationRepository();
  const clock = new MockClock(new Date('2023-09-10T00:00:00Z'));
  const idGenerator = new SnowflakeIDGenerator(1, clock);
  const createNotificationService = new CreateNotificationService(
    idGenerator,
    clock,
    notificationRepository,
  );
  const recipientID = generateDummyID<Account>();
  const actorID = generateDummyID<Account>();
  const sourceID = generateDummyID<Note>();
  const noteActivityID = generateDummyID<Note>();
  const reactionActivityID = generateDummyID<Reaction>();

  it('should create followed Notification', async () => {
    const res = await createNotificationService.createFollowed({
      recipientID: recipientID,
      actorID: actorID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create followRequested Notification', async () => {
    const res = await createNotificationService.createFollowRequested({
      recipientID: recipientID,
      actorID: actorID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create followAccepted Notification', async () => {
    const res = await createNotificationService.createFollowAccepted({
      recipientID: recipientID,
      actorID: actorID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create mentioned Notification', async () => {
    const res = await createNotificationService.createMentioned({
      recipientID: recipientID,
      actorID: actorID,
      activityID: noteActivityID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create reacted Notification', async () => {
    const res = await createNotificationService.createReacted({
      recipientID: recipientID,
      actorID: actorID,
      sourceID,
      activityID: reactionActivityID,
    });

    expect(Result.isOk(res)).toBe(true);
  });

  it('should create renoted Notification', async () => {
    const res = await createNotificationService.createRenoted({
      recipientID: recipientID,
      actorID: actorID,
      sourceID,
      activityID: noteActivityID,
    });

    expect(Result.isOk(res)).toBe(true);
  });
});
