import type { Result } from '@mikuroxina/mini-fn';
import type { Notification, NotificationID } from '../notification.js';

export interface NotificationRepository {
  /**
   * Create a notification
   */
  create(notification: Notification): Promise<Result.Result<Error, void>>;
  /**
   * Find a notification by ID
   *
   * NOTE: Read notification is included.
   * @param id Notification ID
   */
  findByID(id: NotificationID): Promise<Result.Result<Error, Notification>>;
  /**
   * Find notifications by recipient account ID
   *
   * NOTE: Read notification is included.
   * @param recipientID Recipient account ID
   */
  findByRecipientID(
    recipientID: string,
  ): Promise<Result.Result<Error, Notification[]>>;
  /**
   * Update only readAt.
   *
   * NOTE: If the notification is already read, it returns error.
   * @param id Notification ID
   * @param readAt When the notification was read
   */
  updateReadAt(notification: Notification): Promise<Result.Result<Error, void>>;
}
