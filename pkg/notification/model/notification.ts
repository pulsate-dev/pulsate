import { Option } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { ID } from '../../id/type.js';

export type NotificationID = ID<Notification>;
export type NotificationType =
  | 'followed'
  | 'followRequested'
  | 'followAccepted'
  | 'mentioned'
  | 'renoted'
  | 'reacted';
export type NotificationActorType = 'account' | 'system';

export interface CreateNotificationArgs {
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
   * Read Status
   */
  isRead: boolean;
  /**
   * Read At
   */
  readAt: Option.Option<Date>;
}

export class Notification {
  private readonly id: NotificationID;
  private readonly notificationType: NotificationType;
  private readonly recipientID: AccountID;
  private readonly createdAt: Date;
  private readonly actorType: NotificationActorType;
  private readonly actorID: AccountID;

  private isRead: boolean;
  private readAt: Option.Option<Date>;

  private constructor(args: CreateNotificationArgs) {
    this.id = args.id;
    this.recipientID = args.recipientID;
    this.notificationType = args.notificationType;
    this.actorType = args.actorType;
    this.actorID = args.actorID;
    this.createdAt = args.createdAt;

    this.isRead = args.isRead;
    this.readAt = args.readAt;
  }

  static new(args: Omit<CreateNotificationArgs, 'isRead' | 'readAt'>) {
    return new Notification({
      ...args,
      isRead: false,
      readAt: Option.none(),
    });
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
    return this.isRead;
  }

  /**
   * Set read status to true(read)
   */
  setRead() {
    this.isRead = true;
    this.readAt = Option.some(new Date());
  }

  /**
   * Get date when the notification was read
   */
  getReadAt(): Option.Option<Date> {
    return this.readAt;
  }
}
