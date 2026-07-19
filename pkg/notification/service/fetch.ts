import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
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
  readonly #notificationRepository: NotificationRepository;
  constructor(notificationRepository: NotificationRepository) {
    this.#notificationRepository = notificationRepository;
  }

  async fetchByID(
    id: NotificationID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, Notification>> {
    const monad = resultPromiseMonad<Error>();
    const notAllowed = () => new Error('not allowed');

    return Cat.doT(monad)
      .addM('notification', this.#notificationRepository.findByID(id))
      .when(
        ({ notification }) => !this.isAllowed(notification, actorID),
        () => Promise.resolve(Result.err(notAllowed())),
      )
      .finish(({ notification }) => notification);
  }

  async fetchByRecipientID(
    recipientID: AccountID,
    filter: NotificationFilter,
  ): Promise<Result.Result<Error, Notification[]>> {
    const monad = resultPromiseMonad<Error>();
    const notAllowed = () => new Error('not allowed');

    return Cat.doT(monad)
      .addM(
        'notifications',
        this.#notificationRepository.findByRecipientID(recipientID, filter),
      )
      .when(
        ({ notifications }) =>
          !notifications.every((v) => this.isAllowed(v, recipientID)),
        () => Promise.resolve(Result.err(notAllowed())),
      )
      .finish(({ notifications }) => notifications);
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
