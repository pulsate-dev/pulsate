import { Ether, Option, Result } from '@mikuroxina/mini-fn';
import type { InactiveAccount } from '../../../model/inactiveAccount.js';
import {
  type InactiveAccountRepository,
  inactiveAccountRepoSymbol,
} from '../../../model/repository.js';

export class InMemoryInactiveAccountRepository
  implements InactiveAccountRepository
{
  private data: Set<InactiveAccount>;

  constructor() {
    this.data = new Set();
  }

  create(account: InactiveAccount): Promise<Result.Result<Error, void>> {
    this.data.add(account);
    return Promise.resolve(Result.ok(undefined));
  }

  reset(): void {
    this.data.clear();
  }

  findByName(name: string): Promise<Option.Option<InactiveAccount>> {
    const account = Array.from(this.data).find((a) => a.getName() === name);
    if (!account) {
      return Promise.resolve(Option.none());
    }
    return Promise.resolve(Option.some(account));
  }

  findByMail(mail: string): Promise<Option.Option<InactiveAccount>> {
    const account = Array.from(this.data).find((a) => a.getMail() === mail);
    if (!account) {
      return Promise.resolve(Option.none());
    }

    return Promise.resolve(Option.some(account));
  }
}

export const inactiveAccountRepo = Ether.newEther(
  inactiveAccountRepoSymbol,
  () => new InMemoryInactiveAccountRepository(),
);
