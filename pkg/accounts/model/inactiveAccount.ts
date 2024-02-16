import { Account, type CreateAccountArgs } from './account.js';

export class AlreadyActivatedError extends Error {
  constructor(message?: string) {
    if (message) {
      super('This account was already activated.');
    }
    super(message);
  }
}

export class InactiveAccount {
  constructor(arg: CreateAccountArgs) {
    this.activated = false;
    this.createAccountArgs = arg;
  }

  private activated: boolean;
  get isActivated(): boolean {
    return this.activated;
  }

  private createAccountArgs: CreateAccountArgs;
  public activate(): Account {
    if (this.isActivated) {
      throw new AlreadyActivatedError();
    }

    this.activated = true;
    return Account.new(this.createAccountArgs);
  }

  static new(arg: CreateAccountArgs): InactiveAccount {
    return new InactiveAccount(arg);
  }
}
