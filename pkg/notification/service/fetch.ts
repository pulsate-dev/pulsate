import { Ether, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type {
  Notification,
  NotificationID,
} from '../model/notificationBase.js';
import {
  type NotificationFilter,
  type NotificationRepository,
  notificationRepoSymbol,
} from '../model/repository/notification.js';

export class FetchNotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async fetchByID(
    id: NotificationID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, Notification>> {
    const res = await this.notificationRepository.findByID(id);
    if (Result.isErr(res)) {
      return res;
    }
    if (!this.isAllowed(Result.unwrap(res), actorID)) {
      return Result.err(new Error('not allowed'));
    }

    return res;
  }

  async fetchByRecipientID(
    recipientID: AccountID,
    filter: NotificationFilter,
  ): Promise<Result.Result<Error, Notification[]>> {
    const res = await this.notificationRepository.findByRecipientID(
      recipientID,
      filter,
    );
    if (Result.isErr(res)) {
      return res;
    }

    for (const v of Result.unwrap(res)) {
      if (!this.isAllowed(v, recipientID)) {
        return Result.err(new Error('not allowed'));
      }
    }

    return res;
  }

  private isAllowed(notification: Notification, actorID: AccountID): boolean {
    return notification.getRecipientID() === actorID;
  }
}
export const fetchNotificationSymbol =
  Ether.newEtherSymbol<FetchNotificationService>();
export const fetchNotification = Ether.newEther(
  fetchNotificationSymbol,
  ({ notificationRepository }) =>
    new FetchNotificationService(notificationRepository),
  {
    notificationRepository: notificationRepoSymbol,
  },
);
