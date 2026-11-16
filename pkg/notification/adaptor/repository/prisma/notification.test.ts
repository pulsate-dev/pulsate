import { Result } from '@mikuroxina/mini-fn';
import { describe, expect, it, vi } from 'vitest';
import type { Account } from '../../../../accounts/model/account.ts';
import type { PrismaClient } from '../../../../adaptors/prisma/client.ts';
import { generateDummyID } from '../../../../internal/id/dummy.ts';
import type { Note } from '../../../../notes/model/note.ts';
import type { Reaction } from '../../../../notes/model/reaction.ts';
import {
  FollowAcceptedNotification,
  FollowedNotification,
  FollowRequestedNotification,
  MentionedNotification,
  ReactedNotification,
  RenotedNotification,
} from '../../../model/notification.ts';
import type { NotificationBase } from '../../../model/notificationBase.ts';
import { PrismaNotificationRepository } from './notification.ts';

describe('PrismaNotificationRepository', () => {
  const baseArgs = {
    id: generateDummyID<NotificationBase>(),
    recipientID: generateDummyID<Account>(),
    actorID: generateDummyID<Account>(),
    actorType: 'account' as const,
    createdAt: new Date('2026-11-16T00:00:00Z'),
  };
  const sourceID = generateDummyID<Note>();
  const noteActivityID = generateDummyID<Note>();
  const reactionActivityID = generateDummyID<Reaction>();

  it.each([
    {
      type: 'followed',
      notification: FollowedNotification.new({
        ...baseArgs,
        notificationType: 'followed',
      }),
      notificationType: 1,
      sourceID: '',
      activityID: '',
    },
    {
      type: 'followRequested',
      notification: FollowRequestedNotification.new({
        ...baseArgs,
        notificationType: 'followRequested',
      }),
      notificationType: 2,
      sourceID: '',
      activityID: '',
    },
    {
      type: 'followAccepted',
      notification: FollowAcceptedNotification.new({
        ...baseArgs,
        notificationType: 'followAccepted',
      }),
      notificationType: 3,
      sourceID: '',
      activityID: '',
    },
    {
      type: 'mentioned',
      notification: MentionedNotification.new({
        ...baseArgs,
        notificationType: 'mentioned',
        activityID: noteActivityID,
      }),
      notificationType: 4,
      sourceID: '',
      activityID: noteActivityID,
    },
    {
      type: 'renoted',
      notification: RenotedNotification.new({
        ...baseArgs,
        notificationType: 'renoted',
        sourceID,
        activityID: noteActivityID,
      }),
      notificationType: 5,
      sourceID,
      activityID: noteActivityID,
    },
    {
      type: 'reacted',
      notification: ReactedNotification.new({
        ...baseArgs,
        notificationType: 'reacted',
        sourceID,
        activityID: reactionActivityID,
      }),
      notificationType: 6,
      sourceID,
      activityID: reactionActivityID,
    },
  ])(
    'create: persists the IDs required by $type notifications',
    async ({ notification, notificationType, sourceID, activityID }) => {
      const create = vi.fn().mockResolvedValue({});
      const prisma = { notification: { create } } as unknown as PrismaClient;
      const repository = new PrismaNotificationRepository(prisma);

      const actual = await repository.create(notification);

      expect(Result.isOk(actual)).toBe(true);
      expect(create).toHaveBeenCalledExactlyOnceWith({
        data: {
          id: baseArgs.id,
          recipient: { connect: { id: baseArgs.recipientID } },
          notificationType,
          actorType: baseArgs.actorType,
          actor: { connect: { id: baseArgs.actorID } },
          sourceID,
          activityID,
          createdAt: baseArgs.createdAt,
          readAt: null,
        },
      });
    },
  );
});
