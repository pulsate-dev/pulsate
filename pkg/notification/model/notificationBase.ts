import { Option } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';

export type NotificationID = ID<NotificationBase>;
export type NotificationType =
  | 'followed'
  | 'followRequested'
  | 'followAccepted'
  | 'mentioned'
  | 'renoted'
  | 'reacted';

export type NotificationActorType = 'account' | 'system';

export interface CreateNotificationBaseArgs {
  /**
   * Notification ID
   */
  id: NotificationID;
  /**
   * Recipient account ID
   */
  recipientID: AccountID;
  /**
   * Notification Type
   * @description
   * - followed: Followed
   * - followRequested: Follow requested
   * - followAccepted: Follow accepted
   * - mentioned: Mentioned
   * - renoted: Renoted
   * - reacted: Reacted
   */
  notificationType: NotificationType;

  /**
   * Actor(who did the notified action) Type
   * @description
   * - account: Account
   * - system: System
   */
  actorType: NotificationActorType;
  /**
   * Actor account ID
   */
  actorID: AccountID;
  /**
   * Created At
   */
  createdAt: Date;
  /**
   * Read At
   */
  readAt: Option.Option<Date>;
}

export interface Notification {
  getID(): NotificationID;
  getRecipientID(): AccountID;
  getNotificationType(): NotificationType;
  getCreatedAt(): Date;
  getActorType(): NotificationActorType;
  getActorID(): AccountID;
  getIsRead(): boolean;
  setRead(date: Date): void;
  getReadAt(): Option.Option<Date>;
}

export class NotificationBase {
  private readonly id: NotificationID;
  private readonly notificationType: NotificationType;
  private readonly recipientID: AccountID;
  private readonly createdAt: Date;
  private readonly actorType: NotificationActorType;
  private readonly actorID: AccountID;

  private readAt: Option.Option<Date>;

  constructor(args: CreateNotificationBaseArgs) {
    this.id = args.id;
    this.recipientID = args.recipientID;
    this.notificationType = args.notificationType;
    this.actorType = args.actorType;
    this.actorID = args.actorID;
    this.createdAt = args.createdAt;
    this.readAt = args.readAt;
  }

  /**
   * Get Notification ID
   * @example
   * ```
   * "349875930483"
   * ```
   */
  getID(): NotificationID {
    return this.id;
  }

  /**
   * Get recipient account ID
   */
  getRecipientID(): AccountID {
    return this.recipientID;
  }

  /**
   * Get Notification Type
   * @description
   * - followed: Followed
   * - followRequested: Follow requested
   * - followAccepted: Follow accepted
   * - mentioned: Mentioned
   * - renoted: Renoted
   * - reacted: Reacted
   */
  getNotificationType(): NotificationType {
    return this.notificationType;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Get Actor(who did the notified action) Type
   * @description
   * - account: Account
   * - system: System
   */
  getActorType(): NotificationActorType {
    return this.actorType;
  }

  /**
   * Get Actor account ID
   */
  getActorID(): AccountID {
    return this.actorID;
  }

  /**
   * Get Read Status
   */
  getIsRead(): boolean {
    return Option.isSome(this.readAt);
  }

  /**
   * Set time when message read
   *
   * NOTE: Once a message has been read, it cannot be marked as unread.
   */
  setRead(date: Date) {
    this.readAt = Option.some(date);
  }

  /**
   * Get date when the notification was read
   */
  getReadAt(): Option.Option<Date> {
    return this.readAt;
  }
}
