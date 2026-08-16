import { Cat, Ether, Promise, Result } from '@mikuroxina/mini-fn';
import type { AccountID } from '../../accounts/model/account.ts';
import {
  type Clock,
  clockSymbol,
  type SnowflakeIDGenerator,
  snowflakeIDGeneratorSymbol,
} from '../../internal/id/mod.ts';
import type { NoteID } from '../../notes/model/note.ts';
import type { ReactionID } from '../../notes/model/reaction.ts';
import {
  FollowAcceptedNotification,
  FollowedNotification,
  FollowRequestedNotification,
  MentionedNotification,
  ReactedNotification,
  RenotedNotification,
} from '../model/notification.ts';
import type { NotificationBase } from '../model/notificationBase.ts';
import {
  type NotificationRepository,
  notificationRepoSymbol,
} from '../model/repository/notification.ts';

export class CreateNotificationService {
  readonly #idGenerator: SnowflakeIDGenerator;
  readonly #clock: Clock;
  readonly #notificationRepository: NotificationRepository;
  constructor(
    idGenerator: SnowflakeIDGenerator,
    clock: Clock,
    notificationRepository: NotificationRepository,
  ) {
    this.#idGenerator = idGenerator;
    this.#clock = clock;
    this.#notificationRepository = notificationRepository;
  }

  async createFollowed(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'id',
        Promise.resolve(this.#idGenerator.generate<NotificationBase>()),
      )
      .addWith('notification', ({ id }) =>
        FollowedNotification.new({
          id,
          notificationType: 'followed',
          recipientID: args.recipientID,
          actorID: args.actorID,
          actorType: 'account',
          createdAt: new Date(Number(this.#clock.now())),
        }),
      )
      .runWith(({ notification }) =>
        this.#notificationRepository
          .create(notification)
          .then(Result.map(() => [])),
      )
      .finish(() => undefined);
  }

  async createFollowRequested(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'id',
        Promise.resolve(this.#idGenerator.generate<NotificationBase>()),
      )
      .addWith('notification', ({ id }) =>
        FollowRequestedNotification.new({
          id,
          notificationType: 'followRequested',
          recipientID: args.recipientID,
          actorID: args.actorID,
          actorType: 'account',
          createdAt: new Date(Number(this.#clock.now())),
        }),
      )
      .runWith(({ notification }) =>
        this.#notificationRepository
          .create(notification)
          .then(Result.map(() => [])),
      )
      .finish(() => undefined);
  }

  async createFollowAccepted(args: {
    recipientID: AccountID;
    actorID: AccountID;
  }): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'id',
        Promise.resolve(this.#idGenerator.generate<NotificationBase>()),
      )
      .addWith('notification', ({ id }) =>
        FollowAcceptedNotification.new({
          id,
          notificationType: 'followAccepted',
          recipientID: args.recipientID,
          actorID: args.actorID,
          actorType: 'account',
          createdAt: new Date(Number(this.#clock.now())),
        }),
      )
      .runWith(({ notification }) =>
        this.#notificationRepository
          .create(notification)
          .then(Result.map(() => [])),
      )
      .finish(() => undefined);
  }

  async createMentioned(args: {
    recipientID: AccountID;
    actorID: AccountID;
    activityID: NoteID;
  }): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'id',
        Promise.resolve(this.#idGenerator.generate<NotificationBase>()),
      )
      .addWith('notification', ({ id }) =>
        MentionedNotification.new({
          id,
          notificationType: 'mentioned',
          recipientID: args.recipientID,
          actorID: args.actorID,
          actorType: 'account',
          activityID: args.activityID,
          createdAt: new Date(Number(this.#clock.now())),
        }),
      )
      .runWith(({ notification }) =>
        this.#notificationRepository
          .create(notification)
          .then(Result.map(() => [])),
      )
      .finish(() => undefined);
  }

  async createRenoted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: NoteID;
  }): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'id',
        Promise.resolve(this.#idGenerator.generate<NotificationBase>()),
      )
      .addWith('notification', ({ id }) =>
        RenotedNotification.new({
          id,
          notificationType: 'renoted',
          recipientID: args.recipientID,
          actorID: args.actorID,
          actorType: 'account',
          sourceID: args.sourceID,
          activityID: args.activityID,
          createdAt: new Date(Number(this.#clock.now())),
        }),
      )
      .runWith(({ notification }) =>
        this.#notificationRepository
          .create(notification)
          .then(Result.map(() => [])),
      )
      .finish(() => undefined);
  }

  async createReacted(args: {
    recipientID: AccountID;
    actorID: AccountID;
    sourceID: NoteID;
    activityID: ReactionID;
  }): Promise<Result.Result<Error, void>> {
    const monad = Promise.resultMonad<Error>();

    return Cat.doT(monad)
      .addM(
        'id',
        Promise.resolve(this.#idGenerator.generate<NotificationBase>()),
      )
      .addWith('notification', ({ id }) =>
        ReactedNotification.new({
          id,
          notificationType: 'reacted',
          recipientID: args.recipientID,
          actorID: args.actorID,
          actorType: 'account',
          sourceID: args.sourceID,
          activityID: args.activityID,
          createdAt: new Date(Number(this.#clock.now())),
        }),
      )
      .runWith(({ notification }) =>
        this.#notificationRepository
          .create(notification)
          .then(Result.map(() => [])),
      )
      .finish(() => undefined);
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
