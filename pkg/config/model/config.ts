import { ConfigInvalidError } from './errors.js';

export type AccountName = `@${string}@${string}`;

export interface CreateConfigArgs {
  instanceName: string;
  instanceFqdn: string;
  openRegistration: boolean;
  maintainerAccount: AccountName;
  maintainerEmail: string;
}

export class Config {
  private constructor(arg: CreateConfigArgs) {
    this.instanceName = arg.instanceName;
    this.instanceFqdn = arg.instanceFqdn;
    this.openRegistration = arg.openRegistration;
    this.maintainerAccount = arg.maintainerAccount;
    this.maintainerEmail = arg.maintainerEmail;
  }

  private readonly instanceName: string;
  getInstanceName(): string {
    return this.instanceName;
  }

  private readonly instanceFqdn: string;
  getInstanceFqdn(): string {
    return this.instanceFqdn;
  }

  private readonly openRegistration: boolean;
  isOpenRegistration(): boolean {
    return this.openRegistration;
  }

  private readonly maintainerAccount: AccountName;
  getMaintainerAccount(): AccountName {
    return this.maintainerAccount;
  }

  private readonly maintainerEmail: string;
  getMaintainerEmail(): string {
    return this.maintainerEmail;
  }

  public static new(arg: CreateConfigArgs): Config {
    if (arg.instanceName === '') {
      throw new ConfigInvalidError('instanceName is required', {
        cause: arg.instanceName,
      });
    }
    if (arg.instanceFqdn === '') {
      throw new ConfigInvalidError('instanceFqdn is required', {
        cause: arg.instanceFqdn,
      });
    }

    // validate maintainerAccount: must be exactly `@user@host` with non-empty parts and no extra `@`
    if (!/^@[^@]+@[^@]+$/.test(arg.maintainerAccount)) {
      throw new ConfigInvalidError(
        'maintainerAccount must be in @user@host format',
        { cause: arg.maintainerAccount },
      );
    }

    if (arg.maintainerEmail === '') {
      throw new ConfigInvalidError('maintainerEmail is required', {
        cause: arg.maintainerEmail,
      });
    }

    return new Config(arg);
  }
}
