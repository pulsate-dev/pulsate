import type { ID } from '../../id/type.js';
import {
  Account,
  type AccountID,
  type AccountName,
  type CreateAccountArgs,
} from './account.js';

export interface CreateInactiveAccountArgs {
  id: ID<AccountID>;
  name: AccountName;
  mail: string;
  activated: boolean;
}

export interface ActivateArgs
  extends Omit<
    CreateAccountArgs,
    keyof Omit<CreateInactiveAccountArgs, 'activated'>
  > {}

export class AlreadyActivatedError extends Error {
  constructor(message?: string) {
    if (message) {
      super('This account was already activated.');
    }
    super(message);
  }
}

export class InactiveAccount {
  constructor(arg: CreateInactiveAccountArgs) {
    this.id = arg.id;
    this.name = arg.name;
    this.mail = arg.mail;
    this.activated = arg.activated;
  }

  private activated: boolean;
  get isActivated(): boolean {
    return this.activated;
  }

  private readonly id: ID<AccountID>;
  get getID(): string {
    return this.id;
  }

  private readonly name: AccountName;
  get getName(): string {
    return this.name;
  }

  private readonly mail: string;
  get getMail(): string {
    return this.mail;
  }

  public activate(args: ActivateArgs): Account {
    if (this.isActivated) {
      throw new AlreadyActivatedError();
    }

    this.activated = true;
    return Account.new({
      id: this.id,
      name: this.name,
      mail: this.mail,
      ...args,
    });
  }

  static new(arg: CreateInactiveAccountArgs): InactiveAccount {
    return new InactiveAccount(arg);
  }
}
