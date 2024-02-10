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
import type {
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
  readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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
    try {
      const res = await this.prisma.account.findUnique({
        where: {
          mail: mail,
        },
      });
      if (!res) {
        return Option.none();
      }
      return Option.some(this.fromPrismaArgs(res));
    } catch (e) {
      return Option.none();
    }
  }

  async findByName(name: string): Promise<Option.Option<Account>> {
    try {
      const res = await this.prisma.account.findUnique({
        where: {
          name: name,
        },
      });
      if (!res) {
        return Option.none();
      }
      return Option.some(this.fromPrismaArgs(res));
    } catch (e) {
      return Option.none();
    }
  }

  private toPrismaArgs(account: Account): AccountPrismaArgs {
    const role = ((role: AccountRole) => {
      switch (role) {
        case 'normal':
          return 0;
        case 'moderator':
          return 1;
        case 'admin':
          return 2;
      }
    })(account.getRole);

    const status = ((status: AccountStatus) => {
      switch (status) {
        case 'active':
          return 0;
        case 'notActivated':
          return 1;
      }
    })(account.getStatus);

    const frozen = ((frozen: AccountFrozen) => {
      switch (frozen) {
        case 'frozen':
          return 1;
        case 'normal':
          return 0;
      }
    })(account.getFrozen);

    const silenced = ((silenced: AccountSilenced) => {
      switch (silenced) {
        case 'silenced':
          return 1;
        case 'normal':
          return 0;
      }
    })(account.getSilenced);

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
    return Account.reconstruct({
      id: args.id as ID<AccountID>,
      name: args.name as AccountName,
      nickname: args.nickname,
      mail: args.mail,
      passphraseHash:
        args.passphrase_hash === null ? undefined : args.passphrase_hash,
      bio: args.bio,
      role: ((role: number) => {
        switch (role) {
          case 0:
            return 'normal';
          case 1:
            return 'moderator';
          case 2:
            return 'admin';
          default:
            return 'normal';
        }
      })(args.role),
      frozen: ((frozen: number) => {
        switch (frozen) {
          case 0:
            return 'normal';
          case 1:
            return 'frozen';
          default:
            return 'normal';
        }
      })(args.frozen),
      silenced: ((silenced: number) => {
        switch (silenced) {
          case 0:
            return 'normal';
          case 1:
            return 'silenced';
          default:
            return 'normal';
        }
      })(args.silenced),
      status: ((status: number) => {
        switch (status) {
          case 0:
            return 'active';
          case 1:
            return 'notActivated';
          default:
            return 'active';
        }
      })(args.status),
      createdAt: args.created_at,
      deletedAt: args.deleted_at === null ? undefined : args.deleted_at,
      updatedAt: args.updated_at === null ? undefined : args.updated_at,
    });
  }
}

export class PrismaAccountVerifyTokenRepository
  implements AccountVerifyTokenRepository
{
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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
    try {
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
    } catch (e) {
      return Option.none();
    }
  }
}
