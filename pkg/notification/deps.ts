import { Cat, Ether } from '@mikuroxina/mini-fn';

import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import { accountModuleEther } from '../intermodule/account.ts';
import { clockSymbol } from '../internal/id/mod.ts';
import { NotificationController } from './adaptor/controller/notification.ts';
import { inMemoryNotificationRepo } from './adaptor/repository/dummy/notification.ts';
import { prismaNotificationRepo } from './adaptor/repository/prisma/notification.ts';
import { fetchNotification } from './service/fetch.ts';
import { markAsReadNotification } from './service/markAsRead.ts';

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const clock = Ether.newEther(clockSymbol, () => new Clock());

const notificationRepository = isProduction
  ? prismaNotificationRepo(prismaClient)
  : inMemoryNotificationRepo();

export const notificationController = new NotificationController({
  markAsReadService: Ether.runEther(
    Cat.cat(markAsReadNotification)
      .feed(Ether.compose(notificationRepository))
      .feed(Ether.compose(clock)).value,
  ),
  accountModule: Ether.runEther(Cat.cat(accountModuleEther).value),
  fetchNotificationService: Ether.runEther(
    Cat.cat(fetchNotification).feed(Ether.compose(notificationRepository))
      .value,
  ),
});
