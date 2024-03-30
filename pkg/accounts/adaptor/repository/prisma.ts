import { Option, Result } from '@mikuroxina/mini-fn';
import { type PrismaClient } from '@prisma/client';

import type { ID } from '../../../id/type.js';
import {
  Account,
  type AccountFrozen,
  type AccountID,
  type AccountName,
  type AccountRole,
  type AccountSilenced,
  type AccountStatus,
} from '../../model/account.js';
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
  passphraseHash: string | null;
  bio: string;
  role: number;
  frozen: number;
  silenced: number;
  status: number;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
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

  async findByID(id: ID<AccountID>): Promise<Option.Option<Account>> {
    const res = await this.prisma.account.findUnique({
      where: {
        id: id,
      },
    });
    if (!res) {
      return Option.none();
    }

    return Option.some(this.fromPrismaArgs(res));
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
    )[account.getRole()];

    const status = (
      {
        active: 0,
        notActivated: 1,
      } satisfies Record<AccountStatus, number>
    )[account.getStatus()];

    const frozen = (
      {
        normal: 0,
        frozen: 1,
      } satisfies Record<AccountFrozen, number>
    )[account.getFrozen()];

    const silenced = (
      {
        normal: 0,
        silenced: 1,
      } satisfies Record<AccountSilenced, number>
    )[account.getSilenced()];

    return {
      id: account.getID(),
      name: account.getName(),
      nickname: account.getNickname(),
      mail: account.getMail(),
      passphraseHash: account.getPassphraseHash() ?? '',
      bio: account.getBio(),
      role: role,
      frozen: frozen,
      silenced: silenced,
      status: status,
      createdAt: account.getCreatedAt(),
      updatedAt: account.getUpdatedAt() ?? null,
      deletedAt: account.getDeletedAt() ?? null,
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
        args.passphraseHash === null ? undefined : args.passphraseHash,
      bio: args.bio,
      role: role,
      frozen: frozen,
      silenced: silenced,
      status: status,
      createdAt: args.createdAt,
      deletedAt: args.deletedAt === null ? undefined : args.deletedAt,
      updatedAt: args.updatedAt === null ? undefined : args.updatedAt,
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
      await this.prisma.accountVerifyToken.create({
        data: {
          accountId: accountID,
          token: token,
          expiresAt: expire,
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
    const res = await this.prisma.accountVerifyToken.findUnique({
      where: {
        accountId: id,
      },
    });

    if (!res) {
      return Option.none();
    }
    return Option.some({
      token: res.token,
      expire: res.expiresAt,
    });
  }
}

interface AccountFollowPrismaArgs {
  fromId: string;
  toId: string;
  createdAt: Date;
  deletedAt: Date | null;
}

export class PrismaAccountFollowRepository implements AccountFollowRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async follow(follow: AccountFollow): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.following.create({
        data: {
          fromId: follow.getFromID(),
          toId: follow.getTargetID(),
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
          fromId_toId: {
            fromId: fromID,
            toId: targetID,
          },
        },
        data: {
          deletedAt: new Date(),
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
        toId: accountID,
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }
  async fetchAllFollowing(
    accountID: ID<AccountID>,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = await this.prisma.following.findMany({
      where: {
        fromId: accountID,
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
        toId: accountID,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
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
        fromId: accountID,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }

  private fromPrismaArgs(args: AccountFollowPrismaArgs): AccountFollow {
    return AccountFollow.reconstruct({
      fromID: args.fromId as ID<AccountID>,
      targetID: args.toId as ID<AccountID>,
      createdAt: args.createdAt,
      deletedAt: args.deletedAt === null ? undefined : args.deletedAt,
    });
  }
}
