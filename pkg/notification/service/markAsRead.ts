import { Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import type { Clock } from '../../id/mod.js';
import type {
  Notification,
  NotificationID,
} from '../model/notificationBase.js';
import type { NotificationRepository } from '../model/repository/notification.js';

export class MarkAsReadNotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  async handle(
    notificationID: NotificationID,
    actorID: AccountID,
  ): Promise<Result.Result<Error, Notification>> {
    const notificationRes =
      await this.notificationRepository.findByID(notificationID);
    if (Result.isErr(notificationRes)) {
      return notificationRes;
    }

    const notification = Result.unwrap(notificationRes);

    if (!this.isAllowed(notification, actorID)) {
      return Result.err(new Error('Not allowed'));
    }

    if (notification.getIsRead()) {
      return Result.err(new Error('Notification already read'));
    }

    notification.setRead(new Date(Number(this.clock.now())));

    const res = await this.notificationRepository.updateReadAt(notification);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(notification);
  }

  private isAllowed(notification: Notification, accountID: AccountID): boolean {
    return notification.getRecipientID() === accountID;
  }
}
