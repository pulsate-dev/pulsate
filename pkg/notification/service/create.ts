import { Ether, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.js';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../id/mod.js';
import type { NoteID } from '../../notes/model/note.js';
import type { ReactionID } from '../../notes/model/reaction.js';
import {
  FollowAcceptedNotification,
  FollowedNotification,
  FollowRequestedNotification,
  MentionedNotification,
  ReactedNotification,
  RenotedNotification,
} from '../model/notification.js';
import type { NotificationBase } from '../model/notificationBase.js';
import {
  type NotificationRepository,
  notificationRepoSymbol,
} from '../model/repository/notification.js';

export class CreateNotificationService {
  constructor(
    private readonly idGenerator: SnowflakeIDGenerator,
    private readonly clock: Clock,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async createFollowed(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const idRes = this.idGenerator.generate<NotificationBase>();
    if (Result.isErr(idRes)) {
      return idRes;
    }
    const id = Result.unwrap(idRes);

    const notification = FollowedNotification.new({
      id,
      notificationType: 'followed',
      recipientID: args.recipientID,
      actorID: args.actorID,
      actorType: 'account',
      createdAt: new Date(Number(this.clock.now())),
    });

    return await this.notificationRepository.create(notification);
  }

  async createFollowRequested(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const idRes = this.idGenerator.generate<NotificationBase>();
    if (Result.isErr(idRes)) {
      return idRes;
    }
    const id = Result.unwrap(idRes);

    const notification = FollowRequestedNotification.new({
      id,
      notificationType: 'followRequested',
      recipientID: args.recipientID,
      actorID: args.actorID,
      actorType: 'account',
      createdAt: new Date(Number(this.clock.now())),
    });

    return await this.notificationRepository.create(notification);
  }

  async createFollowAccepted(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const idRes = this.idGenerator.generate<NotificationBase>();
    if (Result.isErr(idRes)) {
      return idRes;
    }
    const id = Result.unwrap(idRes);

    const notification = FollowAcceptedNotification.new({
      id,
      notificationType: 'followAccepted',
      recipientID: args.recipientID,
      actorID: args.actorID,
      actorType: 'account',
      createdAt: new Date(Number(this.clock.now())),
    });

    return await this.notificationRepository.create(notification);
  }

  async createMentioned(args: {
    recipientID: AccountID;
    actorID: AccountID;
    activityID: NoteID;
  }): Promise<Result.Result<Error, void>> {
    const idRes = this.idGenerator.generate<NotificationBase>();
    if (Result.isErr(idRes)) {
      return idRes;
    }
    const id = Result.unwrap(idRes);

    const notification = MentionedNotification.new({
      id,
      notificationType: 'mentioned',
      recipientID: args.recipientID,
      actorID: args.actorID,
      actorType: 'account',
      activityID: args.activityID,
      createdAt: new Date(Number(this.clock.now())),
    });

    return await this.notificationRepository.create(notification);
  }

  async createRenoted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: NoteID;
  }): Promise<Result.Result<Error, void>> {
    const idRes = this.idGenerator.generate<NotificationBase>();
    if (Result.isErr(idRes)) {
      return idRes;
    }

    const id = Result.unwrap(idRes);

    const notification = RenotedNotification.new({
      id,
      notificationType: 'renoted',
      recipientID: args.recipientID,
      actorID: args.actorID,
      actorType: 'account',
      sourceID: args.sourceID,
      activityID: args.activityID,
      createdAt: new Date(Number(this.clock.now())),
    });

    return await this.notificationRepository.create(notification);
  }

  async createReacted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: ReactionID;
  }): Promise<Result.Result<Error, void>> {
    const idRes = this.idGenerator.generate<NotificationBase>();
    if (Result.isErr(idRes)) {
      return idRes;
    }

    const id = Result.unwrap(idRes);

    const notification = ReactedNotification.new({
      id,
      notificationType: 'reacted',
      recipientID: args.recipientID,
      actorID: args.actorID,
      actorType: 'account',
      sourceID: args.sourceID,
      activityID: args.activityID,
      createdAt: new Date(Number(this.clock.now())),
    });

    return await this.notificationRepository.create(notification);
  }
}
export const createNotificationSymbol =
  Ether.newEtherSymbol<CreateNotificationService>();
export const createNotificationService = Ether.newEther(
  createNotificationSymbol,
  ({ notificationRepository, idGenerator, clock }) =>
    new CreateNotificationService(idGenerator, clock, notificationRepository),
  {
    notificationRepository: notificationRepoSymbol,
    idGenerator: snowflakeIDGeneratorSymbol,
    clock: clockSymbol,
  },
);
