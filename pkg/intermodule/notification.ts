import { Cat, Ether } from '@mikuroxina/mini-fn';
import type { AccountID } from '../accounts/model/account.ts';
import { isProduction } from '../adaptors/env.ts';
import { prismaClient } from '../adaptors/prisma.ts';
import { clockSymbol, snowflakeIDGenerator } from '../internal/id/mod.ts';
import type { NoteID } from '../notes/model/note.ts';
import type { ReactionID } from '../notes/model/reaction.ts';
import { DummyEmailSender } from '../notification/adaptor/email/dummySender.ts';
import { SmtpEmailSender } from '../notification/adaptor/email/genericSender.ts';
import { InMemoryNotificationRepository } from '../notification/adaptor/repository/dummy/notification.ts';
import { PrismaNotificationRepository } from '../notification/adaptor/repository/prisma/notification.ts';
import { emailSenderSymbol } from '../notification/model/emailSender.ts';
import { notificationRepoSymbol } from '../notification/model/repository/notification.ts';
import {
  type CreateNotificationService,
  createNotificationService,
} from '../notification/service/create.ts';
import {
  type SendEmailNotificationService,
  sendEmailNotificationService,
} from '../notification/service/sendEmailNotification.ts';

export class NotificationModuleFacade {
  readonly #createService: CreateNotificationService;
  readonly #sendEmailNotificationService: SendEmailNotificationService;
  constructor(
    createService: CreateNotificationService,
    sendEmailNotificationService: SendEmailNotificationService,
  ) {
    this.#createService = createService;
    this.#sendEmailNotificationService = sendEmailNotificationService;
  }

  async createFollowed(args: { recipientID: AccountID; actorID: AccountID }) {
    return await this.#createService.createFollowed(args);
  }

  async createFollowRequested(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }) {
    return await this.#createService.createFollowRequested(args);
  }

  async createAccepted(args: { recipientID: AccountID; actorID: AccountID }) {
    return await this.#createService.createFollowAccepted(args);
  }

  async createMentioned(args: {
    recipientID: AccountID;
    actorID: AccountID;
    activityID: NoteID;
  }) {
    return await this.#createService.createMentioned(args);
  }

  async createReacted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: ReactionID;
  }) {
    return await this.#createService.createReacted(args);
  }

  async createRenoted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: NoteID;
  }) {
    return await this.#createService.createRenoted(args);
  }

  async sendEmailNotification(args: {
    to: string;
    subject: string;
    body: string;
  }) {
    return await this.#sendEmailNotificationService.handle(
      args.to,
      args.subject,
      args.body,
    );
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

const smtpConfig = {
  host: process.env.SMTP_HOST ?? '',
  port: Number(process.env.SMTP_PORT) || 587,
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  from: process.env.SMTP_FROM ?? '',
};

const emailSenderObject =
  isProduction || smtpConfig.host !== ''
    ? new SmtpEmailSender(smtpConfig)
    : new DummyEmailSender();
const emailSender = Ether.newEther(emailSenderSymbol, () => emailSenderObject);

export const notificationModuleFacadeSymbol =
  Ether.newEtherSymbol<NotificationModuleFacade>();

export const notificationModule = new NotificationModuleFacade(
  Ether.runEther(
    Cat.cat(createNotificationService)
      .feed(Ether.compose(notificationRepo))
      .feed(Ether.compose(idGenerator))
      .feed(Ether.compose(clock)).value,
  ),
  Ether.runEther(
    Cat.cat(sendEmailNotificationService).feed(Ether.compose(emailSender))
      .value,
  ),
);
