import { Option, Result } from '@mikuroxina/mini-fn';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { AccountID } from '../../../../accounts/model/account.js';
import {
  Notification,
  type NotificationActorType,
  type NotificationID,
  type NotificationType,
} from '../../../model/notification.js';
import type {
  NotificationFilter,
  NotificationRepository,
} from '../../../model/repository/notification.js';

export class PrismaNotificationRepository implements NotificationRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  serialize(notification: Notification): Prisma.NotificationCreateInput {
    return {
      id: notification.getID(),
      recipient: {
        connect: {
          id: notification.getRecipientID(),
        },
      },
      /**
       * NOTE:
       * - 0 is reserved.
       * - followed -> 1
       * - followRequested -> 2
       * - followAccepted -> 3
       * - mentioned -> 4
       * - renoted ->  5
       * - reacted ->  6
       */
      notificationType: ((notificationType: NotificationType): number => {
        switch (notificationType) {
          case 'followed':
            return 1;
          case 'followRequested':
            return 2;
          case 'followAccepted':
            return 3;
          case 'mentioned':
            return 4;
          case 'renoted':
            return 5;
          case 'reacted':
            return 6;
        }
      })(notification.getNotificationType()),
      actorType: notification.getActorType(),
      actor: {
        connect: {
          id: notification.getActorID(),
        },
      },
      createdAt: notification.getCreatedAt(),
      readAt: null,
    };
  }

  serializeFilter(filter: NotificationFilter): Prisma.NotificationFindManyArgs {
    const orderBy = () => {
      if (Option.isNone(filter.cursor)) {
        // default: desc
        return 'desc';
      }
      const cursor = Option.unwrap(filter.cursor);
      if (cursor.type === 'before') {
        return 'desc';
      }

      return 'asc';
    };
    const cursor = () => {
      if (Option.isNone(filter.cursor)) {
        return undefined;
      }
      const cursor = Option.unwrap(filter.cursor);
      if (cursor.type === 'before') {
        return {
          cursor: {
            id: cursor.id,
          },
          skip: 1,
        };
      }

      return {
        cursor: {
          id: cursor.id,
        },
        skip: 1,
      };
    };

    return {
      orderBy: {
        // デフォルト: desc, afterIDが指定されている場合はasc
        createdAt: orderBy(),
      },
      ...cursor(),
      take: 30,
    };
  }

  deserialize(
    notification: Prisma.PromiseReturnType<
      typeof this.prisma.notification.findUnique
    >,
  ): Result.Result<Error, Notification> {
    if (!notification) {
      // ToDo: Define NotificationNotFoundError
      return Result.err(new Error('Notification not found'));
    }

    return Result.ok(
      Notification.reconstruct({
        id: notification.id as NotificationID,
        recipientID: notification.recipientID as AccountID,
        notificationType: ((notificationType: number): NotificationType => {
          switch (notificationType) {
            case 1:
              return 'followed';
            case 2:
              return 'followRequested';
            case 3:
              return 'followAccepted';
            case 4:
              return 'mentioned';
            case 5:
              return 'renoted';
            case 6:
              return 'reacted';
            default:
              throw new Error('Invalid notification type');
          }
        })(notification.notificationType),
        actorType: notification.actorType as NotificationActorType,
        actorID: notification.actorID as AccountID,
        createdAt: notification.createdAt,
        readAt: notification.readAt
          ? Option.some(notification.readAt)
          : Option.none(),
      }),
    );
  }

  async create(
    notification: Notification,
  ): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.notification.create({
        data: this.serialize(notification),
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async findByID(
    id: NotificationID,
  ): Promise<Result.Result<Error, Notification>> {
    try {
      const res = await this.prisma.notification.findUnique({
        where: {
          id: id,
        },
      });
      return this.deserialize(res);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }
  async findByRecipientID(
    recipientID: string,
    filter: NotificationFilter,
  ): Promise<Result.Result<Error, Notification[]>> {
    try {
      const res = await this.prisma.notification.findMany({
        where: {
          recipientID: recipientID,
        },
        ...this.serializeFilter(filter),
      });

      const notificationsRes = res.map((n) => this.deserialize(n));
      const notifications = notificationsRes
        .filter(Result.isOk)
        .map(Result.unwrap);

      if (notificationsRes.length !== notifications.length) {
        return Result.err(new Error('Failed to deserialize'));
      }

      return Result.ok(notifications);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }

  async updateReadAt(
    notification: Notification,
  ): Promise<Result.Result<Error, void>> {
    try {
      if (Option.isNone(notification.getReadAt())) {
        // ToDo: Define NotificationReadAtNotSetError
        return Result.err(new Error('ReadAt is not set'));
      }

      await this.prisma.notification.update({
        where: {
          id: notification.getID(),
        },
        data: {
          readAt: Option.unwrap(notification.getReadAt()),
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as unknown as Error);
    }
  }
}
