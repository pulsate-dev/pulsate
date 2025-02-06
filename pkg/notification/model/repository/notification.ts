import { Ether, type Option, type Result } from '@mikuroxina/mini-fn';
import type { NotificationBase, NotificationID } from '../notificationBase.js';

export interface NotificationFilter {
  /**
   * Maximum number of notifications to return
   *
   * NOTE:
   * - Default: 30
   * - Maximum: 50
   */
  limit: Option.Option<number>;
  /**
   * Cursor {@link NotificationCursor}
   *
   * NOTE:
   * - if not specified(Option.none()), it returns the number of notifications specified by *limit* from the last notification.
   */
  cursor: Option.Option<NotificationCursor>;
}

/**
 * Notification cursor
 *
 * NOTE:
 * ```
 * Old -> New
 * 1   2   3   4   5
 *         ^ before
 *        ←| returns 1,2 (specified notification is excluded)
 *
 * Old -> New
 * 1   2   3   4   5
 *         ^ after
 *         |→ returns 4,5 (specified notification is included)
 * ```
 */
export interface NotificationCursor {
  /**
   * Cursor type
   */
  type: 'before' | 'after';
  id: NotificationID;
}

export const NOTIFICATION_DEFAULT_LIMIT = 30;
export const NOTIFICATION_MAX_LIMIT = 50;

export interface NotificationRepository {
  /**
   * Create a notification
   */
  create(notification: NotificationBase): Promise<Result.Result<Error, void>>;
  /**
   * Find a notification by ID
   *
   * NOTE: Read notification is included.
   * @param id Notification ID
   */
  findByID(id: NotificationID): Promise<Result.Result<Error, NotificationBase>>;
  /**
   * Find notifications by recipient account ID
   *
   * NOTE: Read notification is included.
   * @param recipientID Recipient account ID
   * @param filter {@link NotificationFilter}
   */
  findByRecipientID(
    recipientID: string,
    filter: NotificationFilter,
  ): Promise<Result.Result<Error, NotificationBase[]>>;
  /**
   * Update only readAt.
   *
   * NOTE: If the notification is already read, it returns error.
   * @param notification Notification
   */
  updateReadAt(
    notification: NotificationBase,
  ): Promise<Result.Result<Error, void>>;
}
export const notificationRepoSymbol =
  Ether.newEtherSymbol<NotificationRepository>();
