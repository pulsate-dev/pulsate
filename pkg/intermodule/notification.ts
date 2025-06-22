import { Cat, Ether } from '@mikuroxina/mini-fn';
import type { AccountID } from '../accounts/model/account.js';
import { isProduction } from '../adaptors/env.js';
import { prismaClient } from '../adaptors/prisma.js';
import { clockSymbol, snowflakeIDGenerator } from '../id/mod.js';
import type { NoteID } from '../notes/model/note.js';
import type { ReactionID } from '../notes/model/reaction.js';
import { InMemoryNotificationRepository } from '../notification/adaptor/repository/dummy/notification.js';
import { PrismaNotificationRepository } from '../notification/adaptor/repository/prisma/notification.js';
import { notificationRepoSymbol } from '../notification/model/repository/notification.js';
import {
  type CreateNotificationService,
  createNotificationService,
} from '../notification/service/create.js';

export class NotificationModuleFacade {
  constructor(private readonly createService: CreateNotificationService) {}

  async createFollowed(args: { recipientID: AccountID; actorID: AccountID }) {
    return await this.createService.createFollowed(args);
  }

  async createFollowRequested(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }) {
    return await this.createService.createFollowRequested(args);
  }

  async createAccepted(args: { recipientID: AccountID; actorID: AccountID }) {
    return await this.createService.createFollowAccepted(args);
  }

  async createMentioned(args: {
    recipientID: AccountID;
    actorID: AccountID;
    activityID: NoteID;
  }) {
    return await this.createService.createMentioned(args);
  }

  async createReacted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: ReactionID;
  }) {
    return await this.createService.createReacted(args);
  }

  async createRenoted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: NoteID;
  }) {
    return await this.createService.createRenoted(args);
  }
}

class Clock {
  now() {
    return BigInt(Date.now());
  }
}
const clock = Ether.newEther(clockSymbol, () => new Clock());
const idGenerator = Ether.compose(clock)(snowflakeIDGenerator(0));

const notificationRepoObject = isProduction
  ? new PrismaNotificationRepository(prismaClient)
  : new InMemoryNotificationRepository();
const notificationRepo = Ether.newEther(
  notificationRepoSymbol,
  () => notificationRepoObject,
);

export const notificationModuleFacadeSymbol =
  Ether.newEtherSymbol<NotificationModuleFacade>();

export const notificationModule = new NotificationModuleFacade(
  Ether.runEther(
    Cat.cat(createNotificationService)
      .feed(Ether.compose(notificationRepo))
      .feed(Ether.compose(idGenerator))
      .feed(Ether.compose(clock)).value,
  ),
);
