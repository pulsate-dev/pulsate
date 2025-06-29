import type { z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';
import type { Account, AccountID } from '../../../accounts/model/account.js';
import type { AccountModuleFacade } from '../../../intermodule/account.js';
import type {
  MentionedNotification,
  ReactedNotification,
  RenotedNotification,
} from '../../model/notification.js';
import type {
  Notification,
  NotificationID,
} from '../../model/notificationBase.js';
import type { NotificationCursor } from '../../model/repository/notification.js';
import type { FetchNotificationService } from '../../service/fetch.js';
import type { MarkAsReadNotificationService } from '../../service/markAsRead.js';
import type {
  GetNotificationsResponseSchema,
  notificationBaseSchema,
  notificationSchema,
} from '../validator/schemas.js';

export class NotificationController {
  private readonly markAsReadService: MarkAsReadNotificationService;
  private readonly fetchNotificationService: FetchNotificationService;
  private readonly accountModule: AccountModuleFacade;

  constructor(args: {
    markAsReadService: MarkAsReadNotificationService;
    fetchNotificationService: FetchNotificationService;
    accountModule: AccountModuleFacade;
  }) {
    this.markAsReadService = args.markAsReadService;
    this.fetchNotificationService = args.fetchNotificationService;
    this.accountModule = args.accountModule;
  }

  async markAsRead(
    id: string,
    actorID: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.markAsReadService.handle(
      id as NotificationID,
      actorID as AccountID,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async fetchNotifications(
    actorID: string,
    limit?: number,
    afterID?: string,
    beforeID?: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetNotificationsResponseSchema>>
  > {
    if (!!afterID && !!beforeID) {
      return Result.err(
        new Error('Cannot specify both after_id and before_id'),
      );
    }

    const notificationsRes =
      await this.fetchNotificationService.fetchByRecipientID(
        actorID as AccountID,
        {
          limit: !limit ? Option.none() : Option.some(limit),
          cursor: ((): Option.Option<NotificationCursor> => {
            if (!afterID && !beforeID) {
              return Option.none();
            }

            if (afterID) {
              return Option.some({
                type: 'after',
                id: afterID as NotificationID,
              });
            }

            return Option.some({
              type: 'before',
              id: beforeID as NotificationID,
            });
          })(),
        },
      );
    if (Result.isErr(notificationsRes)) {
      return notificationsRes;
    }
    const notifications = Result.unwrap(notificationsRes);

    const accountsRes = await this.accountModule.fetchAccounts(
      notifications.map((v) => v.getActorID()),
    );
    if (Result.isErr(accountsRes)) {
      return accountsRes;
    }
    const accounts = new Map(
      Result.unwrap(accountsRes).map((v) => [v.getID(), v]),
    );

    const avatarRes = await this.accountModule.fetchAccountAvatarHeaders(
      notifications.map((v) => v.getActorID()),
    );
    if (Result.isErr(avatarRes)) {
      return avatarRes;
    }
    const avatars = Result.unwrap(avatarRes);

    return Result.ok(
      notifications.map((v) =>
        this.serializeNotification(v, accounts, avatars),
      ),
    );
  }

  private serializeNotification(
    notification: Notification,
    accounts: Map<AccountID, Account>,
    avatars: Map<AccountID, { avatarURL: string }>,
  ): z.infer<typeof notificationSchema> {
    const baseFactory = (): z.infer<typeof notificationBaseSchema> => {
      const account = accounts.get(notification.getActorID());
      const avatar = avatars.get(notification.getActorID());
      if (!account) {
        throw new Error(
          'Account not found for notification actor ID: ' +
            notification.getActorID(),
        );
      }

      return {
        id: notification.getID(),
        actor: {
          type: notification.getActorType(),
          id: notification.getActorID(),
          name: account.getName(),
          nickname: account.getNickname(),
          avatar: avatar ? avatar.avatarURL : '',
        },
        createdAt: notification.getCreatedAt().toISOString(),
      };
    };

    // NOTE: cf. https://github.com/pulsate-dev/pulsate/issues/935
    switch (notification.getNotificationType()) {
      case 'followAccepted':
        return { type: 'followAccepted', ...baseFactory() };
      case 'followRequested':
        return { type: 'followRequested', ...baseFactory() };
      case 'followed':
        return { type: 'followed', ...baseFactory() };
      case 'mentioned': {
        const mentioned = notification as MentionedNotification;
        return {
          type: 'mentioned',
          noteId: mentioned.getActivityID(),
          ...baseFactory(),
        };
      }
      case 'reacted': {
        const reacted = notification as ReactedNotification;
        return {
          type: 'reacted',
          noteId: reacted.getActivityID(),
          // ToDo: リアクションを取得する
          content: '',
          ...baseFactory(),
        };
      }
      case 'renoted': {
        const renoted = notification as RenotedNotification;
        return {
          type: 'renoted',
          noteId: renoted.getActivityID(),
          ...baseFactory(),
        };
      }
    }
  }
}
