import { Option, Result } from '@mikuroxina/mini-fn';
import { type PrismaClient } from '@prisma/client';

import type { ID } from '../../../id/type.js';
import type {
  AccountFrozen,
  AccountID,
  AccountName,
  AccountRole,
  AccountSilenced,
  AccountStatus,
} from '../../model/account.js';
import { Account } from '../../model/account.js';
import { AccountFollow } from '../../model/follow.js';
import type {
  AccountFollowRepository,
  AccountRepository,
  AccountVerifyTokenRepository,
} from '../../model/repository.js';

interface AccountPrismaArgs {
  id: string;
  name: string;
  nickname: string;
  mail: string;
  passphrase_hash: string | null;
  bio: string;
  role: number;
  frozen: number;
  silenced: number;
  status: number;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(account: Account): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.account.create({
        data: {
          ...this.toPrismaArgs(account),
        },
      });
    } catch (e) {
      return Result.err(e as Error);
    }

    return Result.ok(undefined);
  }

  async findByMail(mail: string): Promise<Option.Option<Account>> {
    const res = await this.prisma.account.findUnique({
      where: {
        mail: mail,
      },
    });
    if (!res) {
      return Option.none();
    }
    return Option.some(this.fromPrismaArgs(res));
  }

  async findByName(name: string): Promise<Option.Option<Account>> {
    const res = await this.prisma.account.findUnique({
      where: {
        name: name,
      },
    });
    if (!res) {
      return Option.none();
    }
    return Option.some(this.fromPrismaArgs(res));
  }

  private toPrismaArgs(account: Account): AccountPrismaArgs {
    const role = (
      {
        normal: 0,
        moderator: 1,
        admin: 2,
      } satisfies Record<AccountRole, number>
    )[account.getRole];

    const status = (
      {
        active: 0,
        notActivated: 1,
      } satisfies Record<AccountStatus, number>
    )[account.getStatus];

    const frozen = (
      {
        normal: 0,
        frozen: 1,
      } satisfies Record<AccountFrozen, number>
    )[account.getFrozen];

    const silenced = (
      {
        normal: 0,
        silenced: 1,
      } satisfies Record<AccountSilenced, number>
    )[account.getSilenced];

    return {
      id: account.getID,
      name: account.getName,
      nickname: account.getNickname,
      mail: account.getMail,
      passphrase_hash: account.getPassphraseHash ?? '',
      bio: account.getBio,
      role: role,
      frozen: frozen,
      silenced: silenced,
      status: status,
      created_at: account.getCreatedAt,
      updated_at: !account.getUpdatedAt ? null : account.getUpdatedAt,
      deleted_at: !account.getDeletedAt ? null : account.getDeletedAt,
    };
  }

  private fromPrismaArgs(args: AccountPrismaArgs): Account {
    const role =
      (
        {
          0: 'normal',
          1: 'moderator',
          2: 'admin',
        } satisfies Record<number, AccountRole>
      )[args.role] ?? 'normal';

    const status =
      (
        {
          0: 'active',
          1: 'notActivated',
        } satisfies Record<number, AccountStatus>
      )[args.status] ?? 'active';

    const frozen =
      (
        {
          0: 'normal',
          1: 'frozen',
        } satisfies Record<number, AccountFrozen>
      )[args.frozen] ?? 'normal';

    const silenced =
      (
        {
          1: 'silenced',
          0: 'normal',
        } satisfies Record<number, AccountSilenced>
      )[args.silenced] ?? 'normal';

    return Account.reconstruct({
      id: args.id as ID<AccountID>,
      name: args.name as AccountName,
      nickname: args.nickname,
      mail: args.mail,
      passphraseHash:
        args.passphrase_hash === null ? undefined : args.passphrase_hash,
      bio: args.bio,
      role: role,
      frozen: frozen,
      silenced: silenced,
      status: status,
      createdAt: args.created_at,
      deletedAt: args.deleted_at === null ? undefined : args.deleted_at,
      updatedAt: args.updated_at === null ? undefined : args.updated_at,
    });
  }
}

export class PrismaAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    accountID: ID<AccountID>,
    token: string,
    expire: Date,
  ): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.account_verify_token.create({
        data: {
          account_id: accountID,
          token: token,
          expires_at: expire,
        },
      });
    } catch (e) {
      return Result.err(e as Error);
    }
    return Result.ok(undefined);
  }

  async findByID(
    id: ID<AccountID>,
  ): Promise<Option.Option<{ token: string; expire: Date }>> {
    const res = await this.prisma.account_verify_token.findUnique({
      where: {
        account_id: id,
      },
    });

    if (!res) {
      return Option.none();
    }
    return Option.some({
      token: res.token,
      expire: res.expires_at,
    });
  }
}

interface AccountFollowPrismaArgs {
  from_id: string;
  to_id: string;
  created_at: Date;
  deleted_at: Date | null;
}

export class PrismaAccountFollowRepository implements AccountFollowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async follow(follow: AccountFollow): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.following.create({
        data: {
          from_id: follow.getFromID(),
          to_id: follow.getTargetID(),
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async unfollow(
    fromID: ID<AccountID>,
    targetID: ID<AccountID>,
  ): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.following.update({
        where: {
          from_id_to_id: {
            from_id: fromID,
            to_id: targetID,
          },
        },
        data: {
          deleted_at: new Date(),
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e as Error);
    }
  }

  async fetchAllFollowers(
    accountID: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = await this.prisma.following.findMany({
      where: {
        to_id: accountID,
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }
  async fetchAllFollowing(
    accountID: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = await this.prisma.following.findMany({
      where: {
        from_id: accountID,
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }

  async fetchOrderedFollowers(
    accountID: ID<AccountID>,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = await this.prisma.following.findMany({
      where: {
        to_id: accountID,
      },
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }

  async fetchOrderedFollowing(
    accountID: ID<AccountID>,
    limit: number,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = await this.prisma.following.findMany({
      where: {
        from_id: accountID,
      },
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }

  private fromPrismaArgs(args: AccountFollowPrismaArgs): AccountFollow {
    return AccountFollow.reconstruct({
      fromID: args.from_id as ID<AccountID>,
      targetID: args.to_id as ID<AccountID>,
      createdAt: args.created_at,
      deletedAt: args.deleted_at === null ? undefined : args.deleted_at,
    });
  }
}
