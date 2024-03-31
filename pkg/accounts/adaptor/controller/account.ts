import { type z } from '@hono/zod-openapi';
import { Option, Result } from '@mikuroxina/mini-fn';

import type { ID } from '../../../id/type.js';
import { type AccountID, type AccountName } from '../../model/account.js';
import type { AuthenticateAccountService } from '../../service/authenticateAccount.js';
import type { EditAccountService } from '../../service/editAccount.js';
import type { FetchAccountService } from '../../service/fetchAccount.js';
import type { FollowAccountService } from '../../service/followAccount.js';
import type { FreezeAccountService } from '../../service/freezeAccount.js';
import type { RegisterAccountService } from '../../service/registerAccount.js';
import type { ResendVerifyTokenService } from '../../service/resendToken.js';
import type { SilenceAccountService } from '../../service/silenceAccount.js';
import { type UnfollowAccountService } from '../../service/unfollowAccount.js';
import type { VerifyAccountTokenService } from '../../service/verifyAccountToken.js';
import {
  type CreateAccountResponseSchema,
  type GetAccountResponseSchema,
  type LoginResponseSchema,
  type UpdateAccountResponseSchema,
} from '../validator/schema.js';

export class AccountController {
  private readonly registerAccountService: RegisterAccountService;
  private readonly editAccountService: EditAccountService;
  private readonly fetchAccountService: FetchAccountService;
  private readonly freezeAccountService: FreezeAccountService;
  private readonly verifyAccountTokenService: VerifyAccountTokenService;
  private readonly authenticateAccountService: AuthenticateAccountService;
  private readonly silenceAccountService: SilenceAccountService;
  private readonly followAccountService: FollowAccountService;
  private readonly unfollowAccountService: UnfollowAccountService;
  private readonly resendTokenService: ResendVerifyTokenService;

  constructor(args: {
    registerAccountService: RegisterAccountService;
    editAccountService: EditAccountService;
    fetchAccountService: FetchAccountService;
    freezeAccountService: FreezeAccountService;
    verifyAccountTokenService: VerifyAccountTokenService;
    authenticateAccountService: AuthenticateAccountService;
    silenceAccountService: SilenceAccountService;
    followAccountService: FollowAccountService;
    unfollowAccountService: UnfollowAccountService;
    resendTokenService: ResendVerifyTokenService;
  }) {
    this.registerAccountService = args.registerAccountService;
    this.editAccountService = args.editAccountService;
    this.fetchAccountService = args.fetchAccountService;
    this.freezeAccountService = args.freezeAccountService;
    this.verifyAccountTokenService = args.verifyAccountTokenService;
    this.authenticateAccountService = args.authenticateAccountService;
    this.silenceAccountService = args.silenceAccountService;
    this.followAccountService = args.followAccountService;
    this.unfollowAccountService = args.unfollowAccountService;
    this.resendTokenService = args.resendTokenService;
  }

  async createAccount(
    name: string,
    email: string,
    passphrase: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof CreateAccountResponseSchema>>
  > {
    const res = await this.registerAccountService.handle(
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
    name: string,
    args: {
      nickname?: string;
      email?: string;
      passphrase?: string;
      bio: string;
    },
    etag: string,
  ): Promise<
    Result.Result<Error, z.infer<typeof UpdateAccountResponseSchema>>
  > {
    if (args.nickname) {
      const res = await this.editAccountService.editNickname(
        etag,
        name as AccountName,
        args.nickname,
      );
      if (Result.isErr(res)) {
        return res;
      }
    }
    if (args.passphrase) {
      const res = await this.editAccountService.editPassphrase(
        etag,
        name as AccountName,
        args.passphrase,
      );
      if (Result.isErr(res)) {
        return res;
      }
    }
    if (args.email) {
      const res = await this.editAccountService.editEmail(
        etag,
        name as AccountName,
        args.email,
      );
      if (Result.isErr(res)) {
        return res;
      }
    }

    const editedBioResp = await this.editAccountService.editBio(
      etag,
      name as AccountName,
      args.bio,
    );
    if (Result.isErr(editedBioResp)) {
      return Result.err(editedBioResp[1]);
    }

    const res = await this.fetchAccountService.fetchAccount(
      name as AccountName,
    );
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

  async freezeAccount(name: string): Promise<Result.Result<Error, void>> {
    const res = await this.freezeAccountService.setFreeze(name as AccountName);
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async unFreezeAccount(name: string): Promise<Result.Result<Error, void>> {
    const res = await this.freezeAccountService.undoFreeze(name as AccountName);
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
    name: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetAccountResponseSchema>>> {
    const res = await this.fetchAccountService.fetchAccount(
      name as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      id: res[1].getID(),
      email: res[1].getMail(),
      name: res[1].getName() as string,
      nickname: res[1].getNickname(),
      bio: res[1].getBio(),
      // ToDo: fill the following fields
      avatar: '',
      header: '',
      followed_count: 0,
      following_count: 0,
      note_count: 0,
      created_at: res[1].getCreatedAt(),
      role: res[1].getRole(),
      frozen: res[1].getFrozen(),
      status: res[1].getStatus(),
      silenced: res[1].getSilenced(),
    });
  }

  async getAccountByID(
    id: string,
  ): Promise<Result.Result<Error, z.infer<typeof GetAccountResponseSchema>>> {
    const res = await this.fetchAccountService.fetchAccountByID(
      id as ID<AccountID>,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      id: res[1].getID(),
      email: res[1].getMail(),
      name: res[1].getName() as string,
      nickname: res[1].getNickname(),
      bio: res[1].getBio(),
      // ToDo: fill the following fields
      avatar: '',
      header: '',
      followed_count: 0,
      following_count: 0,
      note_count: 0,
      created_at: res[1].getCreatedAt(),
      role: res[1].getRole(),
      frozen: res[1].getFrozen(),
      status: res[1].getStatus(),
      silenced: res[1].getSilenced(),
    });
  }

  async login(
    name: string,
    passphrase: string,
  ): Promise<Result.Result<Error, z.infer<typeof LoginResponseSchema>>> {
    // ToDo: Check Captcha token
    const res = await this.authenticateAccountService.handle(
      name as AccountName,
      passphrase,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok({
      authorization_token: res[1].authorizationToken,
      refresh_token: res[1].refreshToken,
    });
  }

  async silenceAccount(name: string): Promise<Result.Result<Error, void>> {
    // ToDo: check user's permission
    const res = await this.silenceAccountService.setSilence(
      name as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async unSilenceAccount(name: string): Promise<Result.Result<Error, void>> {
    // ToDo: check user's permission
    const res = await this.silenceAccountService.undoSilence(
      name as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async followAccount(name: string): Promise<Result.Result<Error, void>> {
    // ToDo: get following account's name from request
    const res = await this.followAccountService.handle(
      '' as AccountName,
      name as AccountName,
    );
    if (Result.isErr(res)) {
      return res;
    }

    return Result.ok(undefined);
  }

  async unFollowAccount(name: string): Promise<Result.Result<Error, void>> {
    const res = await this.unfollowAccountService.handle(
      name as AccountName,
      '' as AccountName,
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
}
