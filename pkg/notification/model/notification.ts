import { Option } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { NoteID } from '../../notes/model/note.js';
import type { ReactionID } from '../../notes/model/reaction.js';
import {
  type CreateNotificationBaseArgs,
  type Notification,
  type NotificationActorType,
  NotificationBase,
  type NotificationID,
  type NotificationType,
} from './notificationBase.js';

export interface CreateFollowedNotificationArgs
  extends CreateNotificationBaseArgs {
  notificationType: 'followed';
}
export class FollowedNotification implements Notification {
  private readonly notificationBase: NotificationBase;

  private constructor(args: CreateFollowedNotificationArgs) {
    this.notificationBase = new NotificationBase(args);
  }

  static new(args: Omit<CreateFollowedNotificationArgs, 'isRead' | 'readAt'>) {
    return new FollowedNotification({ ...args, readAt: Option.none() });
  }
  static reconstruct(args: CreateFollowedNotificationArgs) {
    return new FollowedNotification(args);
  }

  getActorID(): AccountID {
    return this.notificationBase.getActorID();
  }

  getActorType(): NotificationActorType {
    return this.notificationBase.getActorType();
  }

  getCreatedAt(): Date {
    return this.notificationBase.getCreatedAt();
  }

  getID(): NotificationID {
    return this.notificationBase.getID();
  }

  getIsRead(): boolean {
    return this.notificationBase.getIsRead();
  }

  getNotificationType(): NotificationType {
    return this.notificationBase.getNotificationType();
  }

  getReadAt(): Option.Option<Date> {
    return this.notificationBase.getReadAt();
  }

  getRecipientID(): AccountID {
    return this.notificationBase.getRecipientID();
  }

  setRead(date: Date): void {
    this.notificationBase.setRead(date);
  }
}

export interface CreateFollowRequestedNotificationArgs
  extends CreateNotificationBaseArgs {
  notificationType: 'followRequested';
}
export class FollowRequestedNotification implements Notification {
  private readonly notificationBase: NotificationBase;

  private constructor(args: CreateFollowRequestedNotificationArgs) {
    this.notificationBase = new NotificationBase(args);
  }

  static new(
    args: Omit<CreateFollowRequestedNotificationArgs, 'isRead' | 'readAt'>,
  ) {
    return new FollowRequestedNotification({ ...args, readAt: Option.none() });
  }
  static reconstruct(args: CreateFollowRequestedNotificationArgs) {
    return new FollowRequestedNotification(args);
  }

  getActorID(): AccountID {
    return this.notificationBase.getActorID();
  }

  getActorType(): NotificationActorType {
    return this.notificationBase.getActorType();
  }

  getCreatedAt(): Date {
    return this.notificationBase.getCreatedAt();
  }

  getID(): NotificationID {
    return this.notificationBase.getID();
  }

  getIsRead(): boolean {
    return this.notificationBase.getIsRead();
  }

  getNotificationType(): NotificationType {
    return this.notificationBase.getNotificationType();
  }

  getReadAt(): Option.Option<Date> {
    return this.notificationBase.getReadAt();
  }

  getRecipientID(): AccountID {
    return this.notificationBase.getRecipientID();
  }

  setRead(date: Date): void {
    this.notificationBase.setRead(date);
  }
}

export interface CreateFollowAcceptedNotificationArgs
  extends CreateNotificationBaseArgs {
  notificationType: 'followAccepted';
}
export class FollowAcceptedNotification implements Notification {
  private readonly notificationBase: NotificationBase;

  private constructor(args: CreateFollowAcceptedNotificationArgs) {
    this.notificationBase = new NotificationBase(args);
  }

  static new(
    args: Omit<CreateFollowAcceptedNotificationArgs, 'isRead' | 'readAt'>,
  ) {
    return new FollowAcceptedNotification({ ...args, readAt: Option.none() });
  }
  static reconstruct(args: CreateFollowAcceptedNotificationArgs) {
    return new FollowAcceptedNotification(args);
  }

  getActorID(): AccountID {
    return this.notificationBase.getActorID();
  }

  getActorType(): NotificationActorType {
    return this.notificationBase.getActorType();
  }

  getCreatedAt(): Date {
    return this.notificationBase.getCreatedAt();
  }

  getID(): NotificationID {
    return this.notificationBase.getID();
  }

  getIsRead(): boolean {
    return this.notificationBase.getIsRead();
  }

  getNotificationType(): NotificationType {
    return this.notificationBase.getNotificationType();
  }

  getReadAt(): Option.Option<Date> {
    return this.notificationBase.getReadAt();
  }

  getRecipientID(): AccountID {
    return this.notificationBase.getRecipientID();
  }

  setRead(date: Date): void {
    this.notificationBase.setRead(date);
  }
}

export interface CreateMentionedNotificationArgs
  extends CreateNotificationBaseArgs {
  notificationType: 'mentioned';
  activityID: NoteID;
}
export class MentionedNotification implements Notification {
  private readonly notificationBase: NotificationBase;
  private readonly activityID: NoteID;

  private constructor(args: CreateMentionedNotificationArgs) {
    this.notificationBase = new NotificationBase(args);
    this.activityID = args.activityID;
  }

  static new(args: Omit<CreateMentionedNotificationArgs, 'isRead' | 'readAt'>) {
    return new MentionedNotification({ ...args, readAt: Option.none() });
  }
  static reconstruct(args: CreateMentionedNotificationArgs) {
    return new MentionedNotification(args);
  }

  getActorID(): AccountID {
    return this.notificationBase.getActorID();
  }

  getActorType(): NotificationActorType {
    return this.notificationBase.getActorType();
  }

  getCreatedAt(): Date {
    return this.notificationBase.getCreatedAt();
  }

  getID(): NotificationID {
    return this.notificationBase.getID();
  }

  getIsRead(): boolean {
    return this.notificationBase.getIsRead();
  }

  getNotificationType(): NotificationType {
    return this.notificationBase.getNotificationType();
  }

  getReadAt(): Option.Option<Date> {
    return this.notificationBase.getReadAt();
  }

  getRecipientID(): AccountID {
    return this.notificationBase.getRecipientID();
  }

  setRead(date: Date): void {
    this.notificationBase.setRead(date);
  }

  /**
   * Get Activity ID
   * @description
   * ActivityID is the object resulting from the operation on Source.
   *
   * e.g.
   * - notification type  "followed", ActivityID is null (no objects are generated when followed)
   * - notification type  "reacted", ActivityID is ReactionID (Reaction is the object generated by the operation)
   */
  getActivityID(): NoteID {
    return this.activityID;
  }
}

export interface CreateRenotedNotificationArgs
  extends CreateNotificationBaseArgs {
  notificationType: 'renoted';
  sourceID: NoteID;
  activityID: NoteID;
}
export class RenotedNotification implements Notification {
  private readonly notificationBase: NotificationBase;
  private readonly activityID: NoteID;
  private readonly sourceID: NoteID;

  private constructor(args: CreateRenotedNotificationArgs) {
    this.notificationBase = new NotificationBase(args);
    this.activityID = args.activityID;
    this.sourceID = args.sourceID;
  }

  static new(args: Omit<CreateRenotedNotificationArgs, 'isRead' | 'readAt'>) {
    return new RenotedNotification({ ...args, readAt: Option.none() });
  }

  static reconstruct(args: CreateRenotedNotificationArgs) {
    return new RenotedNotification(args);
  }

  getActorID(): AccountID {
    return this.notificationBase.getActorID();
  }

  getActorType(): NotificationActorType {
    return this.notificationBase.getActorType();
  }

  getCreatedAt(): Date {
    return this.notificationBase.getCreatedAt();
  }

  getID(): NotificationID {
    return this.notificationBase.getID();
  }

  getIsRead(): boolean {
    return this.notificationBase.getIsRead();
  }

  getNotificationType(): NotificationType {
    return this.notificationBase.getNotificationType();
  }

  getReadAt(): Option.Option<Date> {
    return this.notificationBase.getReadAt();
  }

  getRecipientID(): AccountID {
    return this.notificationBase.getRecipientID();
  }

  setRead(date: Date): void {
    this.notificationBase.setRead(date);
  }

  /**
   * Get Source ID
   * @description
   * SourceID is the target of the Activity
   *
   * e.g.
   * - notification type is "followed", SourceID is null (Source is Account, but it's already known by recipient)
   * - notification type is "reacted", SourceID is NoteID
   */
  getSourceID(): NoteID {
    return this.sourceID;
  }

  /**
   * Get Activity ID
   * @description
   * ActivityID is the object resulting from the operation on Source.
   *
   * e.g.
   * - notification type  "followed", ActivityID is null (no objects are generated when followed)
   * - notification type  "reacted", ActivityID is ReactionID (Reaction is the object generated by the operation)
   */
  getActivityID(): NoteID {
    return this.activityID;
  }
}

export interface CreateReactedNotificationArgs
  extends CreateNotificationBaseArgs {
  notificationType: 'reacted';
  sourceID: NoteID;
  activityID: ReactionID;
}
export class ReactedNotification implements Notification {
  private readonly notificationBase: NotificationBase;
  private readonly activityID: ReactionID;
  private readonly sourceID: NoteID;

  private constructor(args: CreateReactedNotificationArgs) {
    this.notificationBase = new NotificationBase(args);
    this.activityID = args.activityID;
    this.sourceID = args.sourceID;
  }

  static new(args: Omit<CreateReactedNotificationArgs, 'isRead' | 'readAt'>) {
    return new ReactedNotification({ ...args, readAt: Option.none() });
  }
  static reconstruct(args: CreateReactedNotificationArgs) {
    return new ReactedNotification(args);
  }

  getActorID(): AccountID {
    return this.notificationBase.getActorID();
  }

  getActorType(): NotificationActorType {
    return this.notificationBase.getActorType();
  }

  getCreatedAt(): Date {
    return this.notificationBase.getCreatedAt();
  }

  getID(): NotificationID {
    return this.notificationBase.getID();
  }

  getIsRead(): boolean {
    return this.notificationBase.getIsRead();
  }

  getNotificationType(): NotificationType {
    return this.notificationBase.getNotificationType();
  }

  getReadAt(): Option.Option<Date> {
    return this.notificationBase.getReadAt();
  }

  getRecipientID(): AccountID {
    return this.notificationBase.getRecipientID();
  }

  setRead(date: Date): void {
    this.notificationBase.setRead(date);
  }

  /**
   * Get Source ID
   * @description
   * SourceID is the target of the Activity
   *
   * e.g.
   * - notification type is "followed", SourceID is null (Source is Account, but it's already known by recipient)
   * - notification type is "reacted", SourceID is NoteID
   */
  getSourceID(): NoteID {
    return this.sourceID;
  }

  /**
   * Get Activity ID
   * @description
   * ActivityID is the object resulting from the operation on Source.
   *
   * e.g.
   * - notification type  "followed", ActivityID is null (no objects are generated when followed)
   * - notification type  "reacted", ActivityID is ReactionID (Reaction is the object generated by the operation)
   */
  getActivityID(): ReactionID {
    return this.activityID;
  }
}
