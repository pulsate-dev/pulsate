import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import { type Clock, clockSymbol } from '../../internal/id/mod.ts';
import { resultPromiseMonad } from '../../internal/monad/mod.ts';
import type {
  Notification,
  NotificationID,
} from '../model/notificationBase.ts';
import {
  type NotificationRepository,
  notificationRepoSymbol,
} from '../model/repository/notification.ts';

export class MarkAsReadNotificationService {
  readonly #notificationRepository: NotificationRepository;
  readonly #clock: Clock;
  constructor(notificationRepository: NotificationRepository, clock: Clock) {
    this.#notificationRepository = notificationRepository;
    this.#clock = clock;
  }

  async handle(
    notificationID: NotificationID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, Notification>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'notification',
        this.#notificationRepository.findByID(notificationID),
      )
      .when(
        ({ notification }) => !this.isAllowed(notification, actorID),
        () => Promise.resolve(Result.err(new Error('Not allowed'))),
      )
      .runWith(({ notification }) =>
        Promise.resolve(
          notification.markAsRead(new Date(Number(this.#clock.now()))),
        ).then(Result.map(() => [])),
      )
      .runWith(({ notification }) =>
        this.#notificationRepository
          .updateReadAt(notification)
          .then(Result.map(() => [])),
      )
      .finish(({ notification }) => notification);
  }

  private isAllowed(notification: Notification, accountID: AccountID): boolean {
    return notification.getRecipientID() === accountID;
  }
}
export const markAsReadNotificationSymbol =
  Ether.newEtherSymbol<MarkAsReadNotificationService>();
export const markAsReadNotification = Ether.newEther(
  markAsReadNotificationSymbol,
  ({ notificationRepository, clock }) =>
    new MarkAsReadNotificationService(notificationRepository, clock),
  {
    notificationRepository: notificationRepoSymbol,
    clock: clockSymbol,
  },
);
