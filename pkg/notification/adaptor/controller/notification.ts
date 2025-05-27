import { Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../../accounts/model/account.js';
import type { NotificationID } from '../../model/notificationBase.js';
import type { MarkAsReadNotificationService } from '../../service/markAsRead.js';

export class NotificationController {
  private readonly markAsReadService: MarkAsReadNotificationService;

  constructor(args: {
    markAsReadService: MarkAsReadNotificationService;
  }) {
    this.markAsReadService = args.markAsReadService;
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
}
