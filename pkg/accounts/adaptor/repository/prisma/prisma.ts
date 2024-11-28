import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import { Prisma, type PrismaClient } from '@prisma/client';

import type { prismaClient } from '../../../../adaptors/prisma.js';
import {
  Account,
  type AccountFrozen,
  type AccountID,
  type AccountName,
  type AccountRole,
  type AccountSilenced,
  type AccountStatus,
} from '../../../model/account.js';
import {
  AccountInternalError,
  AccountNotFoundError,
} from '../../../model/errors.js';
import { AccountFollow } from '../../../model/follow.js';
import {
  type AccountFollowRepository,
  type AccountRepository,
  type AccountVerifyTokenRepository,
  accountRepoSymbol,
  followRepoSymbol,
  verifyTokenRepoSymbol,
} from '../../../model/repository.js';

type AccountPrismaArgs = Prisma.PromiseReturnType<
  typeof prismaClient.account.findUnique
>;

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
      return Result.err(parsePrismaError(e));
    }

    return Result.ok(undefined);
  }

  async findByID(id: AccountID): Promise<Option.Option<Account>> {
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

  async findManyByID(
    id: readonly AccountID[],
  ): Promise<Result.Result<Error, Account[]>> {
    const res = await this.prisma.account.findMany({
      where: {
        id: {
          in: id as AccountID[],
        },
      },
    });

    return Result.ok(res.map((a) => this.fromPrismaArgs(a)));
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

  async edit(account: Account): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.account.update({
        where: { id: account.getID() },
        data: this.toPrismaArgs(account),
      });
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }

    return Result.ok(undefined);
  }

  private toPrismaArgs(account: Account): Prisma.AccountCreateInput {
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
    if (args === null) {
      throw new Error('failed to serialize');
    }
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
      id: args.id as AccountID,
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
export const prismaAccountRepo = (client: PrismaClient) =>
  Ether.newEther(accountRepoSymbol, () => new PrismaAccountRepository(client));

export class PrismaAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    accountID: AccountID,
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
      return Result.err(parsePrismaError(e));
    }
    return Result.ok(undefined);
  }

  async findByID(
    id: AccountID,
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

  async delete(id: AccountID): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.accountVerifyToken.delete({
        where: {
          accountId: id,
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }
  }
}
export const prismaVerifyTokenRepo = (client: PrismaClient) =>
  Ether.newEther(
    verifyTokenRepoSymbol,
    () => new PrismaAccountVerifyTokenRepository(client),
  );

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
      return Result.err(parsePrismaError(e));
    }
  }

  async unfollow(
    fromID: AccountID,
    targetID: AccountID,
  ): Promise<Result.Result<Error, void>> {
    try {
      // ToDo: Should replace with a hard delete. It can't follow it back again due to a composite primary key.
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
      return Result.err(parsePrismaError(e));
    }
  }

  async fetchAllFollowers(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = await this.prisma.following.findMany({
      where: {
        toId: accountID,
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }
  async fetchAllFollowing(
    accountID: AccountID,
  ): Promise<Result.Result<Error, AccountFollow[]>> {
    const res = await this.prisma.following.findMany({
      where: {
        fromId: accountID,
      },
    });
    return Result.ok(res.map((f) => this.fromPrismaArgs(f)));
  }

  async fetchOrderedFollowers(
    accountID: AccountID,
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
    accountID: AccountID,
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
      fromID: args.fromId as AccountID,
      targetID: args.toId as AccountID,
      createdAt: args.createdAt,
      deletedAt: args.deletedAt === null ? undefined : args.deletedAt,
    });
  }
}
export const prismaFollowRepo = (client: PrismaClient) =>
  Ether.newEther(
    followRepoSymbol,
    () => new PrismaAccountFollowRepository(client),
  );

export const parsePrismaError = (e: unknown): Error => {
  // NOTE: cf. prisma error reference: https://www.prisma.io/docs/orm/reference/error-reference
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2001':
        return new AccountNotFoundError(e.message, { cause: e });
      case 'P2015':
        return new AccountNotFoundError(e.message, { cause: e });
      case 'P2018':
        return new AccountNotFoundError(e.message, { cause: e });
      case 'P2025':
        return new AccountNotFoundError(e.message, { cause: e });
      default:
        return new AccountInternalError(e.message, { cause: e });
    }
  }
  return new AccountInternalError('unknown error', { cause: e });
};
