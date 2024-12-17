import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type {
  Notification,
  NotificationID,
} from '../../../model/notification.js';
import {
  NOTIFICATION_DEFAULT_LIMIT,
  NOTIFICATION_MAX_LIMIT,
  type NotificationFilter,
  type NotificationRepository,
  notificationRepoSymbol,
} from '../../../model/repository/notification.js';

export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly data: Map<NotificationID, Notification>;

  constructor(data: Notification[] = []) {
    this.data = new Map(
      data.map((notification) => [notification.getID(), notification]),
    );
  }

  async create(
    notification: Notification,
  ): Promise<Result.Result<Error, void>> {
    this.data.set(notification.getID(), notification);
    return Result.ok(undefined);
  }

  async findByID(
    id: NotificationID,
  ): Promise<Result.Result<Error, Notification>> {
    const res = this.data.get(id);
    if (!res) {
      return Result.err(new Error('notification not found'));
    }
    return Result.ok(res);
  }

  async findByRecipientID(
    recipientID: string,
    filter: NotificationFilter,
  ): Promise<Result.Result<Error, Notification[]>> {
    const res = [...this.data.values()].filter(
      (notification) => notification.getRecipientID() === recipientID,
    );

    res.sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());

    const limit = Option.isSome(filter.limit)
      ? Option.unwrap(filter.limit)
      : NOTIFICATION_DEFAULT_LIMIT;
    if (limit > NOTIFICATION_MAX_LIMIT) {
      // ToDo: Define NotificationCursorLimitOutOfRangeError
      return Result.err(new Error('Limit exceeds the maximum value'));
    }

    // if cursor is not specified, return the latest n notifications
    if (Option.isNone(filter.cursor)) {
      return Result.ok(res.slice(0, limit));
    }

    const cursor = Option.unwrap(filter.cursor);

    switch (cursor.type) {
      case 'after': {
        const afterIndex = res
          .reverse()
          .findIndex((n) => n.getID() === cursor.id);
        return Result.ok(
          res.slice(afterIndex + 1, afterIndex + limit).reverse(),
        );
      }
      case 'before': {
        return (() => {
          const beforeIndex = res.findIndex((n) => n.getID() === cursor.id);
          return Result.ok(res.slice(beforeIndex + 1, beforeIndex + 1 + limit));
        })();
      }
    }
  }

  async updateReadAt(
    notification: Notification,
  ): Promise<Result.Result<Error, void>> {
    const target = this.data.get(notification.getID());
    if (!target) {
      return Result.err(new Error('notification not found'));
    }

    if (target.getCreatedAt() !== notification.getCreatedAt()) {
      return Result.err(new Error('notification already read'));
    }
    if (!target.getIsRead()) {
      return Result.err(new Error('notification not read yet'));
    }

    this.data.set(notification.getID(), notification);
    return Result.ok(undefined);
  }
}
export const inMemoryNotificationRepo = (data?: Notification[]) =>
  Ether.newEther(
    notificationRepoSymbol,
    () => new InMemoryNotificationRepository(data),
  );
