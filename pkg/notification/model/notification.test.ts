import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';

import type { Account } from '../../accounts/model/account.ts';
import { generateDummyID } from '../../internal/id/dummy.ts';
import type { Note } from '../../notes/model/note.ts';
import type { Reaction } from '../../notes/model/reaction.ts';
import {
  FollowAcceptedNotification,
  FollowedNotification,
  FollowRequestedNotification,
  MentionedNotification,
  ReactedNotification,
  RenotedNotification,
} from './notification.ts';
import type { NotificationBase } from './notificationBase.ts';

const notificationID = generateDummyID<NotificationBase>();
const recipientID = generateDummyID<Account>();
const actorID = generateDummyID<Account>();
const sourceID = generateDummyID<Note>();
const noteActivityID = generateDummyID<Note>();
const reactionActivityID = generateDummyID<Reaction>();

describe('Followed', () => {
  it('should create new instance', () => {
    const res = FollowedNotification.new({
      id: notificationID,
      notificationType: 'followed',
      recipientID: recipientID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: actorID,
    });
    expect(res.getID()).toBe(notificationID);
    expect(res.getNotificationType()).toBe('followed');
    expect(res.getRecipientID()).toBe(recipientID);
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe(actorID);
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
  });
});

describe('FollowRequested', () => {
  it('should create new instance', () => {
    const res = FollowRequestedNotification.new({
      id: notificationID,
      notificationType: 'followRequested',
      recipientID: recipientID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: actorID,
    });
    expect(res.getID()).toBe(notificationID);
    expect(res.getNotificationType()).toBe('followRequested');
    expect(res.getRecipientID()).toBe(recipientID);
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe(actorID);
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
  });
});

describe('FollowAccepted', () => {
  it('should create new instance', () => {
    const res = FollowAcceptedNotification.new({
      id: notificationID,
      notificationType: 'followAccepted',
      recipientID: recipientID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: actorID,
    });
    expect(res.getID()).toBe(notificationID);
    expect(res.getNotificationType()).toBe('followAccepted');
    expect(res.getRecipientID()).toBe(recipientID);
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe(actorID);
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
  });
});

describe('Mentioned', () => {
  it('should create new instance', () => {
    const res = MentionedNotification.new({
      id: notificationID,
      notificationType: 'mentioned',
      recipientID: recipientID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: actorID,
      activityID: noteActivityID,
    });
    expect(res.getID()).toBe(notificationID);
    expect(res.getNotificationType()).toBe('mentioned');
    expect(res.getRecipientID()).toBe(recipientID);
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe(actorID);
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
    expect(res.getActivityID()).toBe(noteActivityID);
  });
});

describe('Renoted', () => {
  it('should create new instance', () => {
    const res = RenotedNotification.new({
      id: notificationID,
      notificationType: 'renoted',
      recipientID: recipientID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: actorID,
      // NOTE: activity object is always generated *after* source object.
      sourceID: sourceID,
      activityID: noteActivityID,
    });
    expect(res.getID()).toBe(notificationID);
    expect(res.getNotificationType()).toBe('renoted');
    expect(res.getRecipientID()).toBe(recipientID);
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe(actorID);
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
    expect(res.getSourceID()).toBe(sourceID);
    expect(res.getActivityID()).toBe(noteActivityID);
  });
});

describe('Reacted', () => {
  it('should create new instance', () => {
    const res = ReactedNotification.new({
      id: notificationID,
      notificationType: 'reacted',
      recipientID: recipientID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: actorID,
      // NOTE: activity object is always generated *after* source object.
      sourceID: sourceID,
      activityID: reactionActivityID,
    });
    expect(res.getID()).toBe(notificationID);
    expect(res.getNotificationType()).toBe('reacted');
    expect(res.getRecipientID()).toBe(recipientID);
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe(actorID);
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
    expect(res.getSourceID()).toBe(sourceID);
    expect(res.getActivityID()).toBe(reactionActivityID);
  });
});
