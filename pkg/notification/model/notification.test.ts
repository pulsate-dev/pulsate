import { Option } from '@mikuroxina/mini-fn';
import { describe, expect, it } from 'vitest';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from '../../notes/model/note.js';
import type { ReactionID } from '../../notes/model/reaction.js';
import {
  FollowAcceptedNotification,
  FollowedNotification,
  FollowRequestedNotification,
  MentionedNotification,
  ReactedNotification,
  RenotedNotification,
} from './notification.js';
import type { NotificationID } from './notificationBase.js';

describe('Followed', () => {
  it('should create new instance', () => {
    const res = FollowedNotification.new({
      id: '1' as NotificationID,
      notificationType: 'followed',
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: '20' as AccountID,
    });
    expect(res.getID()).toBe('1');
    expect(res.getNotificationType()).toBe('followed');
    expect(res.getRecipientID()).toBe('10');
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe('20');
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
  });
});

describe('FollowRequested', () => {
  it('should create new instance', () => {
    const res = FollowRequestedNotification.new({
      id: '1' as NotificationID,
      notificationType: 'followRequested',
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: '20' as AccountID,
    });
    expect(res.getID()).toBe('1');
    expect(res.getNotificationType()).toBe('followRequested');
    expect(res.getRecipientID()).toBe('10');
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe('20');
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
  });
});

describe('FollowAccepted', () => {
  it('should create new instance', () => {
    const res = FollowAcceptedNotification.new({
      id: '1' as NotificationID,
      notificationType: 'followAccepted',
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: '20' as AccountID,
    });
    expect(res.getID()).toBe('1');
    expect(res.getNotificationType()).toBe('followAccepted');
    expect(res.getRecipientID()).toBe('10');
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe('20');
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
  });
});

describe('Mentioned', () => {
  it('should create new instance', () => {
    const res = MentionedNotification.new({
      id: '1' as NotificationID,
      notificationType: 'mentioned',
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: '20' as AccountID,
      activityID: '1001' as NoteID,
    });
    expect(res.getID()).toBe('1');
    expect(res.getNotificationType()).toBe('mentioned');
    expect(res.getRecipientID()).toBe('10');
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe('20');
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
    expect(res.getActivityID()).toBe('1001');
  });
});

describe('Renoted', () => {
  it('should create new instance', () => {
    const res = RenotedNotification.new({
      id: '1' as NotificationID,
      notificationType: 'renoted',
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: '20' as AccountID,
      // NOTE: activity object is always generated *after* source object.
      sourceID: '1000' as NoteID,
      activityID: '1001' as NoteID,
    });
    expect(res.getID()).toBe('1');
    expect(res.getNotificationType()).toBe('renoted');
    expect(res.getRecipientID()).toBe('10');
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe('20');
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
    expect(res.getSourceID()).toBe('1000');
    expect(res.getActivityID()).toBe('1001');
  });
});

describe('Reacted', () => {
  it('should create new instance', () => {
    const res = ReactedNotification.new({
      id: '1' as NotificationID,
      notificationType: 'reacted',
      recipientID: '10' as AccountID,
      createdAt: new Date('2023-09-10T00:00:00.000Z'),
      actorType: 'account',
      actorID: '20' as AccountID,
      // NOTE: activity object is always generated *after* source object.
      sourceID: '1000' as NoteID,
      activityID: '1001' as ReactionID,
    });
    expect(res.getID()).toBe('1');
    expect(res.getNotificationType()).toBe('reacted');
    expect(res.getRecipientID()).toBe('10');
    expect(res.getCreatedAt()).toStrictEqual(
      new Date('2023-09-10T00:00:00.000Z'),
    );
    expect(res.getActorType()).toBe('account');
    expect(res.getActorID()).toBe('20');
    expect(res.getIsRead()).toBe(false);
    expect(res.getReadAt()).toStrictEqual(Option.none());
    expect(res.getSourceID()).toBe('1000');
    expect(res.getActivityID()).toBe('1001');
  });
});
