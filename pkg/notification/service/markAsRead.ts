import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import { type Clock, clockSymbol } from '../../internal/id/mod.js';
import { resultPromiseMonad } from '../../internal/monad/mod.js';
import type {
  Notification,
  NotificationID,
} from '../model/notificationBase.js';
import {
  type NotificationRepository,
  notificationRepoSymbol,
} from '../model/repository/notification.js';

export class MarkAsReadNotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  async handle(
    notificationID: NotificationID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, Notification>> {
    const monad = resultPromiseMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'notification',
        this.notificationRepository.findByID(notificationID),
      )
      .when(
        ({ notification }) => !this.isAllowed(notification, actorID),
        () => Promise.resolve(Result.err(new Error('Not allowed'))),
      )
      .runWith(({ notification }) =>
        Promise.resolve(
          notification.markAsRead(new Date(Number(this.clock.now()))),
        ).then(Result.map(() => [])),
      )
      .runWith(({ notification }) =>
        this.notificationRepository
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
