import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { PrismaClient } from '../../../../adaptors/prisma/client.js';
import type { prismaClient } from '../../../../adaptors/prisma.js';
import type {
  AccountID,
  AccountName,
  AccountRole,
} from '../../../model/account.js';
import { InactiveAccount } from '../../../model/inactiveAccount.js';
import {
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
} from '../../../model/repository.js';
import { parsePrismaError } from './prisma.js';

type InactiveAccountPrismaArgs = Awaited<
  ReturnType<typeof prismaClient.inactiveAccount.findUnique>
>;

export class PrismaInactiveAccountRepository
  implements InactiveAccountRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(account: InactiveAccount): Promise<Result.Result<Error, void>> {
    const role = (
      {
        normal: 0,
        moderator: 1,
        admin: 2,
      } satisfies Record<AccountRole, number>
    )[account.getRole()];

    try {
      await this.prisma.inactiveAccount.create({
        data: {
          id: account.getID(),
          name: account.getName(),
          mail: account.getMail(),
          passphraseHash: account.getPassphraseHash(),
          role,
        },
      });
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }
    return Result.ok(undefined);
  }

  async findByName(name: string): Promise<Option.Option<InactiveAccount>> {
    const res = await this.prisma.inactiveAccount.findUnique({
      where: { name },
    });
    if (!res) {
      return Option.none();
    }
    return Option.some(this.fromPrismaArgs(res));
  }

  async findByMail(mail: string): Promise<Option.Option<InactiveAccount>> {
    const res = await this.prisma.inactiveAccount.findUnique({
      where: { mail },
    });
    if (!res) {
      return Option.none();
    }
    return Option.some(this.fromPrismaArgs(res));
  }

  async delete(id: AccountID): Promise<Result.Result<Error, void>> {
    try {
      await this.prisma.inactiveAccount.delete({
        where: { id },
      });
    } catch (e) {
      return Result.err(parsePrismaError(e));
    }
    return Result.ok(undefined);
  }

  private fromPrismaArgs(args: InactiveAccountPrismaArgs): InactiveAccount {
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

    return InactiveAccount.reconstruct({
      id: args.id as AccountID,
      name: args.name as AccountName,
      mail: args.mail,
      passphraseHash: args.passphraseHash,
      role,
    });
  }
}
export const prismaInactiveAccountRepo = (client: PrismaClient) =>
  Ether.newEther(
    inactiveAccountRepoSymbol,
    () => new PrismaInactiveAccountRepository(client),
  );
