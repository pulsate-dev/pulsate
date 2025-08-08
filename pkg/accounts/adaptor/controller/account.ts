import type { z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { Medium, MediumID } from '../../../drive/model/medium.js';
import type { AccountID, AccountName } from '../../model/account.js';
import type { AccountFollow } from '../../model/follow.js';
import type { AccountFollowCount } from '../../model/repository.js';
import type { AuthenticateService } from '../../service/authenticate.js';
import type {
  AuthenticationToken,
  AuthenticationTokenService,
} from '../../service/authenticationTokenService.js';
import type { AccountAvatarService } from '../../service/avatar.js';
import type { EditService } from '../../service/edit.js';
import type { FetchService } from '../../service/fetch.js';
import type { FetchFollowService } from '../../service/fetchFollow.js';
import type { FollowService } from '../../service/follow.js';
import type { FreezeService } from '../../service/freeze.js';
import type { AccountHeaderService } from '../../service/header.js';
import type { RegisterService } from '../../service/register.js';
import type { FetchRelationshipService } from '../../service/relationships.js';
import type { ResendVerifyTokenService } from '../../service/resendToken.js';
import type { SilenceService } from '../../service/silence.js';
import type { UnfollowService } from '../../service/unfollow.js';
import type { VerifyAccountTokenService } from '../../service/verifyToken.js';
import type {
  CreateAccountResponseSchema,
  GetAccountFollowerSchema,
  GetAccountFollowingSchema,
  GetAccountRelationshipsResponseSchema,
  GetAccountResponseSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  UpdateAccountResponseSchema,
} from '../validator/schema.js';

export class AccountController {
  private readonly registerService: RegisterService;
  private readonly editService: EditService;
  private readonly fetchService: FetchService;
  private readonly freezeService: FreezeService;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;
  private readonly authenticateService: AuthenticateService;
  private readonly silenceService: SilenceService;
  private readonly followService: FollowService;
  private readonly unFollowService: UnfollowService;
  private readonly fetchFollowService: FetchFollowService;
  private readonly resendTokenService: ResendVerifyTokenService;
  private readonly headerService: AccountHeaderService;
  private readonly avatarService: AccountAvatarService;
  private readonly authenticationTokenService: AuthenticationTokenService;
  private readonly fetchRelationshipService: FetchRelationshipService;

  constructor(args: {
    registerService: RegisterService;
    editService: EditService;
    fetchService: FetchService;
    freezeService: FreezeService;
    verifyAccountTokenService: VerifyAccountTokenService;
    authenticateService: AuthenticateService;
    silenceService: SilenceService;
    followService: FollowService;
    unFollowService: UnfollowService;
    fetchFollowService: FetchFollowService;
    resendTokenService: ResendVerifyTokenService;
    headerService: AccountHeaderService;
    avatarService: AccountAvatarService;
    authenticationTokenService: AuthenticationTokenService;
    fetchRelationshipService: FetchRelationshipService;
  }) {
    this.registerService = args.registerService;
    this.editService = args.editService;
    this.fetchService = args.fetchService;
    this.freezeService = args.freezeService;
    this.verifyAccountTokenService = args.verifyAccountTokenService;
    this.authenticateService = args.authenticateService;
    this.silenceService = args.silenceService;
    this.followService = args.followService;
    this.unFollowService = args.unFollowService;
    this.fetchFollowService = args.fetchFollowService;
    this.resendTokenService = args.resendTokenService;
    this.headerService = args.headerService;
    this.avatarService = args.avatarService;
    this.authenticationTokenService = args.authenticationTokenService;
    this.fetchRelationshipService = args.fetchRelationshipService;
  }

  async createAccount(
    name: string,
    email: string,
    passphrase: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof CreateAccountResponseSchema>>
  > {
    const res = await this.registerService.handle(
      name as AccountName,
      email,
      '',
      passphrase,
      '',
      'normal',
    );

    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      id: res[1].getID(),
      name: res[1].getName(),
      email: res[1].getMail(),
    });
  }

  async updateAccount(
    target: string,
    args: {
      nickname?: string;
      email?: string;
      passphrase?: string;
      bio: string;
    },
    etag: string,
    actorName: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof UpdateAccountResponseSchema>>
  > {
    if (args.nickname) {
      const res = await this.editService.editNickname(
        etag,
        target as AccountName,
        args.nickname,
        actorName as AccountName,
      );
      if (Result.isErr(res)) {
        return res;
      }
    }
    if (args.passphrase) {
      const res = await this.editService.editPassphrase(
        etag,
        target as AccountName,
        args.passphrase,
        actorName as AccountName,
      );
      if (Result.isErr(res)) {
        return res;
      }
    }
    if (args.email) {
      const res = await this.editService.editEmail(
        etag,
        target as AccountName,
        args.email,
        actorName as AccountName,
      );
      if (Result.isErr(res)) {
        return res;
      }
    }

    const editedBioResp = await this.editService.editBio(
      etag,
      target as AccountName,
      args.bio,
      actorName as AccountName,
    );
    if (Result.isErr(editedBioResp)) {
      return Result.err(editedBioResp[1]);
    }

    const res = await this.fetchService.fetchAccount(target as AccountName);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      id: res[1].getID(),
      email: res[1].getMail(),
      name: res[1].getName() as string,
      nickname: res[1].getNickname(),
      bio: res[1].getBio(),
    });
  }

  async freezeAccount(
    target: string,
    actor: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.freezeService.setFreeze(
      target as AccountName,
      actor as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async unFreezeAccount(
    name: string,
    actor: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.freezeService.undoFreeze(
      name as AccountName,
      actor as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async verifyEmail(
    name: string,
    token: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.verifyAccountTokenService.verify(
      name as AccountName,
      token,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async getAccount(
    id: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetAccountResponseSchema>>> {
    const res = await this.fetchService.fetchAccountByID(id as AccountID);
    if (Result.isErr(res)) {
      return res;
    }
    const account = Result.unwrap(res);

    const avatarRes = await this.avatarService.fetchByAccountID(
      account.getID(),
    );
    const headerRes = await this.headerService.fetchByAccountID(
      account.getID(),
    );
    const avatar = Result.mapOr('')((avatarImage: Medium): string =>
      avatarImage.getUrl(),
    )(avatarRes);
    const header = Result.mapOr('')((headerImage: Medium): string =>
      headerImage.getUrl(),
    )(headerRes);
    const followCountRes = await this.fetchFollowService.fetchFollowCount(
      account.getID(),
    );
    const followingCount = Result.mapOr(0)(
      (v: AccountFollowCount) => v.following,
    )(followCountRes);
    const followersCount = Result.mapOr(0)(
      (v: AccountFollowCount) => v.followers,
    )(followCountRes);

    return Result.ok({
      id: account.getID(),
      email: account.getMail(),
      name: account.getName() as string,
      nickname: account.getNickname(),
      bio: account.getBio(),
      // ToDo: fill the following fields
      avatar,
      header,
      followed_count: followersCount,
      following_count: followingCount,
      note_count: 0,
      created_at: account.getCreatedAt(),
      role: account.getRole(),
      frozen: account.getFrozen(),
      status: account.getStatus(),
      silenced: account.getSilenced(),
    });
  }

  async getAccountByName(
    name: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetAccountResponseSchema>>> {
    const res = await this.fetchService.fetchAccount(name as AccountName);
    if (Result.isErr(res)) {
      return res;
    }
    const account = Result.unwrap(res);

    const avatarRes = await this.avatarService.fetchByAccountID(
      account.getID(),
    );
    const headerRes = await this.headerService.fetchByAccountID(
      account.getID(),
    );
    const avatar = Result.mapOr('')((avatarImage: Medium): string =>
      avatarImage.getUrl(),
    )(avatarRes);
    const header = Result.mapOr('')((headerImage: Medium): string =>
      headerImage.getUrl(),
    )(headerRes);
    const followCountRes = await this.fetchFollowService.fetchFollowCount(
      account.getID(),
    );
    const followingCount = Result.mapOr(0)(
      (v: AccountFollowCount) => v.following,
    )(followCountRes);
    const followersCount = Result.mapOr(0)(
      (v: AccountFollowCount) => v.followers,
    )(followCountRes);

    return Result.ok({
      id: account.getID(),
      email: account.getMail(),
      name: account.getName() as string,
      nickname: account.getNickname(),
      bio: account.getBio(),
      avatar,
      header,
      followed_count: followersCount,
      following_count: followingCount,
      // ToDo: fill the following fields
      note_count: 0,
      created_at: account.getCreatedAt(),
      role: account.getRole(),
      frozen: account.getFrozen(),
      status: account.getStatus(),
      silenced: account.getSilenced(),
    });
  }

  async login(
    name: string,
    passphrase: string,
  ): Promise<Result.Result<Error, z.infer<typeof LoginResponseSchema>>> {
    const res = await this.authenticateService.handle(
      name as AccountName,
      passphrase,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      authorization_token: Result.unwrap(res),
    });
  }

  async refresh(
    token: string,
  ): Promise<Result.Result<Error, z.infer<typeof RefreshResponseSchema>>> {
    const res = await this.authenticationTokenService.renewAuthToken(
      token as AuthenticationToken,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      authorization_token: Result.unwrap(res),
    });
  }

  async silenceAccount(
    targetName: string,
    actorName: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.silenceService.setSilence(
      targetName as AccountName,
      actorName as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async unSilenceAccount(
    targetName: string,
    actorName: string,
  ): Promise<Result.Result<Error, void>> {
    // ToDo: check user's permission
    const res = await this.silenceService.undoSilence(
      targetName as AccountName,
      actorName as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async followAccount(
    fromName: string,
    targetName: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.followService.handle(
      fromName as AccountName,
      targetName as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async unFollowAccount(
    fromName: string,
    targetName: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.unFollowService.handle(
      fromName as AccountName,
      targetName as AccountName,
    );

    if (Option.isSome(res)) {
      return Result.err(res[1]);
    }

    return Result.ok(undefined);
  }

  async resendVerificationEmail(
    name: string,
  ): Promise<Result.Result<Error, void>> {
    const res = await this.resendTokenService.handle(name as AccountName);
    if (Option.isSome(res)) {
      return Result.err(res[1]);
    }

    return Result.ok(undefined);
  }

  async fetchFollowing(
    id: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetAccountFollowingSchema>>> {
    const followings = Result.map((v: AccountFollow[]) =>
      v.map((v) => v.getTargetID()),
    )(await this.fetchFollowService.fetchFollowingsByID(id as AccountID));

    if (Result.isErr(followings)) {
      return followings;
    }

    const accountsRes = await this.fetchService.fetchManyAccountsByID(
      Result.unwrap(followings),
    );
    if (Result.isErr(accountsRes)) {
      return accountsRes;
    }
    const accounts = Result.unwrap(accountsRes);

    // Note: remove duplicated accounts
    const accountIDs = new Set(accounts.map((v) => v.getID()));
    // [header,avatar]
    const headerAvatarImages = new Map<AccountID, [string, string]>();
    const followCounts = new Map<AccountID, AccountFollowCount>();

    for (const id of accountIDs) {
      const avatarRes = await this.avatarService.fetchByAccountID(id);
      const avatar = Result.mapOr('')((avatarImage: Medium): string =>
        avatarImage.getUrl(),
      )(avatarRes);
      const headerRes = await this.headerService.fetchByAccountID(id);
      const header = Result.mapOr('')((headerImage: Medium): string =>
        headerImage.getUrl(),
      )(headerRes);
      headerAvatarImages.set(id, [header, avatar]);

      const followCountRes = await this.fetchFollowService.fetchFollowCount(id);
      const followingCount = Result.mapOr(0)(
        (v: AccountFollowCount) => v.following,
      )(followCountRes);
      const followersCount = Result.mapOr(0)(
        (v: AccountFollowCount) => v.followers,
      )(followCountRes);

      followCounts.set(id, {
        followers: followersCount,
        following: followingCount,
      });
    }

    return Result.ok(
      accounts.map((v) => {
        const [header, avatar] = headerAvatarImages.get(v.getID()) ?? ['', ''];
        const { following, followers } = followCounts.get(v.getID()) ?? {
          followers: 0,
          following: 0,
        };
        return {
          id: v.getID(),
          email: v.getMail(),
          name: v.getName(),
          nickname: v.getNickname(),
          bio: v.getBio(),
          avatar,
          header,
          followed_count: followers,
          following_count: following,
          // ToDo: fill note_count
          note_count: 0,
          created_at: v.getCreatedAt(),
          role: v.getRole(),
          frozen: v.getFrozen(),
          status: v.getStatus(),
          silenced: v.getSilenced(),
        };
      }),
    );
  }

  async fetchFollower(
    id: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetAccountFollowerSchema>>> {
    const followers = Result.map((v: AccountFollow[]) =>
      v.map((v) => v.getFromID()),
    )(await this.fetchFollowService.fetchFollowersByID(id as AccountID));

    if (Result.isErr(followers)) {
      return followers;
    }

    const accountsRes = await this.fetchService.fetchManyAccountsByID(
      Result.unwrap(followers),
    );
    if (Result.isErr(accountsRes)) {
      return accountsRes;
    }
    const accounts = Result.unwrap(accountsRes);
    // Note: remove duplicated accounts
    const accountIDs = new Set(accounts.map((v) => v.getID()));
    // [header,avatar]
    const headerAvatarImages = new Map<AccountID, [string, string]>();
    const followCounts = new Map<AccountID, AccountFollowCount>();

    for (const id of accountIDs) {
      const avatarRes = await this.avatarService.fetchByAccountID(id);
      const avatar = Result.mapOr('')((avatarImage: Medium): string =>
        avatarImage.getUrl(),
      )(avatarRes);
      const headerRes = await this.headerService.fetchByAccountID(id);
      const header = Result.mapOr('')((headerImage: Medium): string =>
        headerImage.getUrl(),
      )(headerRes);
      headerAvatarImages.set(id, [header, avatar]);

      const followCountRes = await this.fetchFollowService.fetchFollowCount(id);
      const followingCount = Result.mapOr(0)(
        (v: AccountFollowCount) => v.following,
      )(followCountRes);
      const followersCount = Result.mapOr(0)(
        (v: AccountFollowCount) => v.followers,
      )(followCountRes);

      followCounts.set(id, {
        followers: followersCount,
        following: followingCount,
      });
    }

    return Result.ok(
      accounts.map((v) => {
        const [header, avatar] = headerAvatarImages.get(v.getID()) ?? ['', ''];
        const { following, followers } = followCounts.get(v.getID()) ?? {
          followers: 0,
          following: 0,
        };
        return {
          id: v.getID(),
          email: v.getMail(),
          name: v.getName(),
          nickname: v.getNickname(),
          bio: v.getBio(),
          avatar,
          header,
          followed_count: followers,
          following_count: following,
          // ToDo: fill note_count
          note_count: 0,
          created_at: v.getCreatedAt(),
          role: v.getRole(),
          frozen: v.getFrozen(),
          status: v.getStatus(),
          silenced: v.getSilenced(),
        };
      }),
    );
  }

  async setAvatar(
    targetAccountName: string,
    actorID: string,
    medium: string,
  ): Promise<Result.Result<Error, void>> {
    const accountRes = await this.fetchService.fetchAccount(
      targetAccountName as AccountName,
    );
    if (Result.isErr(accountRes)) {
      return accountRes;
    }
    const account = Result.unwrap(accountRes);

    return await this.avatarService.create(
      account.getID(),
      medium as MediumID,
      actorID as AccountID,
    );
  }

  async setHeader(
    targetAccountName: string,
    actorID: string,
    medium: string,
  ): Promise<Result.Result<Error, void>> {
    const accountRes = await this.fetchService.fetchAccount(
      targetAccountName as AccountName,
    );
    if (Result.isErr(accountRes)) {
      return accountRes;
    }
    const account = Result.unwrap(accountRes);

    return await this.headerService.create(
      account.getID(),
      medium as MediumID,
      actorID as AccountID,
    );
  }

  async unsetAvatar(
    targetAccountName: string,
    actorID: string,
  ): Promise<Result.Result<Error, void>> {
    const accountRes = await this.fetchService.fetchAccount(
      targetAccountName as AccountName,
    );
    if (Result.isErr(accountRes)) {
      return accountRes;
    }
    const account = Result.unwrap(accountRes);

    return await this.avatarService.delete(
      account.getID(),
      actorID as AccountID,
    );
  }

  async unsetHeader(
    targetAccountName: string,
    actorID: string,
  ): Promise<Result.Result<Error, void>> {
    const accountRes = await this.fetchService.fetchAccount(
      targetAccountName as AccountID,
    );
    if (Result.isErr(accountRes)) {
      return accountRes;
    }
    const account = Result.unwrap(accountRes);

    return await this.headerService.delete(
      account.getID(),
      actorID as AccountID,
    );
  }

  async verifyAuthToken(token: string): Promise<Result.Result<Error, void>> {
    return this.authenticationTokenService.verify(token);
  }

  async getAccountRelationships(
    targetAccountID: string,
    fromAccountID: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof GetAccountRelationshipsResponseSchema>>
  > {
    const relationships =
      await this.fetchRelationshipService.checkRelationships(
        targetAccountID as AccountID,
        fromAccountID as AccountID,
      );

    if (Result.isErr(relationships)) {
      return relationships;
    }

    const relationshipsData = Result.unwrap(relationships);
    return Result.ok({
      id: relationshipsData.id,
      is_followed: relationshipsData.is_followed,
      is_following: relationshipsData.is_following,
      is_follow_requesting: relationshipsData.is_follow_requesting,
    });
  }
}
